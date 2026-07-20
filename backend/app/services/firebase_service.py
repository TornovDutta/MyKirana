import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException
import os

from app.config import Settings

class FirebaseService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._initialize_firebase()

    def _initialize_firebase(self):
        if not firebase_admin._apps:
            cred_path = self.settings.firebase_credentials_path
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                print(f"Warning: Firebase credentials not found at {cred_path}. Phone auth will fail.")

    def verify_id_token(self, id_token: str) -> dict:
        try:
            # Verify the ID token and return the decoded token
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except auth.ExpiredIdTokenError:
            raise HTTPException(status_code=401, detail="Firebase token has expired")
        except auth.InvalidIdTokenError:
            raise HTTPException(status_code=401, detail="Invalid Firebase token")
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Firebase auth error: {str(e)}")
