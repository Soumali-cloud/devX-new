# Antarctic Navigation System: Agent Instructions

## Core System Directives
1. **Repository Layout Enforcement**: Always write code targeting the exact modular directory layout (`data_pipeline/`, `ml_engine/`, `routing/`, `backend/`, `frontend/`, `tests/`). Never move or delete existing modules.
2. **Real AI & Data Execution**: Avoid mock files or dummy arrays. Always build real PyTorch models (e.g., `SeaIceConvLSTM`), proper dataset loaders (`torch.utils.data.Dataset`), real loss metrics (Spatial MAE / RMSE), and production pipeline connections.
3. **Strict Domain Boundary**:
   - Machine Learning forecasting lives exclusively inside `ml_engine/`.
   - Deterministic pathfinding algorithms ($A^*$, risk matrices, fuel burn hydrodynamics) live exclusively inside `routing/`.
   - APIs and agent orchestration live in `backend/`.
   - Visual UI components live in `frontend/`.
4. **Geospatial Precision**: Respect EPSG:3031 Antarctic Polar Stereographic projection standards. Maintain sea ice concentration values strictly bounded to the range $[0.0, 1.0]$.

## Execution Order

1. Run `python data_pipeline/download_nsidc.py` to fetch real satellite frames.
2. Run `python data_pipeline/grid_preprocessor.py` to assemble `data/processed/sea_ice_tensors.npy`.
3. Run `python ml_engine/training/train_ice.py` to train on real Antarctic data.

Do not replace production data with mock files or dummy arrays. Keep routing deterministic and keep LLM behavior explanatory only.
