from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.database import get_db
from app.middleware.auth import require_role
from app.models.product import ProductCreate, ProductUpdate
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/products", tags=["products"])


def _serialize(p: dict) -> dict:
    mrp = p.get("mrp", 0)
    price = p.get("price", 0)
    discount = round((mrp - price) / mrp * 100, 1) if mrp > 0 else 0
    return {
        "id": str(p["_id"]),
        "shop_id": p["shop_id"],
        "name": p["name"],
        "description": p.get("description"),
        "category": p["category"],
        "price": price,
        "mrp": mrp,
        "discount_percent": discount,
        "unit": p["unit"],
        "quantity_in_stock": p["quantity_in_stock"],
        "is_available": p.get("is_available", True),
        "image_url": p.get("image_url"),
        "brand": p.get("brand"),
    }


@router.get("/my")
async def get_my_products(
    skip: int = 0,
    limit: int = 50,
    current_user=Depends(require_role("shop_owner")),
    db=Depends(get_db),
):
    shop = await db.shops.find_one({"owner_id": str(current_user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    products = await db.products.find({"shop_id": str(shop["_id"])}).skip(skip).limit(limit).to_list(length=limit)
    return [_serialize(p) for p in products]


@router.get("/shop/{shop_id}")
async def get_shop_products(
    shop_id: str,
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    skip: int = 0,
    limit: int = 50,
    db=Depends(get_db),
):
    filter_q: dict = {"shop_id": shop_id, "is_available": True}
    if category:
        filter_q["category"] = category
    if search:
        filter_q["$text"] = {"$search": search}

    products = await db.products.find(filter_q).skip(skip).limit(limit).to_list(length=limit)
    return [_serialize(p) for p in products]


@router.post("/", status_code=201)
async def add_product(product: ProductCreate, current_user=Depends(require_role("shop_owner")), db=Depends(get_db)):
    shop = await db.shops.find_one({"owner_id": str(current_user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found — register your shop first")

    doc = {**product.model_dump(), "shop_id": str(shop["_id"]), "is_available": True, "created_at": datetime.utcnow()}
    result = await db.products.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Product added"}


@router.patch("/{product_id}")
async def update_product(
    product_id: str,
    update: ProductUpdate,
    current_user=Depends(require_role("shop_owner")),
    db=Depends(get_db),
):
    shop = await db.shops.find_one({"owner_id": str(current_user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    existing = await db.products.find_one({"_id": ObjectId(product_id), "shop_id": str(shop["_id"])})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    data = {k: v for k, v in update.model_dump().items() if v is not None}
    data["updated_at"] = datetime.utcnow()
    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": data})
    return {"message": "Product updated"}


@router.delete("/{product_id}")
async def delete_product(product_id: str, current_user=Depends(require_role("shop_owner")), db=Depends(get_db)):
    shop = await db.shops.find_one({"owner_id": str(current_user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    result = await db.products.delete_one({"_id": ObjectId(product_id), "shop_id": str(shop["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}
