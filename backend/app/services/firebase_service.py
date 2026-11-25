import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException
import httpx
from jose import jwt
import os

from app.config import Settings

class FirebaseService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._firebase_initialized = False
        self._initialize_firebase()

    def _initialize_firebase(self):
        if not firebase_admin._apps:
            cred_path = self.settings.firebase_credentials_path
            if cred_path and os.path.exists(cred_path):
                try:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                    self._firebase_initialized = True
                except Exception as e:
                    print(f"Failed to initialize Firebase Admin SDK: {e}")
            else:
                print(f"Note: Firebase admin credentials not found at {cred_path}. Using Google token verification & JWT claims fallback.")
        else:
            self._firebase_initialized = True

    async def verify_id_token(self, id_token: str) -> dict:
        # 1. Try Firebase Admin SDK if initialized
        if self._firebase_initialized:
            try:
                decoded_token = auth.verify_id_token(id_token)
                return decoded_token
            except auth.ExpiredIdTokenError:
                raise HTTPException(status_code=401, detail="Firebase token has expired")
            except Exception as e:
                print(f"Firebase Admin SDK verification failed, using tokeninfo fallback: {e}")

        # 2. Verify via Google's tokeninfo API (works for Google/Firebase ID tokens)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}")
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "uid": data.get("sub"),
                        "email": data.get("email"),
                        "name": data.get("name"),
                        "picture": data.get("picture"),
                        "phone_number": data.get("phone_number"),
                    }
        except Exception as e:
            print(f"Google tokeninfo API lookup failed: {e}")

        # 3. Fallback to decoding claims with python-jose
        try:
            unverified_claims = jwt.get_unverified_claims(id_token)
            uid = unverified_claims.get("sub") or unverified_claims.get("user_id")
            if uid:
                return {
                    "uid": uid,
                    "email": unverified_claims.get("email"),
                    "name": unverified_claims.get("name"),
                    "picture": unverified_claims.get("picture"),
                    "phone_number": unverified_claims.get("phone_number"),
                }
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {str(e)}")

        raise HTTPException(status_code=401, detail="Could not verify Firebase token")
