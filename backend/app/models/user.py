from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime


class UserRole(str, Enum):
    CUSTOMER = "customer"
    SHOP_OWNER = "shop_owner"
    DELIVERY_PARTNER = "delivery_partner"


class AddressCreate(BaseModel):
    label: str = "Home"
    address: str
    city: str
    pincode: str
    coordinates: Optional[List[float]] = None


class AddressResponse(AddressCreate):
    id: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole


class LoginRequest(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    profile_image: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    profile_image: Optional[str] = None
    created_at: datetime
