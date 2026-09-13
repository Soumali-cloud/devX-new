# HimYatra: Antarctic Sea Ice & Navigation DSS

**HimYatra ... The Polar Journey**

https://himyatra.netlify.app/
---

## 📌 Overview

HimYatra is a production-grade Decision Support System (DSS) engineered for Antarctic marine operations supported by the Ministry of Earth Sciences (MoES) and NCPOR. Navigating between research outposts like Maitri and Bharati Station presents severe risks due to dynamic pack ice, katabatic wind vectors, and drifting icebergs.

HimYatra unifies satellite microwave imagery, ERA5 reanalysis fields, and USNIC iceberg tracking into an interactive React + Deck.gl dynamic portal powered by a FastAPI machine learning engine. It computes real-time multi-objective vessel corridors, predicting fuel burn, speed penalties, and structural risks under polar conditions.

---

## 🎨 System Visual Identity

Designed with a strict, high-contrast polar palette for high visibility under maritime bridge operations:

| Role | Palette Name | Hex Code |
|---|---|---|
| Dark Background | Midnight Black | `#020617` |
| Primary Theme / Panels | Deep Ocean Navy | `#0F172A` |
| Secondary Controls | Research Blue | `#1E3A8A` |
| Accent / Bounding | Antarctic Ice Cyan | `#38BDF8` |
| Safest Route | Green | `#22C55E` |
| Fuel-Optimal Route | Blue | `#3B82F6` |
| Shortest Route | Amber | `#F59E0B` |
| Iceberg Standoff | Red | `#F87171` |

---

## 🏗️ Technical Architecture

The platform uses a modular micro-package architecture decoupling spatial data engineering, machine learning inference, hydrodynamic physical modeling, and WebGL polar rendering:

```
               ┌────────────────────────────────────────────────────────┐
               │           SAT-DATA INGESTION & PIPELINE                │
               │   • NSIDC Microwave Ice Tensors (316x332 Grid Array)   │
               │   • ERA5 Atmospheric Wind (u10, v10) & Current Fields  │
               │   • USNIC Iceberg Coordinates (Lat/Lon -> EPSG:3031)   │
               └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
               ┌────────────────────────────────────────────────────────┐
               │                   ML ENGINE & CORE                     │
               │   • ConvLSTM v2: 7-Day Spatial Sea-Ice Forecasts        │
               │   • XGBoost: Iceberg Trajectory Kinematic Tracking      │
               │   • Lindqvist Engine: Ice-Clearing Resistance Model     │
               └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
               ┌────────────────────────────────────────────────────────┐
               │              HIERARCHICAL A* PATHFINDER                │
               │   • Safest Corridor (Max Ice Clearance)                │
               │   • Fuel-Optimal Corridor (Min Lindqvist Drag)         │
               │   • Shortest Corridor (Distance-Weighted Matrix)       │
               └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
               ┌────────────────────────────────────────────────────────┐
               │              FASTAPI REST SERVICE (BACKEND)            │
               │   • /api/v1/forecast/sea-ice  | /api/v1/compute-routes │
               │   • Embedded SQLite Audit Log & SHA-256 Hash Chain     │
               └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
               ┌────────────────────────────────────────────────────────┐
               │             REACT + DECK.GL DASHBOARD (FRONTEND)       │
               │   • EPSG:3031 Stereographic Vector Canvas Rendering    │
               │   • 7-Day Timeline Scrubbing & Captain's AI Co-Pilot   │
               └────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
HimYatra/
├── backend/                  # FastAPI web application service
│   ├── app/
│   │   ├── main.py           # Core router, CORS, and EPSG:3031 latlon_to_grid engine
│   │   └── models.py         # Pydantic schemas and SQLite audit persistence models
│   └── Dockerfile            # Container deployment specification
├── data_pipeline/            # Data normalization and synthetic fixture generation
│   └── generate_missing_artifacts.py
├── ml_engine/                # Machine learning models & inference routines
│   ├── inference/             # Model runtime wrappers
│   └── models/                # ConvLSTM and XGBoost weights/checkpoints
├── routing/                  # Physics-informed A* pathfinding and Lindqvist engines
├── frontend/                 # Vite + React + Deck.gl dynamic web platform
│   ├── src/
│   │   ├── components/        # MapEngine, Dashboard, Visualizations, Settings
│   │   ├── services/          # Axios API client wrapper
│   │   └── App.jsx            # Main portal layout and dark/light router
│   └── tailwind.config.js    # HimYatra custom color token configurations
├── tests/                    # 17-test backend integration suite
└── render.yaml                # Render Cloud Deployment Blueprint
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites

- Python 3.10+
- Node.js v18+ & npm
- Docker & Docker Compose (Optional)

### 1. Backend Setup & Run

```powershell
# Clone workspace and enter repository
git clone https://github.com/your-org/himyatra.git
cd himyatra

# Set up virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt

# Generate local offline spatial fixtures
python data_pipeline/generate_missing_artifacts.py

# Run backend test suite (17 Tests)
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD="1"
python -m pytest tests/test_backend.py -v

# Launch FastAPI server
python -m uvicorn backend.app.main:app --reload --port 8000
```

### 2. Frontend Setup & Run

```powershell
# Open a new terminal tab in frontend/ directory
cd frontend

# Install node packages
npm install

# Launch Vite development server
npm run dev
```

---

## 🛠️ API Endpoint Reference

All requests require the `X-API-Key` header (`prod_secret_antarctic_nav_key_2026`).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health check and model loading state. |
| `GET` | `/api/v1/forecast/sea-ice` | Returns 7-day spatial tensor forecasts (316 × 332 matrix). |
| `GET` | `/api/v1/icebergs/active` | Active USNIC iceberg GPS positions mapped to polar grid coordinates. |
| `POST` | `/api/v1/compute-routes` | Computes Safest, Fuel-Optimal, and Shortest paths for selected Ice Class. |
| `GET` | `/api/v1/mission-summary/{id}` | Fetches decision audit trails and SHA-256 verification hash chains. |

---

## 🌐 Production Deployment Guide

### Render Backend Deployment (Blueprint)

1. Link repository in Render and select **New > Blueprint** (uses `render.yaml`).
2. Alternatively, set up a manual Docker Web Service:
   - **Environment:** Docker
   - **Docker Context Directory:** `.` (Repository root)
   - **Dockerfile Path:** `backend/Dockerfile`
3. Configure `CORS_ORIGINS` environment variable:

```json



```

---

## 🔒 Operational & Compliance Notes

- **Deterministic Navigation:** Pathfinding algorithms execute deterministic spatial graph operations. The LLM Co-Pilot provides operational summaries only and never alters calculated route waypoints.
- **Tamper-Evident Audit Logging:** Route execution histories are cryptographically hashed using SHA-256 chains inside SQLite for regulatory compliance.
- **Offline Fixture Notice:** Offline data files serve strictly for local testing, system verification, and demonstration. Real-world navigation requires live operational feeds.
