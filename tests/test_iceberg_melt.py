"""Regression tests for the physics-based iceberg melt API."""

from fastapi.testclient import TestClient

from backend.app.main import app
from ml_engine.models.iceberg_melt import (
    EnvironmentalForcing,
    IcebergProperties,
    MeltParameters,
    step_iceberg,
)


def _forcing() -> EnvironmentalForcing:
    return EnvironmentalForcing(
        ocean_surface_temp_c=-0.5,
        ocean_basal_temp_c=-0.3,
        depth_integrated_temp_c=-0.4,
        ocean_surface_u_m_s=0.1,
        ocean_surface_v_m_s=0.0,
        ocean_basal_u_m_s=0.05,
        ocean_basal_v_m_s=0.0,
        ocean_integrated_u_m_s=0.12,
        ocean_integrated_v_m_s=0.01,
        wind_u_m_s=8.0,
        wind_v_m_s=2.0,
        sea_ice_fraction=0.3,
        source_status="modelled",
        source="test forcing",
    )


def test_floating_ice_accounting_uses_density_difference():
    iceberg = IcebergProperties("A-23A", -69.5, 39.5, 1000, 700, 180)
    state, diagnostics = step_iceberg(iceberg, _forcing(), 1.0, MeltParameters())
    assert state is not None
    assert diagnostics["meltwater_m3"] > 0
    assert diagnostics["meltwater_m3"] < diagnostics["melted_ice_mass_kg"] / 900
    # Freshwater occupies slightly more volume than the seawater displaced by
    # equal mass. The contribution is therefore positive but extremely small.
    assert diagnostics["net_sea_level_equivalent_m"] > 0


def test_melt_simulation_requires_declared_forcing_or_explicit_demo():
    client = TestClient(app)
    payload = {
        "iceberg_id": "A-23A",
        "latitude": -69.5,
        "longitude": 39.5,
        "length_m": 1000,
        "width_m": 700,
        "thickness_m": 180,
        "horizon_years": 1,
    }
    response = client.post("/api/v1/icebergs/melt-simulations", json=payload)
    assert response.status_code == 422
    payload["use_scenario_baseline"] = True
    response = client.post("/api/v1/icebergs/melt-simulations", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["source_status"] == "scenario-based"
    assert result["checkpoints"]
    assert result["environmental_conditions"]["source_status"] == "scenario-based"
    assert result["environmental_conditions"]["ocean_surface_temp_c"] is not None
    saved = client.get(f"/api/v1/icebergs/melt-simulations/{result['simulation_id']}")
    assert saved.status_code == 200


def test_environment_source_inventory_is_explicit_about_configuration():
    client = TestClient(app)
    response = client.get("/api/v1/environment/sources")
    assert response.status_code == 200
    assert {source["name"] for source in response.json()["sources"]} >= {
        "Copernicus Marine", "ERA5 / ECMWF", "NSIDC", "US National Ice Center"
    }
