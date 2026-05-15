from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import UserUpdate
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_profile(current_user=Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "phone": current_user["phone"],
        "role": current_user["role"],
        "profile_image": current_user.get("profile_image"),
        "created_at": current_user["created_at"],
    }


@router.patch("/me")
async def update_profile(update: UserUpdate, current_user=Depends(get_current_user), db=Depends(get_db)):
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    data["updated_at"] = datetime.utcnow()
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": data})
    return {"message": "Profile updated"}
