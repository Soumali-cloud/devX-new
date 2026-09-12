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


def _first_value(row: dict[str, object], *names: str) -> object | None:
    return next((row[name] for name in names if row.get(name) not in (None, "")), None)


def _number(row: dict[str, object], *names: str) -> float | None:
    value = _first_value(row, *names)
    try:
        return float(str(value).replace(",", "")) if value is not None else None
    except ValueError:
        return None


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
        identifier = _first_value(normalized, "name", "id", "iceberg_id")
        latitude = _first_value(normalized, "lat", "latitude")
        longitude = _first_value(normalized, "lon", "longitude")
        if not identifier or latitude in (None, "") or longitude in (None, ""):
            continue
        try:
            area_sq_km = _number(normalized, "area_sq_km", "area_km2", "area_km²", "area")
            length_m = _number(normalized, "length_m", "length", "major_axis_m", "size_1_m")
            width_m = _number(normalized, "width_m", "width", "minor_axis_m", "size_2_m")
            # USNIC feeds do not always publish axes. Use a declared estimate
            # from observed area in that case, rather than returning blanks.
            if area_sq_km and area_sq_km > 0 and (not length_m or not width_m):
                length_m = (area_sq_km * 1_000_000 * 1.5) ** 0.5
                width_m = length_m / 1.5
            observations.append({
                "iceberg_id": str(identifier),
                "latitude": float(latitude),
                "longitude": float(longitude),
                "area_sq_km": area_sq_km,
                "length_m": length_m,
                "width_m": width_m,
                "thickness_m": _number(normalized, "thickness_m", "thickness"),
                "dimensions_status": "observed" if length_m and width_m and _first_value(normalized, "length_m", "length", "major_axis_m", "size_1_m") else "estimated",
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
