import uuid
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import UserUpdate, AddressCreate
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_profile(current_user=Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
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


@router.get("/me/addresses")
async def get_addresses(current_user=Depends(get_current_user)):
    return current_user.get("addresses", [])


@router.post("/me/addresses", status_code=201)
async def add_address(address: AddressCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    new_address = address.model_dump()
    new_address["id"] = str(uuid.uuid4())
    await db.users.update_one({"_id": current_user["_id"]}, {"$push": {"addresses": new_address}})
    return new_address


@router.patch("/me/addresses/{address_id}")
async def update_address(address_id: str, address: AddressCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    update_fields = {f"addresses.$.{k}": v for k, v in address.model_dump().items()}
    result = await db.users.update_one(
        {"_id": current_user["_id"], "addresses.id": address_id},
        {"$set": update_fields},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address updated"}


@router.delete("/me/addresses/{address_id}", status_code=204)
async def delete_address(address_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    result = await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$pull": {"addresses": {"id": address_id}}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return None
