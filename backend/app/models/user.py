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


class FirebaseLoginRequest(BaseModel):
    id_token: str
    role: UserRole = UserRole.CUSTOMER


class SendOTPRequest(BaseModel):
    phone: str


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str


class PhoneRegisterRequest(BaseModel):
    phone: str
    name: str
    role: UserRole
    location: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    profile_image: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    firebase_uid: Optional[str] = None
    role: UserRole
    profile_image: Optional[str] = None
    created_at: datetime
