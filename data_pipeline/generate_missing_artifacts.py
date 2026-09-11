"""Create deterministic offline fixtures for local API demonstrations.

These arrays are synthetic and must not be used for scientific forecasting or
operational navigation.  They only make the offline demo and test environment
self-contained when real ERA5 and NSIDC inputs are unavailable.
"""

from pathlib import Path

import numpy as np


PROJECT_ROOT = Path(__file__).resolve().parents[1]
GRID_SHAPE = (316, 332)


def _synthetic_ice(frames: int) -> np.ndarray:
    """Return repeatable, spatially varying concentrations in [0.1, 0.8]."""
    rows, columns = np.indices(GRID_SHAPE, dtype=np.float32)
    radial = np.hypot(rows - 150.0, columns - 170.0)
    output = []
    for day in range(frames):
        field = 0.42 + 0.22 * np.cos(radial / 58.0 + day / 7.0)
        field += 0.12 * np.sin(columns / 37.0 - day / 5.0)
        output.append(np.clip(field, 0.1, 0.8))
    return np.stack(output).astype(np.float32)


def generate_all_missing_artifacts() -> None:
    """Write backend-compatible environmental, forecast, and sample fixtures."""
    era5_dir = PROJECT_ROOT / "data" / "raw" / "era5"
    processed_dir = PROJECT_ROOT / "data" / "processed"
    sample_dir = PROJECT_ROOT / "data" / "sample"
    era5_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)
    sample_dir.mkdir(parents=True, exist_ok=True)

    vector_shape = (7, *GRID_SHAPE)
    np.savez_compressed(
        era5_dir / "vectors.npz",
        wind_u=np.full(vector_shape, 5.0, dtype=np.float32),
        wind_v=np.full(vector_shape, -2.0, dtype=np.float32),
        current_u=np.full(vector_shape, 0.1, dtype=np.float32),
        current_v=np.full(vector_shape, -0.05, dtype=np.float32),
    )

    ice_tensor = _synthetic_ice(30)
    np.save(processed_dir / "sea_ice_tensors_v2.npy", ice_tensor)
    np.save(processed_dir / "ice_forecast_7day.npy", _synthetic_ice(7))
    np.save(sample_dir / "demo_antantarctic.npy", ice_tensor[-1])
    print("Created deterministic synthetic offline artifacts under data/.")


if __name__ == "__main__":
    generate_all_missing_artifacts()
