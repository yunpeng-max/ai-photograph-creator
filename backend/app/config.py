from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    # Database
    database_url: str = "postgresql+asyncpg://ai_photo:ai_photo@localhost:5432/ai_photo"

    # JWT
    secret_key: str = "change-me-to-a-random-32-char-string"
    access_token_expire_minutes: int = 10080  # 7 days
    algorithm: str = "HS256"

    # DashScope (Alibaba Cloud)
    dashscope_api_key: str = ""
    dashscope_model: str = "qwen-image-2.0"
    dashscope_base_url: str = "https://dashscope.aliyuncs.com/api/v1"

    # CORS
    allowed_origins: str = "http://localhost:5173"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Uploads
    upload_dir: str = "/app/uploads"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
