from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase


async def get_nearby_shops(
    db: AsyncIOMotorDatabase,
    longitude: float,
    latitude: float,
    max_radius_km: float = 10.0,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> List[dict]:
    match_filter = {"is_active": True}
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

    cursor = db.shops.aggregate(pipeline)
    return await cursor.to_list(length=limit)
