from datetime import datetime

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class OrderService:
    async def update_order_status(self, db: AsyncIOMotorDatabase, order_id: str, status: str) -> None:
        await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}},
        )
