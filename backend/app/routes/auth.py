from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse

from app.database import get_db
from app.dependencies import get_auth_service, get_firebase_service
from app.interfaces.auth import IAuthService
from app.models.user import LoginRequest, RegisterRequest, FirebaseLoginRequest
from app.services.firebase_service import FirebaseService

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_response(user: dict, user_id: str) -> dict:
    return {
        "id": user_id,
        "name": user.get("name"),
        "email": user.get("email"),
        "phone_number": user.get("phone_number"),
        "firebase_uid": user.get("firebase_uid"),
        "role": user["role"],
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    db=Depends(get_db),
    auth: IAuthService = Depends(get_auth_service),
):
    email = body.email.strip().lower()

    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    doc = {
        "name": body.name.strip(),
        "email": email,
        "password": auth.hash_password(body.password),
        "role": body.role,
        "is_active": True,
        "profile_image": None,
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)

    return {
        "access_token": auth.create_access_token({"sub": user_id, "role": body.role}),
        "refresh_token": auth.create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
        "user": _user_response(doc, user_id),
    }


@router.post("/login")
async def login(
    body: LoginRequest,
    db=Depends(get_db),
    auth: IAuthService = Depends(get_auth_service),
):
    email = body.email.strip().lower()

    user = await db.users.find_one({"email": email})
    if not user or not auth.verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is disabled")

    user_id = str(user["_id"])
    return {
        "access_token": auth.create_access_token({"sub": user_id, "role": user["role"]}),
        "refresh_token": auth.create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
        "user": _user_response(user, user_id),
    }


_google_sessions: dict = {}


@router.post("/google-session/{session_id}")
async def set_google_session(session_id: str, body: dict):
    _google_sessions[session_id] = {
        "id_token": body.get("id_token"),
        "email": body.get("email"),
        "name": body.get("name"),
        "timestamp": datetime.utcnow(),
    }
    return {"status": "ok"}


@router.get("/google-session/{session_id}")
async def get_google_session(session_id: str):
    sess = _google_sessions.get(session_id)
    if not sess:
        return {"status": "pending"}
    return {"status": "ready", **sess}


@router.get("/google-web", response_class=HTMLResponse)
async def google_web_login(session_id: str = "", redirect_uri: str = "mykirana://auth"):
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>MyKirana Google Sign-In</title>
      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background-color: #f7f9f7;
          color: #333;
        }}
        .card {{
          background: white;
          padding: 32px 24px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          text-align: center;
          max-width: 360px;
          width: 90%;
        }}
        .logo {{
          font-size: 28px;
          font-weight: 800;
          color: #2E7D32;
          margin-bottom: 8px;
        }}
        .tagline {{
          font-size: 13px;
          color: #666;
          margin-bottom: 24px;
        }}
        .btn {{
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 1.5px solid #ddd;
          border-radius: 10px;
          padding: 12px 20px;
          font-size: 15px;
          font-weight: 600;
          color: #333;
          cursor: pointer;
          width: 100%;
          box-sizing: border-box;
          text-decoration: none;
          transition: background-color 0.2s;
        }}
        .btn:hover {{
          background-color: #f0f0f0;
        }}
        .btn-success {{
          background-color: #2E7D32;
          color: #ffffff;
          border: none;
          margin-top: 14px;
        }}
        .btn-success:hover {{
          background-color: #256628;
        }}
        .btn svg {{
          margin-right: 10px;
        }}
        .status {{
          font-size: 13px;
          color: #888;
          margin-top: 16px;
        }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">MyKirana</div>
        <div class="tagline">Your neighbourhood, delivered</div>
        <button id="googleBtn" class="btn" onclick="doGoogleLogin()">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          Sign in with Google
        </button>
        <a id="returnLink" href="#" style="display:none;" class="btn btn-success">
          Tap to Open MyKirana App
        </a>
        <div id="status" class="status">Click above to sign in with your Google account</div>
      </div>

      <script>
        const firebaseConfig = {{
          apiKey: "AIzaSyAv1294cPjAigSmzkJ3xzXLscwisml9Zs4",
          authDomain: "vibewall-2ebc1.firebaseapp.com",
          projectId: "vibewall-2ebc1"
        }};
        firebase.initializeApp(firebaseConfig);

        const sessionId = "{session_id}";
        const redirectUri = "{redirect_uri}";

        async function handleSuccess(user) {{
          const statusEl = document.getElementById("status");
          const btn = document.getElementById("googleBtn");
          btn.style.display = "none";
          statusEl.innerText = "Signing in... Returning to MyKirana app...";

          const token = await user.getIdToken();

          // 1. Post token directly to the backend session (works 100% reliably)
          if (sessionId) {{
            try {{
              await fetch("/auth/google-session/" + encodeURIComponent(sessionId), {{
                method: "POST",
                headers: {{ "Content-Type": "application/json" }},
                body: JSON.stringify({{
                  id_token: token,
                  email: user.email || "",
                  name: user.displayName || ""
                }})
              }});
              statusEl.innerText = "Authenticated! Returning to MyKirana...";
            }} catch (err) {{
              console.error("Session update error:", err);
            }}
          }}

          // 2. Also attempt custom-scheme redirect
          const separator = redirectUri.includes("?") ? "&" : "?";
          const params = new URLSearchParams();
          params.set("id_token", token);
          if (user.email) params.set("email", user.email);
          if (user.displayName) params.set("name", user.displayName);

          const targetUrl = redirectUri + separator + params.toString();

          const returnLink = document.getElementById("returnLink");
          if (returnLink) {{
            returnLink.href = targetUrl;
            returnLink.style.display = "inline-flex";
            returnLink.onclick = function() {{ window.location.href = targetUrl; }};
          }}

          statusEl.innerHTML = "<b>Authenticated!</b><br>Returning to MyKirana app...<br><small style='color:#666;'>If you are not redirected automatically, tap the button above or close this window.</small>";

          try {{ window.location.replace(targetUrl); }} catch(e) {{}}
          try {{ window.location.href = targetUrl; }} catch(e) {{}}
        }}

        async function doGoogleLogin() {{
          const statusEl = document.getElementById("status");
          const btn = document.getElementById("googleBtn");
          statusEl.innerText = "Connecting to Google...";
          btn.disabled = true;

          const provider = new firebase.auth.GoogleAuthProvider();
          provider.addScope("email");
          provider.addScope("profile");

          try {{
            const result = await firebase.auth().signInWithPopup(provider);
            if (result && result.user) {{
              await handleSuccess(result.user);
            }}
          }} catch (err) {{
            console.error(err);
            if (err.code === "auth/popup-blocked" || err.code === "auth/operation-not-supported-in-this-environment") {{
              statusEl.innerText = "Redirecting to Google Sign-In...";
              await firebase.auth().signInWithRedirect(provider);
            }} else {{
              statusEl.innerText = err.message || "Sign-in failed. Please try again.";
              btn.disabled = false;
            }}
          }}
        }}

        window.addEventListener("load", () => {{
          firebase.auth().getRedirectResult().then(async (result) => {{
            if (result && result.user) {{
              await handleSuccess(result.user);
            }}
          }}).catch(err => {{
            console.error(err);
          }});
        }});
      </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@router.post("/firebase-login")
async def firebase_login(
    body: FirebaseLoginRequest,
    db=Depends(get_db),
    auth: IAuthService = Depends(get_auth_service),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    # Verify the Firebase token
    decoded_token = await firebase.verify_id_token(body.id_token)
    uid = decoded_token.get("uid")
    token_email = decoded_token.get("email")
    token_name = decoded_token.get("name")
    token_phone = decoded_token.get("phone_number")
    
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid Firebase token: missing UID")
        
    # Check if user already exists
    query = [{"firebase_uid": uid}]
    if token_email:
        query.append({"email": token_email})
    if body.phone_number:
        query.append({"phone_number": body.phone_number.strip()})
    elif token_phone:
        query.append({"phone_number": token_phone})
        
    user = await db.users.find_one({"$or": query})
    
    # Check if user already has complete profile (name + phone_number)
    has_full_profile = bool(user and user.get("name") and user.get("phone_number"))
    
    # If not full profile and client hasn't provided phone_number, ask for it
    if not has_full_profile and not body.phone_number:
        return {
            "needs_profile": True,
            "firebase_uid": uid,
            "email": token_email or (user.get("email") if user else None),
            "name": (user.get("name") if user else None) or token_name or "",
        }
        
    final_name = (body.name.strip() if body.name else None) or (user.get("name") if user else None) or token_name or "MyKirana User"
    final_phone = (body.phone_number.strip() if body.phone_number else None) or (user.get("phone_number") if user else None) or token_phone
    final_email = token_email or (user.get("email") if user else None)
    final_role = body.role if body.role else (user.get("role") if user else UserRole.CUSTOMER)

    if not user:
        doc = {
            "name": final_name,
            "email": final_email,
            "phone_number": final_phone,
            "firebase_uid": uid,
            "password": None,
            "role": final_role,
            "is_active": True,
            "profile_image": decoded_token.get("picture"),
            "created_at": datetime.utcnow(),
        }
        result = await db.users.insert_one(doc)
        user_id = str(result.inserted_id)
        user = doc
    else:
        user_id = str(user["_id"])
        update_fields = {"firebase_uid": uid}
        if final_name:
            update_fields["name"] = final_name
        if final_phone:
            update_fields["phone_number"] = final_phone
        if final_email and not user.get("email"):
            update_fields["email"] = final_email
        if body.role:
            update_fields["role"] = body.role
        if decoded_token.get("picture") and not user.get("profile_image"):
            update_fields["profile_image"] = decoded_token.get("picture")
            
        await db.users.update_one({"_id": user["_id"]}, {"$set": update_fields})
        user = await db.users.find_one({"_id": user["_id"]})

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is disabled")

    return {
        "needs_profile": False,
        "access_token": auth.create_access_token({"sub": user_id, "role": user["role"]}),
        "refresh_token": auth.create_refresh_token({"sub": user_id}),
        "token_type": "bearer",
        "user": _user_response(user, user_id),
    }


@router.post("/refresh")
async def refresh(
    body: dict,
    db=Depends(get_db),
    auth: IAuthService = Depends(get_auth_service),
):
    payload = auth.decode_token(body.get("refresh_token", ""))
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user_id = str(user["_id"])
    return {
        "access_token": auth.create_access_token({"sub": user_id, "role": user["role"]}),
        "token_type": "bearer",
    }
