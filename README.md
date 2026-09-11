# Antarctic Sea Ice & Navigation DSS

> **HimYatra: The Polar Journey**

An AI/ML-enabled decision support platform capable of forecasting Antarctic sea ice concentration, predicting iceberg trajectories, and identifying safe and fuel-efficient navigation routes for research vessels using satellite, oceanographic, and meteorological datasets.

## Architecture

- `data_pipeline/`: Loads NSIDC sea-ice frames and local ERA5/USNIC inputs.
- `ml_engine/`: Forecasting, drift modeling, training, inference, and evaluation.
- `routing/`: Physics-informed cost modeling and time-dependent A* routing.
- `backend/`: FastAPI service exposing forecasts, routes, mission summaries, and explanatory briefings.
- `frontend/`: React, Deck.gl, and MapLibre polar operations interface.
- `tests/`: Integrity and behavioral tests.
- `notebooks/`: Judge evaluation and analysis notebooks.

## Quick start

1. Copy `.env.example` to `.env`; NASA/USNIC credentials are optional for offline mode.
2. Generate the deterministic offline fixtures with `python data_pipeline/generate_missing_artifacts.py`.
3. Start the API with `docker compose up --build`, or run `python -m uvicorn backend.app.main:app --reload`.

The routing engine remains deterministic; the briefing generator provides explanations only.
SQLite is the built-in route-audit store.  The generated offline fixtures are demonstrations,
not real environmental observations or operational forecasts.

