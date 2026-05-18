from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
    )

    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "mykirana"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # SMS — set DEV_MODE=true to skip SMS and return OTP in the response
    dev_mode: bool = True
    sms_api_key: str = ""
    otp_expire_minutes: int = 5


settings = Settings()
