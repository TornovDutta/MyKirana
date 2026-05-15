from fastapi import APIRouter, HTTPException, status, Depends
from app.database import get_db
from app.models.user import UserCreate, UserLogin
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


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db=Depends(get_db)):
    if await db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await db.users.find_one({"phone": user_data.phone}):
        raise HTTPException(status_code=400, detail="Phone already registered")

    doc = {
        "name": user_data.name,
        "email": user_data.email,
        "phone": user_data.phone,
        "password": hash_password(user_data.password),
        "role": user_data.role,
        "is_active": True,
        "profile_image": None,
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)

    return {
        "access_token": create_access_token({"sub": user_id, "role": user_data.role}),
        "refresh_token": create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
        "user": {"id": user_id, "name": user_data.name, "email": user_data.email, "role": user_data.role},
    }


@router.post("/login")
async def login(credentials: UserLogin, db=Depends(get_db)):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = str(user["_id"])
    return {
        "access_token": create_access_token({"sub": user_id, "role": user["role"]}),
        "refresh_token": create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
        "user": {"id": user_id, "name": user["name"], "email": user["email"], "role": user["role"]},
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
