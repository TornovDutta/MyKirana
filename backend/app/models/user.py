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


class SendOTPRequest(BaseModel):
    phone: str


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    # Required only when registering a new user
    name: Optional[str] = None
    role: Optional[UserRole] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    phone: str
    role: UserRole
    profile_image: Optional[str] = None
    created_at: datetime
