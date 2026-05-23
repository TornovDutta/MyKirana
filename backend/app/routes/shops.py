from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db
from app.dependencies import get_shop_service
from app.interfaces.shop import IShopService
from app.middleware.auth import get_current_user, require_role
from app.models.shop import ShopCreate, ShopUpdate

router = APIRouter(prefix="/shops", tags=["shops"])


@router.get("/nearby")
async def nearby_shops(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(default=10.0),
    category: Optional[str] = Query(default=None),
    skip: int = 0,
    limit: int = 20,
    db=Depends(get_db),
    shop_svc: IShopService = Depends(get_shop_service),
):
    shops = await shop_svc.get_nearby_shops(db, lng, lat, radius_km, category, skip, limit)
    return [
        {
            "id": str(s["_id"]),
            "name": s["name"],
            "description": s.get("description"),
            "address": s["address"],
            "city": s.get("city", ""),
            "categories": s.get("categories", []),
            "is_open": s.get("is_open", False),
            "rating": s.get("rating", 0.0),
            "total_ratings": s.get("total_ratings", 0),
            "distance_km": round(s.get("distance", 0) / 1000, 2),
            "image_url": s.get("image_url"),
            "delivery_radius_km": s.get("delivery_radius_km", 5.0),
            "opening_time": s.get("opening_time", "09:00"),
            "closing_time": s.get("closing_time", "21:00"),
        }
        for s in shops
    ]


@router.post("/", status_code=201)
async def create_shop(
    shop_data: ShopCreate,
    current_user=Depends(require_role("shop_owner")),
    db=Depends(get_db),
):
    if await db.shops.find_one({"owner_id": str(current_user["_id"])}):
        raise HTTPException(status_code=400, detail="You already have a registered shop")

    doc = {
        **shop_data.model_dump(),
        "owner_id": str(current_user["_id"]),
        "is_open": True,
        "is_active": True,
        "rating": 0.0,
        "total_ratings": 0,
        "image_url": None,
        "created_at": datetime.utcnow(),
    }
    result = await db.shops.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Shop created successfully"}


@router.get("/my")
async def get_my_shop(current_user=Depends(require_role("shop_owner")), db=Depends(get_db)):
    shop = await db.shops.find_one({"owner_id": str(current_user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop["id"] = str(shop.pop("_id"))
    return shop


@router.patch("/my")
async def update_my_shop(
    update: ShopUpdate,
    current_user=Depends(require_role("shop_owner")),
    db=Depends(get_db),
):
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    data["updated_at"] = datetime.utcnow()
    await db.shops.update_one({"owner_id": str(current_user["_id"])}, {"$set": data})
    return {"message": "Shop updated"}


@router.get("/{shop_id}")
async def get_shop(shop_id: str, db=Depends(get_db)):
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop["id"] = str(shop.pop("_id"))
    return shop
