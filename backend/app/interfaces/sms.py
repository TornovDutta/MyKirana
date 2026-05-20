from typing import Protocol, runtime_checkable


@runtime_checkable
class ISmsService(Protocol):
    async def send_otp(self, phone: str, otp: str) -> bool: ...
