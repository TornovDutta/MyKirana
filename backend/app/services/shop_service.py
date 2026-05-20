from typing import List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase


class ShopService:
    async def get_nearby_shops(
        self,
        db: AsyncIOMotorDatabase,
        longitude: float,
        latitude: float,
        max_radius_km: float = 10.0,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[dict]:
        match_filter: dict = {"is_active": True}
        if category:
            match_filter["categories"] = category

        pipeline = [
            {
                "$geoNear": {
                    "near": {"type": "Point", "coordinates": [longitude, latitude]},
                    "distanceField": "distance",
                    "maxDistance": max_radius_km * 1000,
                    "query": match_filter,
                    "spherical": True,
                }
            },
            {"$skip": skip},
            {"$limit": limit},
        ]

        return await db.shops.aggregate(pipeline).to_list(length=limit)
