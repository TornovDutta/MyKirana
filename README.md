# MyKirana

Multi-vendor grocery marketplace for neighbourhood shops.

## Project Structure

```
MyKirana/
├── backend/       FastAPI + MongoDB
└── frontend/      Expo React Native
```

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URL and SECRET_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload
# Swagger docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to your backend URL
npm install
npx expo start
```

## Architecture

| Layer       | Tech                         |
|-------------|------------------------------|
| Mobile app  | Expo React Native + Router v3|
| State       | Zustand + AsyncStorage       |
| HTTP        | Axios (auto token refresh)   |
| API         | FastAPI (async)              |
| Database    | MongoDB + Motor              |
| Auth        | JWT (access + refresh)       |
| Geo queries | MongoDB 2dsphere index       |

## User Roles

| Role               | Dashboard     | Key Features                                  |
|--------------------|---------------|-----------------------------------------------|
| Customer           | `(customer)/` | Browse shops, cart, smart checkout, tracking  |
| Shop Owner         | `(shop)/`     | Dashboard, inventory, order management        |
| Delivery Partner   | `(delivery)/` | Accept deliveries, location tracking, history |

## Smart Order Routing

`backend/app/services/smart_routing.py`

Greedy set-cover algorithm:
1. Finds all shops within radius carrying requested products
2. Picks the shop covering the most unfulfilled items (tie-breaks by distance)
3. Repeats until all items are covered or exhausted
4. Delivery fee = ₹20 base + ₹2/km per shop

## API Endpoints

| Group    | Prefix       | Highlights                              |
|----------|--------------|-----------------------------------------|
| Auth     | `/auth`      | register, login, refresh token          |
| Users    | `/users`     | profile CRUD                            |
| Shops    | `/shops`     | nearby search (geo), CRUD               |
| Products | `/products`  | shop products, my inventory             |
| Orders   | `/orders`    | preview (smart route), place, track     |
| Delivery | `/delivery`  | available orders, accept, location, done|
