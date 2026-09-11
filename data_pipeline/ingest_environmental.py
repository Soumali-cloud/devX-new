"""Ingest ERA5 wind/current vectors and USNIC iceberg observations."""

import csv
import io
import os
from pathlib import Path
from typing import Callable
from urllib.request import Request, urlopen

import numpy as np

from ml_engine.models.iceberg_drift import IcebergDriftModel

PROJECT_ROOT = Path(__file__).resolve().parents[1]
GRID_SHAPE = (316, 332)


def fetch_wind_current_vectors(days: int = 7) -> dict[str, np.ndarray]:
    """Return ERA5-compatible vector arrays for the Antarctic grid.

    If ``ENVIRONMENTAL_VECTOR_FILE`` points to an ``.npz`` file, it must contain
    ``wind_u``, ``wind_v``, ``current_u`` and ``current_v`` arrays. Otherwise,
    the function returns zero-current, low-wind arrays as an explicit offline
    fallback. ERA5 retrieval can be supplied through a local CDS export because
    CDS credentials and dataset choices are deployment-specific.
    """
    if days < 1:
        raise ValueError("days must be at least 1")
    configured_file = os.environ.get("ENVIRONMENTAL_VECTOR_FILE") or str(PROJECT_ROOT / "data" / "raw" / "era5" / "vectors.npz")
    if configured_file and Path(configured_file).exists():
        source = Path(configured_file)
        if not source.is_absolute():
            source = PROJECT_ROOT / source
        with np.load(source) as values:
            result = {name: np.asarray(values[name], dtype=np.float32) for name in ("wind_u", "wind_v", "current_u", "current_v")}
        for name, value in result.items():
            if value.shape[0] < days:
                raise ValueError(f"{name} contains {value.shape[0]} days; need {days}")
        return {name: value[:days] for name, value in result.items()}

    raise FileNotFoundError(
        f"Missing real environmental vectors at {configured_file}; "
        "zero-valued synthetic vectors are disabled"
    )


def fetch_usnic_icebergs(url: str | None = None) -> list[dict[str, object]]:
    """Parse an accessible USNIC CSV feed into active iceberg observations.

    The URL is read from ``USNIC_ICEBERG_CSV_URL`` when omitted. CSVs should
    provide an iceberg identifier and latitude/longitude columns; common names
    such as ``name``, ``id``, ``lat`` and ``lon`` are accepted.
    """
    feed_url = url or os.environ.get("USNIC_ICEBERG_CSV_URL")
    if feed_url:
        try:
            request = Request(feed_url, headers={"User-Agent": "Mozilla/5.0 AntarcticNavigation/1.0"})
            with urlopen(request, timeout=30) as response:
                text = response.read().decode("utf-8-sig")
        except OSError:
            text = ""
    else:
        local_path = PROJECT_ROOT / "data" / "raw" / "usnic" / "icebergs.csv"
        text = local_path.read_text(encoding="utf-8-sig") if local_path.exists() else ""
    if not text:
        return []
    observations: list[dict[str, object]] = []
    for row in csv.DictReader(io.StringIO(text)):
        normalized = {str(key).strip().lower(): value for key, value in row.items()}
        identifier = normalized.get("name") or normalized.get("id") or normalized.get("iceberg_id")
        latitude = normalized.get("lat") or normalized.get("latitude")
        longitude = normalized.get("lon") or normalized.get("longitude")
        if not identifier or latitude in (None, "") or longitude in (None, ""):
            continue
        try:
            observations.append({
                "iceberg_id": str(identifier),
                "latitude": float(latitude),
                "longitude": float(longitude),
                "track_history": [],
            })
        except ValueError:
            continue
    return observations


def forecast_active_icebergs(
    days: int = 7,
    grid_position_resolver: Callable[[float, float], tuple[int, int]] | None = None,
) -> list[dict[str, object]]:
    """Attach a seven-day drift trajectory to each current USNIC observation."""
    icebergs = fetch_usnic_icebergs()
    vectors = fetch_wind_current_vectors(days)
    model = IcebergDriftModel()
    for iceberg in icebergs:
        if grid_position_resolver is not None:
            row, column = grid_position_resolver(
                float(iceberg["latitude"]), float(iceberg["longitude"])
            )
            iceberg["grid_row"], iceberg["grid_column"] = row, column
        else:
            row = int(iceberg.get("grid_row", 0))
            column = int(iceberg.get("grid_column", 0))
        select = lambda values: values[:, row, column] if values.ndim == 3 else values
        iceberg["trajectory"] = model.predict_trajectory(
            float(iceberg["latitude"]), float(iceberg["longitude"]),
            select(vectors["wind_u"]), select(vectors["wind_v"]),
            select(vectors["current_u"]), select(vectors["current_v"]), days=days,
        )
    return icebergs
