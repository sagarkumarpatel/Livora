# Livora

Full-stack travel & stay listing platform separated into a **React + Vite** frontend and a **Node.js + Express** REST API backend with **MongoDB Atlas** and **Cloudinary**.

## Project Structure

- `backend/` — Node.js + Express REST API, Mongoose models, JWT + Passport auth, Joi validation, OpenStreetMap Nominatim geocoding, and Cloudinary image uploads.
- `frontend/` — React + Vite SPA, React Router, Bootstrap 5, Font Awesome, Leaflet interactive maps, Axios API client.

## Setup

### 1. Backend (`backend/`)

1. Copy `backend/.env.example` to `backend/.env` and configure:
   - `ATLASHDB_URL` — MongoDB Atlas connection string
   - `SECRET` — JWT signing secret
   - `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` — Cloudinary credentials
   - `CLIENT_URL` — Frontend origin (default `http://localhost:5173`)
2. Install dependencies & run:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

### 2. Frontend (`frontend/`)

1. Install dependencies & run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173` (Vite proxies `/api` requests to `http://localhost:8080`).
