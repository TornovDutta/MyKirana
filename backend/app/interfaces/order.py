from typing import Protocol, runtime_checkable

from motor.motor_asyncio import AsyncIOMotorDatabase


@runtime_checkable
class IOrderService(Protocol):
    async def update_order_status(self, db: AsyncIOMotorDatabase, order_id: str, status: str) -> None: ...
