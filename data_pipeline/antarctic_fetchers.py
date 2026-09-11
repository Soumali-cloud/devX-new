"""Modern Antarctic environmental and iceberg-observation fetch adapters.

Network downloads are intentionally not implicit. Production deployments supply
authoritative local exports (NetCDF/NPZ/JSON) or configure the relevant public
provider credentials. Every result carries provenance and status metadata.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import numpy as np

from ml_engine.models.iceberg_melt import EnvironmentalForcing


PROJECT_ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FIELDS = (
    "ocean_surface_temp_c", "ocean_basal_temp_c", "depth_integrated_temp_c",
    "ocean_surface_u_m_s", "ocean_surface_v_m_s", "ocean_basal_u_m_s",
    "ocean_basal_v_m_s", "ocean_integrated_u_m_s", "ocean_integrated_v_m_s",
    "wind_u_m_s", "wind_v_m_s", "sea_ice_fraction",
)


def configured_environmental_sources() -> list[dict[str, str]]:
    """Describe configured sources without claiming unavailable data are live."""
    sources = [
        {"name": "Copernicus Marine", "purpose": "ocean temperature, currents, salinity", "configured": bool(os.getenv("COPERNICUS_MARINE_FILE"))},
        {"name": "ERA5 / ECMWF", "purpose": "10 m wind", "configured": bool(os.getenv("ERA5_WIND_FILE"))},
        {"name": "NSIDC", "purpose": "sea-ice concentration", "configured": bool(os.getenv("NSIDC_SEA_ICE_FILE"))},
        {"name": "US National Ice Center", "purpose": "iceberg observations", "configured": bool(os.getenv("USNIC_ICEBERG_CSV_URL") )},
    ]
    return sources


def _read_json_forcing(path: Path) -> dict[str, Any]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("environmental JSON must contain one object")
    return raw


def load_environmental_forcing(path: str | Path | None = None) -> EnvironmentalForcing:
    """Load a colocated forcing snapshot from a user-supplied JSON/NPZ export.

    A JSON object may include `source` and `source_status`; NPZ exports must
    carry the required scalar field names. Gridded interpolation belongs in the
    ingestion job, keeping API simulations deterministic and auditable.
    """
    configured = path or os.getenv("ANTARCTIC_ENVIRONMENT_FILE")
    if not configured:
        raise FileNotFoundError("No Antarctic forcing file configured. Set ANTARCTIC_ENVIRONMENT_FILE or supply forcing in the request.")
    source = Path(configured)
    if not source.is_absolute():
        source = PROJECT_ROOT / source
    if not source.exists():
        raise FileNotFoundError(f"Environmental forcing file not found: {source}")
    if source.suffix.lower() == ".json":
        values: dict[str, Any] = _read_json_forcing(source)
    elif source.suffix.lower() == ".npz":
        with np.load(source, allow_pickle=False) as archive:
            values = {field: float(np.asarray(archive[field]).reshape(-1)[0]) for field in REQUIRED_FIELDS if field in archive}
    else:
        raise ValueError("Environmental forcing must be JSON or NPZ; ingest NetCDF into a colocated snapshot first.")
    missing = [field for field in REQUIRED_FIELDS if field not in values]
    if missing:
        raise ValueError(f"Environmental forcing missing fields: {', '.join(missing)}")
    values = {field: float(values[field]) for field in REQUIRED_FIELDS} | {
        "source_status": values.get("source_status", "modelled"),
        "source": values.get("source", f"local export: {source.name}"),
    }
    return EnvironmentalForcing(**values)


def scenario_baseline_forcing() -> EnvironmentalForcing:
    """Return an explicit, non-observed baseline solely for demo/scenario runs."""
    return EnvironmentalForcing(
        ocean_surface_temp_c=-1.1, ocean_basal_temp_c=-0.7, depth_integrated_temp_c=-0.9,
        ocean_surface_u_m_s=0.10, ocean_surface_v_m_s=0.03,
        ocean_basal_u_m_s=0.07, ocean_basal_v_m_s=0.02,
        ocean_integrated_u_m_s=0.09, ocean_integrated_v_m_s=0.025,
        wind_u_m_s=7.0, wind_v_m_s=2.0, sea_ice_fraction=0.55,
        source_status="scenario-based", source="built-in Antarctic scenario baseline (not observed forcing)",
    )
