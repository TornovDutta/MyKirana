from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
    )

    # Database
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "mykirana"

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # SMS / OTP
    dev_mode: bool = True
    sms_api_key: str = ""

    # File upload
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 5

    # Delivery routing
    delivery_base_fee: float = 20.0
    delivery_fee_per_km: float = 2.0
    max_routing_radius_km: float = 10.0

    # Razorpay
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""


settings = Settings()
