from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    try:
        await db.users.drop_index("phone_1")
    except Exception:
        pass
    await db.users.create_index("phone", unique=True, sparse=True)
    await db.users.create_index("email", unique=True, sparse=True)
    await db.shops.create_index([("location", "2dsphere")])
    await db.shops.create_index("owner_id")
    await db.products.create_index("shop_id")
    await db.products.create_index([("name", "text"), ("category", "text")])
    await db.orders.create_index("customer_id")
    await db.orders.create_index("shops_involved")
    await db.orders.create_index("status")
    await db.deliveries.create_index("partner_id")
    await db.deliveries.create_index("order_id")
    # OTPs auto-expire via MongoDB TTL index
    await db.otps.create_index("expires_at", expireAfterSeconds=0)
    await db.otps.create_index("phone")


async def disconnect_db():
    if client:
        client.close()


def get_db():
    return db
