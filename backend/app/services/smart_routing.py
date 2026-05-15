from typing import List, Dict, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase


async def find_optimal_shops(
    db: AsyncIOMotorDatabase,
    requested_items: List[Dict],
    customer_location: List[float],
    max_radius_km: float = 10.0,
) -> Tuple[List[Dict], float]:
    """
    Greedy set-cover over nearby shops: pick the fewest shops that fulfill all
    requested items, tie-breaking on distance.  Returns (resolved_items, delivery_fee).
    """
    product_ids = [item["product_id"] for item in requested_items]
    qty_map = {item["product_id"]: item["quantity"] for item in requested_items}

    pipeline = [
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": customer_location},
                "distanceField": "distance",
                "maxDistance": max_radius_km * 1000,
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

    # availability[product_id] = list of shop options
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
        # Map shop_id -> set of unfulfilled product_ids it can cover
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
            selected[best_sid] = {"shop_id": best_sid, "shop_name": ref["shop_name"], "distance_km": ref["distance_km"], "items": []}

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

    result_items = []
    total_fee = 0.0
    for shop_data in selected.values():
        # ₹20 base + ₹2/km
        fee = round(20.0 + shop_data["distance_km"] * 2.0, 2)
        total_fee += fee
        result_items.extend(shop_data["items"])

    return result_items, round(total_fee, 2)
