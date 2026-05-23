import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import connect_db, disconnect_db
from app.routes import auth, delivery, orders, products, shops, upload, users

os.makedirs(settings.upload_dir, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="MyKirana API",
    description="Multi-vendor grocery marketplace for neighborhood shops",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shops.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(delivery.router)
app.include_router(upload.router)

app.mount(f"/{settings.upload_dir}", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/")
async def root():
    return {"message": "MyKirana API is running", "docs": "/docs"}
