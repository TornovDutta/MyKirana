from typing import Dict, List, Protocol, Tuple, runtime_checkable

from motor.motor_asyncio import AsyncIOMotorDatabase


@runtime_checkable
class IRoutingService(Protocol):
    async def find_optimal_shops(
        self,
        db: AsyncIOMotorDatabase,
        requested_items: List[Dict],
        customer_location: List[float],
    ) -> Tuple[List[Dict], float]: ...
