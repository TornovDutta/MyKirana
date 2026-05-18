import httpx
from app.config import settings


async def send_otp_sms(phone: str, otp: str) -> bool:
    if settings.dev_mode:
        # In dev mode, OTP is printed to console and returned in the API response
        print(f"[DEV OTP] Phone: {phone}  OTP: {otp}")
        return True

    # Fast2SMS — set SMS_API_KEY in .env to enable
    url = "https://www.fast2sms.com/dev/bulkV2"
    payload = {
        "route": "otp",
        "variables_values": otp,
        "numbers": phone,
        "flash": 0,
    }
    headers = {"authorization": settings.sms_api_key, "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload, headers=headers)
            return resp.status_code == 200
    except Exception:
        return False
