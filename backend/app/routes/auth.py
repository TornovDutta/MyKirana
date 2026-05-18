from fastapi import APIRouter, HTTPException, status, Depends
from app.database import get_db
from app.models.user import RegisterRequest, LoginRequest
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_response(user: dict, user_id: str) -> dict:
    return {
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db=Depends(get_db)):
    email = body.email.strip().lower()

    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    doc = {
        "name": body.name.strip(),
        "email": email,
        "password": hash_password(body.password),
        "role": body.role,
        "is_active": True,
        "profile_image": None,
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)

    return {
        "access_token": create_access_token({"sub": user_id, "role": body.role}),
        "refresh_token": create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
        "user": _user_response(doc, user_id),
    }


@router.post("/login")
async def login(body: LoginRequest, db=Depends(get_db)):
    email = body.email.strip().lower()

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is disabled")

    user_id = str(user["_id"])
    return {
        "access_token": create_access_token({"sub": user_id, "role": user["role"]}),
        "refresh_token": create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
        "user": _user_response(user, user_id),
    }


@router.post("/refresh")
async def refresh(body: dict, db=Depends(get_db)):
    payload = decode_token(body.get("refresh_token", ""))
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user_id = str(user["_id"])
    return {
        "access_token": create_access_token({"sub": user_id, "role": user["role"]}),
        "token_type": "bearer",
    }
