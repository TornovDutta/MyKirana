from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.order import OrderCreate, OrderStatus
from app.services.smart_routing import find_optimal_shops
from app.services.order_service import update_order_status
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/preview")
async def preview_order(order_data: OrderCreate, db=Depends(get_db)):
    coords = order_data.delivery_address.coordinates
    items, delivery_fee = await find_optimal_shops(db, order_data.items, coords)
    subtotal = sum(i["total"] for i in items)
    return {
        "items": items,
        "subtotal": round(subtotal, 2),
        "delivery_fee": delivery_fee,
        "total": round(subtotal + delivery_fee, 2),
        "shops_count": len({i["shop_id"] for i in items}),
        "unfulfilled_count": len(order_data.items) - len(items),
    }


@router.post("/", status_code=201)
async def place_order(order_data: OrderCreate, current_user=Depends(require_role("customer")), db=Depends(get_db)):
    coords = order_data.delivery_address.coordinates
    items, delivery_fee = await find_optimal_shops(db, order_data.items, coords)

    if not items:
        raise HTTPException(status_code=400, detail="No items could be fulfilled by nearby shops")

    subtotal = sum(i["total"] for i in items)
    shops_involved = list({i["shop_id"] for i in items})

    for item in items:
        await db.products.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"quantity_in_stock": -item["quantity"]}},
        )

    doc = {
        "customer_id": str(current_user["_id"]),
        "items": items,
        "shops_involved": shops_involved,
        "delivery_address": order_data.delivery_address.model_dump(),
        "subtotal": round(subtotal, 2),
        "delivery_fee": delivery_fee,
        "total": round(subtotal + delivery_fee, 2),
        "status": OrderStatus.PENDING,
        "delivery_partner_id": None,
        "notes": order_data.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.orders.insert_one(doc)
    return {"id": str(result.inserted_id), "total": doc["total"], "message": "Order placed successfully"}


@router.get("/my")
async def my_orders(
    status: Optional[str] = Query(default=None),
    skip: int = 0,
    limit: int = 20,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    role = current_user["role"]
    filter_q: dict = {}

    if role == "customer":
        filter_q["customer_id"] = str(current_user["_id"])
    elif role == "delivery_partner":
        filter_q["delivery_partner_id"] = str(current_user["_id"])
    elif role == "shop_owner":
        shop = await db.shops.find_one({"owner_id": str(current_user["_id"])})
        if not shop:
            return []
        filter_q["shops_involved"] = str(shop["_id"])

    if status:
        filter_q["status"] = status

    orders = await db.orders.find(filter_q).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    return [
        {
            "id": str(o["_id"]),
            "customer_id": o["customer_id"],
            "items": o["items"],
            "total": o["total"],
            "status": o["status"],
            "delivery_address": o["delivery_address"],
            "shops_involved": o["shops_involved"],
            "created_at": o["created_at"],
        }
        for o in orders
    ]


@router.get("/{order_id}")
async def get_order(order_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order["id"] = str(order.pop("_id"))
    return order


@router.patch("/{order_id}/status")
async def update_status(order_id: str, body: dict, current_user=Depends(get_current_user), db=Depends(get_db)):
    new_status = body.get("status")
    valid = [s.value for s in OrderStatus]
    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid}")
    await update_order_status(db, order_id, new_status)
    return {"message": "Status updated"}


@router.patch("/{order_id}/cancel")
async def cancel_order(order_id: str, current_user=Depends(require_role("customer")), db=Depends(get_db)):
    order = await db.orders.find_one({"_id": ObjectId(order_id), "customer_id": str(current_user["_id"])})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail="Order cannot be cancelled at this stage")

    for item in order["items"]:
        await db.products.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"quantity_in_stock": item["quantity"]}},
        )

    await update_order_status(db, order_id, OrderStatus.CANCELLED)
    return {"message": "Order cancelled"}
