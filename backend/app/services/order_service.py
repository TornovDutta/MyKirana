from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from app.models.order import OrderStatus


async def get_order_by_id(db: AsyncIOMotorDatabase, order_id: str, user_id: str = None):
    filter_q = {"_id": ObjectId(order_id)}
    if user_id:
        filter_q["$or"] = [
            {"customer_id": user_id},
            {"delivery_partner_id": user_id},
        ]
    return await db.orders.find_one(filter_q)


async def update_order_status(db: AsyncIOMotorDatabase, order_id: str, status: str):
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}},
    )
