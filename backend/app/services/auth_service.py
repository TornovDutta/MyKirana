from datetime import datetime, timedelta
from typing import Optional
import random
import string
from jose import JWTError, jwt
from app.config import settings


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def otp_expiry() -> datetime:
    return datetime.utcnow() + timedelta(minutes=settings.otp_expire_minutes)


def create_access_token(data: dict) -> str:
    payload = {
        **data,
        "exp": datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes),
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(data: dict) -> str:
    payload = {
        **data,
        "exp": datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None
