import asyncio
import subprocess
import time
import uuid
from pathlib import Path

import dashscope
from dashscope import MultiModalConversation

from app.config import get_settings

settings = get_settings()

# Aspect ratio → DashScope size mapping
ASPECT_RATIO_SIZE_MAP = {
    "1:1": "2048*2048",
    "4:3": "2368*1728",
    "3:4": "1728*2368",
    "16:9": "2688*1536",
    "9:16": "1536*2688",
    "3:2": "2496*1664",
    "2:3": "1664*2496",
}


def _aspect_ratio_to_size(aspect_ratio: str) -> str:
    """Convert aspect ratio string to DashScope size parameter."""
    return ASPECT_RATIO_SIZE_MAP.get(aspect_ratio, "2048*2048")


async def generate_image(prompt: str, aspect_ratio: str = "1:1") -> bytes:
    """
    Call DashScope qwen-image-2.0 API to generate an image from the prompt.
    Returns the image as bytes.
    """
    dashscope.base_http_api_url = settings.dashscope_base_url
    size = _aspect_ratio_to_size(aspect_ratio)

    messages = [
        {
            "role": "user",
            "content": [{"text": prompt}],
        }
    ]

    # DashScope MultiModalConversation is synchronous, run in thread pool
    response = await asyncio.to_thread(
        MultiModalConversation.call,
        api_key=settings.dashscope_api_key,
        model=settings.dashscope_model,
        messages=messages,
        result_format="message",
        stream=False,
        watermark=False,
        prompt_extend=True,
        size=size,
    )

    if response.status_code != 200:
        error_msg = f"{response.code}: {response.message}" if hasattr(response, "code") else str(response)
        raise RuntimeError(f"DashScope API error (HTTP {response.status_code}): {error_msg}")

    # Extract image URL from response
    try:
        content = response.output.choices[0].message.content[0]
        # DashScope may return content as a dict or an object
        image_url = content["image"] if isinstance(content, dict) else content.image
    except (AttributeError, IndexError, KeyError, TypeError) as e:
        raise ValueError(f"Unexpected DashScope response format: {e}")

    if not image_url:
        raise ValueError("No image URL returned from DashScope API")

    # Download the image (URL is valid for 24 hours)
    image_bytes = await asyncio.to_thread(_download_image, image_url)
    return image_bytes


def _download_image(url: str, max_retries: int = 3) -> bytes:
    """Download image bytes from a URL using curl for maximum compatibility."""
    last_error = None
    for attempt in range(max_retries):
        try:
            result = subprocess.run(
                [
                    "curl", "-sS", "--connect-timeout", "15",
                    "--max-time", "120", "--retry", "3",
                    "-o", "-", url,
                ],
                capture_output=True,
                timeout=130,
                check=True,
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            last_error = e
            if e.stderr:
                last_error = RuntimeError(e.stderr.decode(errors="replace").strip())
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            last_error = e
        if attempt < max_retries - 1:
            time.sleep(2 ** (attempt + 1))  # 2s, 4s, 8s
    raise RuntimeError(f"Failed to download image after {max_retries} retries: {last_error}")


async def save_image(image_bytes: bytes) -> str:
    """
    Save the generated image to the upload directory.
    Returns the relative path to the image.
    """
    filename = f"{uuid.uuid4()}.png"
    upload_dir = Path(settings.upload_dir).resolve()

    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / filename
    await asyncio.to_thread(_write_file, file_path, image_bytes)

    return f"/images/{filename}"


def _write_file(path: Path, data: bytes) -> None:
    """Write binary data to a file (sync I/O for thread pool)."""
    with open(path, "wb") as f:
        f.write(data)
