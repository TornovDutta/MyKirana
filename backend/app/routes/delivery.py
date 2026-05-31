from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_db
from app.middleware.auth import require_role
from app.models.delivery import LocationUpdate, DeliveryStatus
from app.models.order import OrderStatus
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/delivery", tags=["delivery"])


@router.get("/available")
async def available_orders(
    lat: float = Query(...),
    lng: float = Query(...),
    current_user=Depends(require_role("delivery_partner")),
    db=Depends(get_db),
):
    orders = (
        await db.orders.find({"status": OrderStatus.READY, "delivery_partner_id": None})
        .sort("created_at", 1)
        .limit(20)
        .to_list(length=20)
    )
    return [
        {
            "id": str(o["_id"]),
            "shops_involved": o["shops_involved"],
            "delivery_address": o["delivery_address"],
            "total": o["total"],
            "items_count": len(o["items"]),
            "created_at": o["created_at"],
        }
        for o in orders
    ]


@router.post("/{order_id}/accept")
async def accept_delivery(order_id: str, current_user=Depends(require_role("delivery_partner")), db=Depends(get_db)):
    order = await db.orders.find_one({"_id": ObjectId(order_id), "status": OrderStatus.READY, "delivery_partner_id": None})
    if not order:
        raise HTTPException(status_code=404, detail="Order not available for pickup")

    partner_id = str(current_user["_id"])
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"delivery_partner_id": partner_id, "status": OrderStatus.PICKED_UP, "updated_at": datetime.utcnow()}},
    )

    doc = {
        "order_id": order_id,
        "partner_id": partner_id,
        "status": DeliveryStatus.ACCEPTED,
        "current_location": None,
        "delivery_address": order["delivery_address"]["address"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.deliveries.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Delivery accepted"}


@router.patch("/{order_id}/location")
async def update_location(
    order_id: str,
    location: LocationUpdate,
    current_user=Depends(require_role("delivery_partner")),
    db=Depends(get_db),
):
    await db.deliveries.update_one(
        {"order_id": order_id, "partner_id": str(current_user["_id"])},
        {"$set": {"current_location": location.coordinates, "updated_at": datetime.utcnow()}},
    )
    return {"message": "Location updated"}


@router.post("/{order_id}/delivered")
async def mark_delivered(order_id: str, current_user=Depends(require_role("delivery_partner")), db=Depends(get_db)):
    order = await db.orders.find_one({"_id": ObjectId(order_id), "delivery_partner_id": str(current_user["_id"])})
    if not order:
        raise HTTPException(status_code=404, detail="Delivery not found")

    now = datetime.utcnow()
    await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": OrderStatus.DELIVERED, "updated_at": now}})
    await db.deliveries.update_one(
        {"order_id": order_id},
        {"$set": {"status": DeliveryStatus.DELIVERED, "updated_at": now}},
    )
    return {"message": "Delivery completed"}


@router.get("/my")
async def my_deliveries(current_user=Depends(require_role("delivery_partner")), db=Depends(get_db)):
    deliveries = (
        await db.deliveries.find({"partner_id": str(current_user["_id"])})
        .sort("created_at", -1)
        .limit(20)
        .to_list(length=20)
    )
    return [
        {
            "id": str(d["_id"]),
            "order_id": d["order_id"],
            "status": d["status"],
            "delivery_address": d["delivery_address"],
            "created_at": d["created_at"],
        }
        for d in deliveries
    ]


@router.get("/{order_id}/track")
async def track_delivery(
    order_id: str,
    current_user=Depends(require_role("customer")),
    db=Depends(get_db),
):
    order = await db.orders.find_one({"_id": ObjectId(order_id), "customer_id": str(current_user["_id"])})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    delivery = await db.deliveries.find_one({"order_id": order_id})
    if not delivery:
        raise HTTPException(status_code=404, detail="No delivery assigned yet")

    partner_name = None
    if delivery.get("partner_id"):
        partner = await db.users.find_one({"_id": ObjectId(delivery["partner_id"])})
        if partner:
            partner_name = partner.get("name")

    return {
        "current_location": delivery.get("current_location"),
        "status": delivery.get("status"),
        "partner_name": partner_name,
        "updated_at": delivery.get("updated_at"),
    }
