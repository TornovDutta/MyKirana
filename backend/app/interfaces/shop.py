from typing import List, Optional, Protocol, runtime_checkable

from motor.motor_asyncio import AsyncIOMotorDatabase


@runtime_checkable
class IShopService(Protocol):
    async def get_nearby_shops(
        self,
        db: AsyncIOMotorDatabase,
        longitude: float,
        latitude: float,
        max_radius_km: float,
        category: Optional[str],
        skip: int,
        limit: int,
    ) -> List[dict]: ...
