from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from app.config import Settings


class AuthService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def verify_password(self, plain: str, hashed: str) -> bool:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

    def create_access_token(self, data: dict) -> str:
        payload = {
            **data,
            "exp": datetime.utcnow() + timedelta(minutes=self._settings.access_token_expire_minutes),
            "type": "access",
        }
        return jwt.encode(payload, self._settings.secret_key, algorithm=self._settings.algorithm)

    def create_refresh_token(self, data: dict) -> str:
        payload = {
            **data,
            "exp": datetime.utcnow() + timedelta(days=self._settings.refresh_token_expire_days),
            "type": "refresh",
        }
        return jwt.encode(payload, self._settings.secret_key, algorithm=self._settings.algorithm)

    def decode_token(self, token: str) -> Optional[dict]:
        try:
            return jwt.decode(token, self._settings.secret_key, algorithms=[self._settings.algorithm])
        except JWTError:
            return None
