import httpx

from app.config import Settings


class SmsService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def send_otp(self, phone: str, otp: str) -> bool:
        if self._settings.dev_mode:
            print(f"[DEV OTP] Phone: {phone}  OTP: {otp}")
            return True

        url = f"https://2factor.in/API/V1/{self._settings.sms_api_key}/SMS/{phone}/{otp}"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url)
                data = resp.json()
                return data.get("Status") == "Success"
        except Exception:
            return False
