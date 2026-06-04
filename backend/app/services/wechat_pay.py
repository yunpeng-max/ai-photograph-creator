"""
WeChat Pay V3 API Client.

Handles: RSA-SHA256 signing, AES-256-GCM decryption,
native payment creation, callback signature verification,
and active order status querying.

Does NOT depend on SQLAlchemy or application models.
"""

import base64
import json
import os
import secrets
import time
from typing import Any

import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


WECHAT_API_HOST = "https://api.mch.weixin.qq.com"
NONCE_LENGTH = 32


class WechatPayError(Exception):
    """Raised when the WeChat Pay API returns an error."""

    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(f"[{status_code}] {code}: {message}")


# ---------------------------------------------------------------------------
# Private key helpers
# ---------------------------------------------------------------------------

def _load_private_key(file_path: str, inline_key: str) -> rsa.RSAPrivateKey:
    """Load the merchant private key from a file, falling back to an env var."""
    pem: str | None = None

    if file_path and os.path.isfile(file_path):
        with open(file_path, "rb") as fh:
            pem = fh.read().decode("utf-8")
    elif inline_key:
        pem = inline_key

    if not pem:
        raise ValueError(
            "WeChat private key not found. Set WECHAT_PRIVATE_KEY_PATH "
            "or WECHAT_PRIVATE_KEY environment variable."
        )

    key = serialization.load_sslv2_pem_private_key(pem.encode("utf-8"), password=None)
    if not isinstance(key, rsa.RSAPrivateKey):
        raise TypeError("Expected an RSA private key")
    return key


# ---------------------------------------------------------------------------
# Request signing
# ---------------------------------------------------------------------------

def _build_signature(
    private_key: rsa.RSAPrivateKey,
    method: str,
    url_path: str,
    timestamp: int,
    nonce_str: str,
    body: str,
) -> str:
    """Build the RSA-SHA256 signature required by WeChat Pay V3."""
    message = f"{method}\n{url_path}\n{timestamp}\n{nonce_str}\n{body}\n"
    signature = private_key.sign(
        message.encode("utf-8"),
        padding.PKCS1v15(),
        hashes.SHA256(),
    )
    return base64.b64encode(signature).decode("utf-8")


def _build_authorization(
    mch_id: str,
    serial_no: str,
    private_key: rsa.RSAPrivateKey,
    method: str,
    url_path: str,
    body: str,
) -> str:
    timestamp = int(time.time())
    nonce_str = secrets.token_hex(NONCE_LENGTH // 2)
    sig = _build_signature(private_key, method, url_path, timestamp, nonce_str, body)
    return (
        f'WECHATPAY2-SHA256-RSA2048 mchid="{mch_id}",'
        f'nonce_str="{nonce_str}",'
        f'timestamp="{timestamp}",'
        f'serial_no="{serial_no}",'
        f'signature="{sig}"'
    )


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

async def _request(
    method: str,
    path: str,
    mch_id: str,
    serial_no: str,
    private_key: rsa.RSAPrivateKey,
    body: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Send a signed request to the WeChat Pay V3 API."""
    url = f"{WECHAT_API_HOST}{path}"
    body_str = json.dumps(body) if body else ""
    auth = _build_authorization(mch_id, serial_no, private_key, method, path, body_str)

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.request(
            method=method,
            url=url,
            content=body_str.encode("utf-8") if body_str else None,
            headers={
                "Authorization": auth,
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "ai-photo-creator/1.0",
            },
        )

    if resp.status_code in (200, 202, 204):
        return resp.json() if resp.content else {}

    try:
        err = resp.json()
        raise WechatPayError(
            resp.status_code,
            err.get("code", "UNKNOWN"),
            err.get("message", resp.text),
        )
    except json.JSONDecodeError:
        raise WechatPayError(resp.status_code, "UNKNOWN", resp.text)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class WechatPayClient:
    """Stateless client for WeChat Pay V3 operations."""

    def __init__(
        self,
        mch_id: str,
        api_v3_key: str,
        serial_no: str,
        private_key_path: str,
        private_key_inline: str,
        app_id: str,
        notify_url: str,
    ):
        self.mch_id = mch_id
        self.api_v3_key = api_v3_key
        self.serial_no = serial_no
        self._private_key_path = private_key_path
        self._private_key_inline = private_key_inline
        self.app_id = app_id
        self.notify_url = notify_url
        self._pk: rsa.RSAPrivateKey | None = None

    @property
    def _private_key(self) -> rsa.RSAPrivateKey:
        if self._pk is None:
            self._pk = _load_private_key(
                self._private_key_path, self._private_key_inline
            )
        return self._pk

    async def create_native_payment(
        self,
        out_trade_no: str,
        description: str,
        amount_cents: int,
    ) -> dict[str, Any]:
        """
        Create a WeChat Pay Native payment order.

        Returns the API response dict, which contains 'code_url'
        (the QR code content the user scans to pay).
        """
        body = {
            "appid": self.app_id,
            "mchid": self.mch_id,
            "description": description,
            "out_trade_no": out_trade_no,
            "notify_url": self.notify_url,
            "amount": {
                "total": amount_cents,
                "currency": "CNY",
            },
        }
        return await _request(
            "POST",
            "/v3/pay/transactions/native",
            self.mch_id,
            self.serial_no,
            self._private_key,
            body,
        )

    async def query_order(self, out_trade_no: str) -> dict[str, Any]:
        """Actively query a payment order's status."""
        path = f"/v3/pay/transactions/out-trade-no/{out_trade_no}"
        params = {"mchid": self.mch_id}
        return await _request(
            "GET",
            f"{path}?mchid={self.mch_id}",
            self.mch_id,
            self.serial_no,
            self._private_key,
        )

    def verify_callback_signature(
        self,
        wechatpay_timestamp: str,
        wechatpay_nonce: str,
        wechatpay_signature: str,
        body: str,
    ) -> bool:
        """Verify the signature on a WeChat callback notification."""
        message = f"{wechatpay_timestamp}\n{wechatpay_nonce}\n{body}\n"
        try:
            self.private_key.public_key().verify(
                base64.b64decode(wechatpay_signature),
                message.encode("utf-8"),
                padding.PKCS1v15(),
                hashes.SHA256(),
            )
            return True
        except Exception:
            return False

    def decrypt_callback_resource(
        self,
        nonce: str,
        ciphertext: str,
        associated_data: str,
    ) -> dict[str, Any]:
        """
        Decrypt the callback notification's resource field.

        Uses AES-256-GCM with the APIv3 key.
        """
        key = self.api_v3_key.encode("utf-8")
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(
            nonce.encode("utf-8"),
            base64.b64decode(ciphertext) + base64.b64decode(associated_data),
            None,
        )
        return json.loads(plaintext.decode("utf-8"))


def get_wechat_pay_client() -> WechatPayClient | None:
    """
    Factory that reads configuration from the application settings.
    Returns None if WeChat Pay is not configured (graceful degradation).
    """
    from app.config import get_settings

    settings = get_settings()

    if not settings.wechat_mch_id or not settings.wechat_api_v3_key:
        return None

    return WechatPayClient(
        mch_id=settings.wechat_mch_id,
        api_v3_key=settings.wechat_api_v3_key,
        serial_no=settings.wechat_serial_no,
        private_key_path=settings.wechat_private_key_path,
        private_key_inline=settings.wechat_private_key,
        app_id=settings.wechat_app_id,
        notify_url=settings.wechat_notify_url,
    )
