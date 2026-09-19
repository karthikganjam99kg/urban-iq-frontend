<div align="center">

# ⚡ URBAN**IQ** — CITY NERVOUS SYSTEM

### `SIH 26124` · AI-Powered Mobile Urban Intelligence Platform Using Public Transport Fleet

**Turn every city bus into a roaming sensor. Turn every frame into a decision.**

[![Live Command Centre](https://img.shields.io/badge/LIVE-Command_Centre-00e5ff?style=for-the-badge)](https://hyderabad-urban-intelligence.vercel.app)
[![Neural API](https://img.shields.io/badge/NEURAL-API_Online-7c4dff?style=for-the-badge)](https://priyaredddy-cse-hyderabad-urban-intelligence-api.hf.space/api/health)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)

</div>

---

## 🛰️ What this is

Hyderabad has thousands of buses already driving every road, every day. UrbanIQ treats that
fleet as a **distributed sensor grid**: a phone or dash camera on board streams frames, YOLO
models read the road, and this dashboard turns raw pixels into civic action — potholes logged,
garbage flagged, vehicles counted, safe fitness routes recommended from live congestion.

No new hardware fleet. No new patrol crews. Just intelligence layered on top of transport that
is already moving.

## 🧠 Capabilities

| Module | What it does | Signal source |
| --- | --- | --- |
| 📊 **Dashboard** | City-wide vitals, congestion pulse, incident rollup | `/api/overview` + TomTom |
| 🚌 **Live Fleet** | Bus roster, route status, live map, freshness | Supabase fleet catalog + telemetry |
| 🤖 **AI Prediction** | Gated one-hour crowd-demand proxy | Supabase `vehicle_density` + rolling model |
| 🕳️ **Pothole Detection** | Upload or capture a frame, get boxed potholes + confidence | YOLO `pothole2v.pt` |
| 🗑️ **Garbage Detection** | Flags waste hotspots and raises alerts | YOLO `best.pt` |
| 🚗 **Vehicle + Plate AI** | Counts vehicles, reads plates, scores rash motion | YOLO `yolo11n.pt` + EasyOCR |
| 🗺️ **Routes** | Catalog and gated best-route recommendation | Supabase route conditions |
| 🏃 **Fitness & Sports** | Verified routes/facilities with a live safety overlay | Supabase catalog + TomTom |
| 🚦 **Traffic Simulator** | Stress-test congestion scenarios from a recent baseline | TomTom + vehicle density |
| 🔔 **Alerts** | Chronological civic incident stream | Supabase `alerts` via the API |

## 🏗️ Architecture

```mermaid
flowchart LR
    BUS["🚌 Bus camera / upload"] --> UI["⚡ UrbanIQ UI<br/>React 19 + Vite · Vercel"]
    UI -- "HTTPS /api/*" --> API["🧠 Neural API<br/>Flask + Gunicorn · HF Docker Space"]
    API --> YOLO["👁️ YOLO11 + EasyOCR<br/>pothole · garbage · vehicle · plate"]
    API -- "traffic flow" --> TOMTOM["🛰️ TomTom Traffic API"]
    UI -- "snapshots + detections" --> SUPA["🗄️ Supabase<br/>Postgres + Realtime"]
    SUPA -- "live feed" --> UI
```

**Why split?** YOLO weights and Torch will never fit a serverless function. The UI ships as
static assets on Vercel's edge; the heavy vision stack lives on a CPU Docker Space that can
hold models in memory. The two only ever speak JSON.

## 🚀 Quickstart

```bash
git clone https://github.com/karthikganjam99kg/urban-iq-frontend.git
cd urban-iq-frontend
npm install
cp .env.example .env.local     # add your Supabase + API values
npm run dev                    # http://localhost:5173
```

By default `npm run dev` proxies `/api` to `http://127.0.0.1:5001`, so you can run the backend
locally. Leave `VITE_API_BASE_URL` unset in development to use that proxy; production falls
back to the hosted Space automatically.

### Run the API locally

This repo is UI-only. Clone [urban-iq-backend](https://github.com/karthikganjam99kg/urban-iq-backend) and follow its README (Gunicorn on port 5001). Then `npm run dev` here; Vite proxies `/api` to that process.

## 🔑 Environment

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Vercel / `.env.local` | Neural API base URL, no trailing slash |
| `VITE_SUPABASE_URL` | Vercel / `.env.local` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel / `.env.local` | Browser-safe key, guarded by RLS |

TomTom and the Supabase **secret** key belong only in [urban-iq-backend](https://github.com/karthikganjam99kg/urban-iq-backend). Schema SQL is there too: `supabase/schema.sql`.

### Use a phone as a fleet GPS device

Open `/fleet-device.html` on the deployed HTTPS site, choose the configured bus, paste the
`FLEET_INGEST_TOKEN`, and tap **Start live sharing**. The standalone page sends the phone's
real GPS position to `/api/fleet/telemetry` about once per minute while it remains open.
The token is held only in the open page and is not compiled into the frontend or saved to
local storage.

## 🌐 Deploy

Every push to `main` ships to production via Vercel's Git integration.

```bash
git push origin main       # → build → https://hyderabad-urban-intelligence.vercel.app
```

The backend deploys separately — see the
[urban-iq-backend](https://github.com/karthikganjam99kg/urban-iq-backend) repo.

## 🗺️ Roadmap

- On-bus edge inference so only detections travel, not video
- Municipal work-order handoff for confirmed potholes
- Multi-city tenancy with per-corridor congestion baselines
- Historical heatmaps from the Supabase snapshot archive

<div align="center">

**Built for Smart India Hackathon · Problem Statement 26124**

</div>
