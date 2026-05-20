import httpx
from app.config import settings


async def send_otp_sms(phone: str, otp: str) -> bool:
    if settings.dev_mode:
        print(f"[DEV OTP] Phone: {phone}  OTP: {otp}")
        return True

    # 2Factor.in — free OTP SMS API (no DLT registration needed)
    url = f"https://2factor.in/API/V1/{settings.sms_api_key}/SMS/{phone}/{otp}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            data = resp.json()
            return data.get("Status") == "Success"
    except Exception:
        return False
