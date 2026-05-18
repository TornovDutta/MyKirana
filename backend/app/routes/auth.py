from fastapi import APIRouter, HTTPException, status, Depends
from app.database import get_db
from app.models.user import SendOTPRequest, VerifyOTPRequest
from app.services.auth_service import (
    generate_otp,
    otp_expiry,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.services.sms_service import send_otp_sms
from app.config import settings
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/send-otp")
async def send_otp(body: SendOTPRequest, db=Depends(get_db)):
    phone = body.phone.strip()
    if len(phone) != 10 or not phone.isdigit():
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number")

    existing_user = await db.users.find_one({"phone": phone})
    is_new_user = existing_user is None

    otp = generate_otp()
    expires_at = otp_expiry()

    # Replace any previous OTP for this phone
    await db.otps.delete_many({"phone": phone})
    await db.otps.insert_one({"phone": phone, "otp": otp, "expires_at": expires_at, "used": False})

    await send_otp_sms(phone, otp)

    response = {
        "message": "OTP sent successfully",
        "is_new_user": is_new_user,
    }
    if settings.dev_mode:
        response["dev_otp"] = otp

    return response


@router.post("/verify-otp", status_code=status.HTTP_200_OK)
async def verify_otp(body: VerifyOTPRequest, db=Depends(get_db)):
    phone = body.phone.strip()

    record = await db.otps.find_one({"phone": phone, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="OTP not found. Please request a new OTP.")
    if record["otp"] != body.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP")
    if record["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    # Mark OTP as used
    await db.otps.update_one({"_id": record["_id"]}, {"$set": {"used": True}})

    user = await db.users.find_one({"phone": phone})

    if not user:
        # New user — name and role are required
        if not body.name or not body.name.strip():
            raise HTTPException(status_code=400, detail="Name is required for new users")
        if not body.role:
            raise HTTPException(status_code=400, detail="Role is required for new users")

        doc = {
            "name": body.name.strip(),
            "phone": phone,
            "role": body.role,
            "is_active": True,
            "profile_image": None,
            "created_at": datetime.utcnow(),
        }
        result = await db.users.insert_one(doc)
        user_id = str(result.inserted_id)
        user_name = body.name.strip()
        user_role = body.role
    else:
        user_id = str(user["_id"])
        user_name = user["name"]
        user_role = user["role"]

    return {
        "access_token": create_access_token({"sub": user_id, "role": user_role}),
        "refresh_token": create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
        "user": {"id": user_id, "name": user_name, "phone": phone, "role": user_role},
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
