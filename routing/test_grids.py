"""Deterministic heterogeneous forecast grids for routing tests and demos."""

import numpy as np


def make_heterogeneous_forecast(days: int = 7, height: int = 316, width: int = 332) -> np.ndarray:
    """Create forecast fields with ridges, land, and navigable gradient channels."""
    if days < 1 or height < 12 or width < 12:
        raise ValueError("grid dimensions are too small")
    rows, columns = np.indices((height, width), dtype=float)
    base = 0.08 + 0.12 * (rows / max(height - 1, 1))
    ridge_center = width * 0.52 + 10.0 * np.sin(rows / 24.0)
    ridge = 0.76 * np.exp(-((columns - ridge_center) / 5.0) ** 2)
    ridge *= ((rows > height * 0.18) & (rows < height * 0.82))
    diagonal_ridge = 0.18 * np.exp(-((columns - (0.35 * rows + width * 0.18)) / 7.0) ** 2)
    direct_ridge = 0.84 * np.exp(-((columns - (rows - 130.0)) / 4.0) ** 2)
    direct_ridge *= ((columns > width * 0.12) & (columns < width * 0.88))
    channel = 0.18 * np.exp(-((columns - width * 0.77) / 13.0) ** 2)
    land = ((rows < height * 0.08) & (columns < width * 0.22)) | (columns > width * 0.94)
    forecast = []
    for day in range(days):
        variation = 1.0 + 0.04 * day
        field = np.clip(base + variation * (ridge + diagonal_ridge + direct_ridge) - channel, 0.0, 0.99)
        field[land] = 1.0
        forecast.append(field.astype(np.float32))
    return np.stack(forecast)
