# Livora

Airbnb-inspired full-stack rental booking marketplace separated into a **React + Vite** frontend (`frontend/`) and a **Node.js + Express** REST API backend (`backend/`) with **MongoDB Atlas**, **Cloudinary**, and **Razorpay (Test Mode)**.

## Key Features

- **Public Browsing**: Guests can browse all published listings, search destinations, filter by category, view multi-image galleries, amenities, maps, average ratings, and customer reviews without signing in.
- **Role-Based Access Control**:
  - **Guest**: Browse public listings and reviews.
  - **Customer**: Reserve available dates with dynamic pricing breakdowns, pay via Razorpay Checkout, manage bookings in **My Bookings**, cancel eligible reservations, and submit verified reviews after completed stays.
  - **Host**: Complete host onboarding (**Become a Host**) while retaining customer features, and manage isolated property listings, multi-image uploads, visibility statuses (`published` / `unpublished` / `inactive`), blocked date ranges, bookings, and reviews in **Host Dashboard**.
- **Security & Data Integrity**: Server-side ownership verification on all host/customer resources, MongoDB ACID transactions for concurrent booking protection, and constant-time HMAC-SHA256 Razorpay signature verification.

## Setup

### 1. Backend (`backend/`)

1. Copy `backend/.env.example` to `backend/.env` and configure:
   - `ATLASHDB_URL` — MongoDB Atlas connection string
   - `SECRET` — JWT signing secret
   - `CLIENT_URL` — Frontend origin (default `http://localhost:5173`)
   - `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` — Cloudinary credentials
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — Razorpay Test Mode credentials
2. Install dependencies & run:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. Run automated integration & security tests:
   ```bash
   cd backend
   npm test
   ```

### 2. Frontend (`frontend/`)

1. Install dependencies & run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173` (Vite proxies `/api` requests to `http://localhost:8080`).
