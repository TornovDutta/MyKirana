from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price: float
    mrp: float
    unit: str  # kg, g, L, ml, pcs
    quantity_in_stock: int
    image_url: Optional[str] = None
    brand: Optional[str] = None
    barcode: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    mrp: Optional[float] = None
    quantity_in_stock: Optional[int] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None
    brand: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    shop_id: str
    shop_name: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: str
    price: float
    mrp: float
    discount_percent: float
    unit: str
    quantity_in_stock: int
    is_available: bool
    image_url: Optional[str] = None
    brand: Optional[str] = None
    created_at: datetime
