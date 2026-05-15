from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime


class DeliveryStatus(str, Enum):
    ACCEPTED = "accepted"
    AT_SHOP = "at_shop"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"


class LocationUpdate(BaseModel):
    coordinates: List[float]  # [longitude, latitude]


class DeliveryResponse(BaseModel):
    id: str
    order_id: str
    partner_id: str
    status: DeliveryStatus
    current_location: Optional[List[float]] = None
    pickup_address: str
    delivery_address: str
    created_at: datetime
    updated_at: datetime
