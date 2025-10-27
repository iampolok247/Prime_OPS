# PrimeOPS API (Phase 0)

## Setup
1) Copy `.env.sample` to `.env` and set values.
2) `npm i`
3) Run MongoDB locally or set MONGO_URI to Atlas.
4) Seed users: `npm run seed`
   - Default password for all: `password123`
5) Start dev: `npm run dev` (http://localhost:5001)

## Health
GET `/health` → `{ ok: true }`

## Auth
- POST `/api/auth/login` { email, password }
- GET `/api/auth/me`
- POST `/api/auth/logout`
- PUT `/api/auth/me` { name?, avatar?, currentPassword?, newPassword? }

Cookies: `token` (httpOnly). Enable CORS `CLIENT_ORIGIN`.
