from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.dependencies import get_auth_service, get_firebase_service
from app.interfaces.auth import IAuthService
from app.models.user import LoginRequest, RegisterRequest, FirebaseLoginRequest
from app.services.firebase_service import FirebaseService

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_response(user: dict, user_id: str) -> dict:
    return {
        "id": user_id,
        "name": user.get("name"),
        "email": user.get("email"),
        "phone_number": user.get("phone_number"),
        "firebase_uid": user.get("firebase_uid"),
        "role": user["role"],
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    db=Depends(get_db),
    auth: IAuthService = Depends(get_auth_service),
):
    email = body.email.strip().lower()

    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    doc = {
        "name": body.name.strip(),
        "email": email,
        "password": auth.hash_password(body.password),
        "role": body.role,
        "is_active": True,
        "profile_image": None,
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)

    return {
        "access_token": auth.create_access_token({"sub": user_id, "role": body.role}),
        "refresh_token": auth.create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
        "user": _user_response(doc, user_id),
    }


@router.post("/login")
async def login(
    body: LoginRequest,
    db=Depends(get_db),
    auth: IAuthService = Depends(get_auth_service),
):
    email = body.email.strip().lower()

    user = await db.users.find_one({"email": email})
    if not user or not auth.verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is disabled")

    user_id = str(user["_id"])
    return {
        "access_token": auth.create_access_token({"sub": user_id, "role": user["role"]}),
        "refresh_token": auth.create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
        "user": _user_response(user, user_id),
    }


@router.post("/firebase-login")
async def firebase_login(
    body: FirebaseLoginRequest,
    db=Depends(get_db),
    auth: IAuthService = Depends(get_auth_service),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    # Verify the Firebase token
    decoded_token = firebase.verify_id_token(body.id_token)
    uid = decoded_token.get("uid")
    phone_number = decoded_token.get("phone_number")
    
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid Firebase token: missing UID")
        
    # Check if user already exists
    query = [{"firebase_uid": uid}]
    if phone_number:
        query.append({"phone_number": phone_number})
        
    user = await db.users.find_one({"$or": query})
    
    if not user:
        # Create a new user
        doc = {
            "name": None,
            "email": None,
            "phone_number": phone_number,
            "firebase_uid": uid,
            "password": None, # No password needed for Firebase users
            "role": body.role,
            "is_active": True,
            "profile_image": None,
            "created_at": datetime.utcnow(),
        }
        result = await db.users.insert_one(doc)
        user_id = str(result.inserted_id)
        user = doc
    else:
        user_id = str(user["_id"])
        
        # If user existed before but didn't have firebase_uid linked, link it now
        if not user.get("firebase_uid"):
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"firebase_uid": uid}})

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is disabled")

    return {
        "access_token": auth.create_access_token({"sub": user_id, "role": user["role"]}),
        "refresh_token": auth.create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
        "user": _user_response(user, user_id),
    }


@router.post("/refresh")
async def refresh(
    body: dict,
    db=Depends(get_db),
    auth: IAuthService = Depends(get_auth_service),
):
    payload = auth.decode_token(body.get("refresh_token", ""))
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user_id = str(user["_id"])
    return {
        "access_token": auth.create_access_token({"sub": user_id, "role": user["role"]}),
        "token_type": "bearer",
    }
