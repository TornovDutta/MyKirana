from typing import Dict, List, Tuple

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import Settings


class RoutingService:
    def __init__(self, settings: Settings) -> None:
        self._base_fee = settings.delivery_base_fee
        self._fee_per_km = settings.delivery_fee_per_km
        self._max_radius_km = settings.max_routing_radius_km

    async def find_optimal_shops(
        self,
        db: AsyncIOMotorDatabase,
        requested_items: List[Dict],
        customer_location: List[float],
    ) -> Tuple[List[Dict], float]:
        product_ids = [item["product_id"] for item in requested_items]
        qty_map = {item["product_id"]: item["quantity"] for item in requested_items}

        pipeline = [
            {
                "$geoNear": {
                    "near": {"type": "Point", "coordinates": customer_location},
                    "distanceField": "distance",
                    "maxDistance": self._max_radius_km * 1000,
                    "query": {"is_active": True, "is_open": True},
                    "spherical": True,
                }
            },
            {
                "$lookup": {
                    "from": "products",
                    "let": {"sid": {"$toString": "$_id"}},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {"$eq": ["$shop_id", "$$sid"]},
                                "is_available": True,
                                "quantity_in_stock": {"$gt": 0},
                            }
                        }
                    ],
                    "as": "products",
                }
            },
            {"$match": {"products": {"$ne": []}}},
        ]

        shops = await db.shops.aggregate(pipeline).to_list(length=50)

        availability: Dict[str, List[Dict]] = {pid: [] for pid in product_ids}
        for shop in shops:
            shop_id = str(shop["_id"])
            dist_km = shop.get("distance", 0) / 1000
            for product in shop["products"]:
                pid = str(product["_id"])
                if pid in availability and product["quantity_in_stock"] >= qty_map[pid]:
                    availability[pid].append(
                        {
                            "shop_id": shop_id,
                            "shop_name": shop["name"],
                            "distance_km": dist_km,
                            "product": product,
                            "price": product["price"],
                        }
                    )

        unfulfilled = set(product_ids)
        selected: Dict[str, Dict] = {}

        while unfulfilled:
            coverage: Dict[str, List[str]] = {}
            for pid in unfulfilled:
                for opt in availability.get(pid, []):
                    sid = opt["shop_id"]
                    coverage.setdefault(sid, []).append(pid)

            if not coverage:
                break

            best_sid = max(
                coverage,
                key=lambda sid: (
                    len(coverage[sid]),
                    -min(o["distance_km"] for o in availability[coverage[sid][0]] if o["shop_id"] == sid),
                ),
            )

            if best_sid not in selected:
                first_pid = coverage[best_sid][0]
                ref = next(o for o in availability[first_pid] if o["shop_id"] == best_sid)
                selected[best_sid] = {
                    "shop_id": best_sid,
                    "shop_name": ref["shop_name"],
                    "distance_km": ref["distance_km"],
                    "items": [],
                }

            for pid in coverage[best_sid]:
                opt = next(o for o in availability[pid] if o["shop_id"] == best_sid)
                selected[best_sid]["items"].append(
                    {
                        "product_id": pid,
                        "shop_id": best_sid,
                        "product_name": opt["product"]["name"],
                        "quantity": qty_map[pid],
                        "price": opt["price"],
                        "total": round(opt["price"] * qty_map[pid], 2),
                    }
                )
                unfulfilled.discard(pid)

        result_items: List[Dict] = []
        total_fee = 0.0
        for shop_data in selected.values():
            fee = round(self._base_fee + shop_data["distance_km"] * self._fee_per_km, 2)
            total_fee += fee
            result_items.extend(shop_data["items"])

        return result_items, round(total_fee, 2)
