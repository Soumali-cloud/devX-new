import numpy as np
import pytest
from pathlib import Path
import time
from fastapi.testclient import TestClient

from backend.app.main import app
from routing.dynamic_astar import dynamic_astar
from routing.route_comparator import calculate_hydrodynamic_fuel, generate_route_options
from routing.test_grids import make_heterogeneous_forecast
from backend.core.config import settings


client = TestClient(app)


def test_api_health():
    response = client.get("/health")
    assert response.status_code == 200


def test_iceberg_forecast_api():
    response = client.get("/api/v1/forecast/icebergs")
    assert response.status_code == 200
    payload = response.json()
    assert "trajectory" in payload
    assert len(payload["trajectory"]) == 7


def test_astar_avoids_high_ice():
    grid = np.zeros((10, 10))
    grid[:, 5] = 1.0
    path = dynamic_astar(grid, start=(5, 0), goal=(5, 9), max_ice_threshold=0.95)
    assert path == []


def test_copilot_empty_query_validation():
    payload = {
        "query": "",
        "start_coords": [10, 10],
        "goal_coords": [50, 50],
        "forecast_day": 1,
    }
    response = client.post("/api/v1/copilot/briefing", json=payload)
    assert response.status_code == 200
    assert "ERROR" in response.json()["briefing"]


def test_route_api_uses_nontrivial_path_metrics():
    response = client.post(
        "/api/v1/compute-routes",
        json={"start_coords": [10, 10], "goal_coords": [50, 50], "forecast_day": 1},
    )
    assert response.status_code == 200
    routes = response.json()["routes"]
    assert {route["name"] for route in routes} == {"Safest", "Fuel-Optimal", "Shortest"}
    shortest = next(route for route in routes if route["name"] == "Shortest")
    assert shortest["path"][0] == [10, 10]
    assert shortest["path"][-1] == [50, 50]
    for route in routes:
        assert route["path"] == [] or (
            route["path"][0] == [10, 10] and route["path"][-1] == [50, 50]
        )


def test_routes_diverge_on_complex_ice():
    forecast = make_heterogeneous_forecast()
    forecast.fill(0.0)
    forecast[:, 140:180, 160:166] = 0.84
    forecast[:, 140, 160:166] = 0.0
    options = generate_route_options(forecast, (150, 20), (150, 300), [(150, 180)])
    assert options["safest"]["path"]
    assert options["shortest"]["path"]
    assert options["safest"]["path"] != options["shortest"]["path"]


def test_v2_checkpoint_and_forecast_artifacts():
    project_root = Path(__file__).resolve().parents[1]
    checkpoint = project_root / "ml_engine" / "training" / "checkpoints" / "convlstm_ice_v2.pt"
    forecast = project_root / "data" / "processed" / "ice_forecast_7day.npy"
    if not checkpoint.exists() or not forecast.exists():
        pytest.skip("Run NSIDC ingestion, preprocessing, training, and inference first")
    predicted = np.load(forecast)
    assert checkpoint.stat().st_size > 0
    assert predicted.shape[0] == 7
    assert predicted.ndim == 3
    assert np.all(predicted >= 0.0)
    assert np.all(predicted <= 1.0)


def test_hydrodynamic_fuel_calculation():
    path = [(0, 0), (0, 1), (0, 2), (0, 3), (0, 4)]
    open_grid = np.zeros((10, 10))
    ice_grid = np.full((10, 10), 0.8)

    fuel_open = calculate_hydrodynamic_fuel(path, open_grid, vessel_ice_class="PC5")
    fuel_ice = calculate_hydrodynamic_fuel(path, ice_grid, vessel_ice_class="PC5")
    fuel_standard_hull = calculate_hydrodynamic_fuel(path, ice_grid, vessel_ice_class="Standard")

    assert fuel_ice["estimated_fuel_tons"] > fuel_open["estimated_fuel_tons"]
    assert fuel_standard_hull["estimated_fuel_tons"] > fuel_ice["estimated_fuel_tons"]


def test_vessel_speed_reduces_in_heavy_ice():
    path = [(0, index) for index in range(5)]
    open_water = calculate_hydrodynamic_fuel(path, np.zeros((2, 5)))
    heavy_ice = calculate_hydrodynamic_fuel(path, np.full((2, 5), 0.8))
    assert heavy_ice["minimum_speed_knots"] < open_water["minimum_speed_knots"]
    assert heavy_ice["peak_power_kw"] > 0


def test_nasa_authentication_fallback(monkeypatch):
    from data_pipeline import download_nsidc

    monkeypatch.delenv("NASA_EARTHDATA_USER", raising=False)
    monkeypatch.delenv("NASA_EARTHDATA_PASS", raising=False)
    assert download_nsidc.settings.NASA_EARTHDATA_USER is None


def test_docker_environment_loading():
    project_root = Path(__file__).resolve().parents[1]
    assert (project_root / "Dockerfile").exists()
    assert (project_root / "docker-compose.yml").exists()
    assert (project_root / ".env.example").exists()


def test_astar_execution_speed():
    grid = np.zeros((316, 332), dtype=np.float32)
    started = time.perf_counter()
    path = dynamic_astar(grid, (10, 10), (50, 50))
    elapsed_ms = (time.perf_counter() - started) * 1000
    assert path
    assert elapsed_ms < 250


def test_environment_settings():
    assert settings.API_V1_STR == "/api/v1"
    assert settings.PROJECT_NAME
    assert isinstance(settings.CORS_ORIGINS, list)


def test_api_key_auth_security(monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", "test-secret")
    payload = {"start_coords": [10, 10], "goal_coords": [20, 20], "forecast_day": 1}
    assert client.post("/api/v1/compute-routes", json=payload).status_code == 401
    assert client.post("/api/v1/compute-routes", json=payload, headers={"X-API-Key": "wrong"}).status_code == 403
    assert client.post("/api/v1/compute-routes", json=payload, headers={"X-API-Key": "test-secret"}).status_code == 200


def test_astar_speed_under_100ms():
    grid = np.zeros((316, 332), dtype=np.float32)
    started = time.perf_counter()
    assert dynamic_astar(grid, (10, 10), (50, 50))
    assert (time.perf_counter() - started) * 1000 < 100


def test_usnic_csv_parsing_and_drift(tmp_path, monkeypatch):
    csv_path = tmp_path / "icebergs.csv"
    csv_path.write_text("name,lat,lon\nA-23a,-69.5,39.5\n", encoding="utf-8")
    from data_pipeline.ingest_environmental import fetch_usnic_icebergs, forecast_active_icebergs
    observations = fetch_usnic_icebergs(csv_path.as_uri())
    assert observations[0]["iceberg_id"] == "A-23a"
    monkeypatch.setenv("USNIC_ICEBERG_CSV_URL", csv_path.as_uri())
    tracks = forecast_active_icebergs()
    assert len(tracks[0]["trajectory"]) == 7


def test_nsidc_local_downloaded_file_fallback(tmp_path, monkeypatch):
    from data_pipeline.download_nsidc import download_nsidc_frames
    for day in range(1, 3):
        (tmp_path / f"frame_{day}.tif").write_bytes(b"local")
    monkeypatch.setenv("NSIDC_URL_TEMPLATE", "https://invalid.example/{filename}")
    files = download_nsidc_frames(days=2, output_dir=tmp_path)
    assert len(files) == 2
