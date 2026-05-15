from pydantic import BaseModel
from typing import Optional, List, Dict
from enum import Enum
from datetime import datetime


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class DeliveryAddress(BaseModel):
    address: str
    city: str
    pincode: str
    coordinates: List[float]  # [longitude, latitude]


class OrderCreate(BaseModel):
    items: List[Dict]  # [{"product_id": str, "quantity": int}]
    delivery_address: DeliveryAddress
    notes: Optional[str] = None


class OrderItem(BaseModel):
    product_id: str
    shop_id: str
    product_name: str
    quantity: int
    price: float
    total: float


class OrderResponse(BaseModel):
    id: str
    customer_id: str
    items: List[OrderItem]
    shops_involved: List[str]
    delivery_address: DeliveryAddress
    subtotal: float
    delivery_fee: float
    total: float
    status: OrderStatus
    delivery_partner_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
