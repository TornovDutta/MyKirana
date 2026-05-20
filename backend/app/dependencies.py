from app.config import settings
from app.services.auth_service import AuthService
from app.services.order_service import OrderService
from app.services.smart_routing import RoutingService
from app.services.shop_service import ShopService
from app.services.sms_service import SmsService

_auth_service = AuthService(settings)
_sms_service = SmsService(settings)
_shop_service = ShopService()
_order_service = OrderService()
_routing_service = RoutingService(settings)


def get_auth_service() -> AuthService:
    return _auth_service


def get_sms_service() -> SmsService:
    return _sms_service


def get_shop_service() -> ShopService:
    return _shop_service


def get_order_service() -> OrderService:
    return _order_service


def get_routing_service() -> RoutingService:
    return _routing_service
