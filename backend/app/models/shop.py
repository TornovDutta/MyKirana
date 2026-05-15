from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class GeoLocation(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]


class ShopCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    city: str
    pincode: str
    location: GeoLocation
    delivery_radius_km: float = 5.0
    phone: str
    categories: List[str] = []
    opening_time: str = "09:00"
    closing_time: str = "21:00"


class ShopUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    delivery_radius_km: Optional[float] = None
    phone: Optional[str] = None
    categories: Optional[List[str]] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    is_open: Optional[bool] = None
    image_url: Optional[str] = None


class ShopResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    address: str
    city: str
    pincode: str
    location: GeoLocation
    delivery_radius_km: float
    phone: str
    categories: List[str]
    opening_time: str
    closing_time: str
    is_open: bool
    owner_id: str
    rating: float
    total_ratings: int
    image_url: Optional[str] = None
    distance_km: Optional[float] = None
    created_at: datetime
