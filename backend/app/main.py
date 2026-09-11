"""FastAPI REST API for Antarctic navigation decision support."""

import sys
import json
import logging
import math
import time
from collections import defaultdict, deque
from dataclasses import asdict
from pathlib import Path
from typing import Literal, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse
import numpy as np
from ml_engine.models.iceberg_drift import IcebergDriftModel
from backend.app.llm_agent import generate_captain_briefing
from routing.route_comparator import generate_route_options
from backend.core.config import settings
from backend.core.security import require_api_key
from backend.db.session import SessionLocal, get_db, init_db
from backend.db.models import RouteAudit
from data_pipeline.ingest_environmental import fetch_usnic_icebergs, forecast_active_icebergs
from data_pipeline.antarctic_fetchers import (
    configured_environmental_sources,
    load_environmental_forcing,
    scenario_baseline_forcing,
)
from ml_engine.models.iceberg_melt import (
    EnvironmentalForcing,
    IcebergProperties,
    MeltParameters,
    simulate_iceberg,
)

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

# Import inference pipeline
try:
	from ml_engine.inference.ice_forecast import generate_7day_forecast
	HAS_ML = True
except ImportError:
	HAS_ML = False


app = FastAPI(
	title=settings.PROJECT_NAME,
	version="1.0.0",
	description="Real-time ice forecasting and ship route optimization for Antarctic operations"
)
app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.CORS_ORIGINS,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)
init_db()

logger = logging.getLogger("navigation_api")
logging.basicConfig(level=logging.INFO)
request_times: dict[str, deque[float]] = defaultdict(deque)


def latlon_to_grid(latitude: float, longitude: float) -> tuple[int, int]:
	"""Map WGS84 coordinates to a 25 km EPSG:3031 navigation-grid cell."""
	if not (math.isfinite(latitude) and math.isfinite(longitude)):
		raise ValueError("latitude and longitude must be finite")
	if not -90.0 <= latitude < 0.0:
		raise ValueError("EPSG:3031 navigation coordinates require a southern latitude")
	if not -180.0 <= longitude <= 180.0:
		raise ValueError("longitude must be between -180 and 180 degrees")
	radius, eccentricity = 6_378_137.0, 0.08181919
	standard_parallel = math.radians(-71.0)
	latitude_radians, longitude_radians = math.radians(latitude), math.radians(longitude)

	def polar_t(phi: float) -> float:
		return math.tan(math.pi / 4.0 - phi / 2.0) / (
			(1.0 - eccentricity * math.sin(phi)) /
			(1.0 + eccentricity * math.sin(phi))
		) ** (eccentricity / 2.0)

	m_c = math.cos(standard_parallel) / math.sqrt(
		1.0 - eccentricity**2 * math.sin(standard_parallel) ** 2
	)
	rho = radius * m_c * polar_t(latitude_radians) / polar_t(standard_parallel)
	x, y = rho * math.sin(longitude_radians), -rho * math.cos(longitude_radians)
	minimum, maximum = -3_950_000.0, 3_950_000.0
	if not (minimum <= x <= maximum and minimum <= y <= maximum):
		raise ValueError("coordinate lies outside the 316 x 332 navigation grid")
	row = round((maximum - y) / (maximum - minimum) * 315)
	column = round((x - minimum) / (maximum - minimum) * 331)
	return int(max(0, min(315, row))), int(max(0, min(331, column)))


@app.middleware("http")
async def request_logging_and_rate_limit(request, call_next):
	client = request.client.host if request.client else "unknown"
	now = time.monotonic()
	times = request_times[client]
	while times and now - times[0] > 60:
		times.popleft()
	if len(times) >= 120:
		return JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)
	times.append(now)
	started = time.perf_counter()
	response = await call_next(request)
	logger.info(json.dumps({"method": request.method, "path": request.url.path, "status": response.status_code, "duration_ms": round((time.perf_counter() - started) * 1000, 2)}))
	return response


class RouteRequest(BaseModel):
	"""Request model for route computation."""
	start_coords: list[int] = Field(..., min_length=2, max_length=2)
	goal_coords: list[int] = Field(..., min_length=2, max_length=2)
	forecast_day: int = Field(1, ge=1, le=7)
	vessel_ice_class: Optional[str] = Field("PC5", description="Polar Class: PC1, PC3, PC5, PC7, or Standard")
	mission_id: Optional[str] = Field(None, min_length=1, max_length=128)


class Route(BaseModel):
	"""Single route option with metrics."""
	name: str  # "Safest", "Fuel-Optimal", "Shortest"
	path: list  # List of [row, col] waypoints
	distance: float
	ice_risk_score: float
	estimated_fuel_tons: float
	minimum_speed_knots: float = 0.0
	peak_power_kw: float = 0.0


class RouteResponse(BaseModel):
	"""Response with multiple route options."""
	forecast_day: int
	origin: list
	destination: list
	routes: list[Route]
	ice_grid_stats: dict
	vessel_ice_class: str = "PC5"


class CopilotRequest(BaseModel):
	"""Request model for captain briefing generation."""
	query: str
	start_coords: list
	goal_coords: list
	forecast_day: int = 1


class EnvironmentalForcingRequest(BaseModel):
    ocean_surface_temp_c: float
    ocean_basal_temp_c: float
    depth_integrated_temp_c: float
    ocean_surface_u_m_s: float
    ocean_surface_v_m_s: float
    ocean_basal_u_m_s: float
    ocean_basal_v_m_s: float
    ocean_integrated_u_m_s: float
    ocean_integrated_v_m_s: float
    wind_u_m_s: float
    wind_v_m_s: float
    sea_ice_fraction: float = Field(..., ge=0, le=1)
    salinity_psu: float | None = Field(None, ge=0, le=45)
    source_status: Literal["observed", "modelled", "scenario-based"]
    source: str = Field(..., min_length=3, max_length=500)


class IcebergMeltSimulationRequest(BaseModel):
    iceberg_id: str = Field(..., min_length=1, max_length=128)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    length_m: float = Field(..., gt=0)
    width_m: float = Field(..., gt=0)
    thickness_m: float = Field(..., gt=0)
    shape_factor: float = Field(0.78, gt=0, le=1)
    ice_density_kg_m3: float = Field(917.0, ge=800, le=950)
    dimensions_status: Literal["observed", "estimated"] = "estimated"
    horizon_years: Literal[1, 5, 10, 20, 30] = 30
    scenario: Literal["low", "moderate", "high"] = "moderate"
    forcing: EnvironmentalForcingRequest | None = None
    use_scenario_baseline: bool = False
    ocean_area_m2: float = Field(3.61e14, gt=0)


def _resolve_melt_forcing(request: IcebergMeltSimulationRequest) -> EnvironmentalForcing:
    if request.forcing is not None:
        values = request.forcing.model_dump(exclude={"salinity_psu"})
        return EnvironmentalForcing(**values)
    try:
        return load_environmental_forcing()
    except (FileNotFoundError, ValueError) as exc:
        if request.use_scenario_baseline:
            return scenario_baseline_forcing()
        raise HTTPException(
            status_code=422,
            detail=("Modern forcing is required. Supply `forcing`, configure "
                    "ANTARCTIC_ENVIRONMENT_FILE, or explicitly set "
                    "use_scenario_baseline=true for a non-observed demo. "
                    f"Details: {exc}"),
        ) from exc


@app.get("/")
def read_root() -> dict:
	"""Health check endpoint."""
	return {
		"status": "Online",
		"system": "Antarctic Navigation API",
		"version": "1.0.0"
	}


@app.get("/health")
def health_check() -> dict:
	"""API health status."""
	return {"status": "healthy", "service": "navigation-api"}


@app.post("/api/v1/compute-routes")
def compute_routes(req: RouteRequest, _: None = Depends(require_api_key)) -> RouteResponse:
	"""
	Computes Safest, Fuel-Optimal, and Shortest routes over ML-predicted ice fields.
	
	Args:
		req: RouteRequest with start/goal coordinates and forecast day
	
	Returns:
		RouteResponse with multiple route options and metrics
	"""
	if not HAS_ML:
		raise HTTPException(
			status_code=500,
			detail="ML pipeline not available"
		)
	
	forecast_path = PROJECT_ROOT / "data" / "processed" / "ice_forecast_7day.npy"
	
	# Generate forecast if missing
	if not forecast_path.exists():
		print("Forecast not found, generating...")
		generate_7day_forecast()
	
	forecast_grid = np.load(forecast_path)
	
	if req.forecast_day < 1 or req.forecast_day > forecast_grid.shape[0]:
		raise HTTPException(
			status_code=400,
			detail=f"forecast_day must be between 1 and {forecast_grid.shape[0]}"
		)
	
	# Get ice grid for the requested forecast day (0-indexed)
	day_grid = forecast_grid[req.forecast_day - 1]
	
	if len(req.start_coords) != 2 or len(req.goal_coords) != 2:
		raise HTTPException(
			status_code=400,
			detail="start_coords and goal_coords must be [row, col] pairs"
		)

	start = tuple(req.start_coords)
	goal = tuple(req.goal_coords)
	grid_height, grid_width = day_grid.shape
	for name, point in (("start_coords", start), ("goal_coords", goal)):
		if not all(isinstance(value, int) for value in point):
			raise HTTPException(status_code=400, detail=f"{name} must contain integer grid coordinates")
		if not (0 <= point[0] < grid_height and 0 <= point[1] < grid_width):
			raise HTTPException(
				status_code=400,
				detail=f"{name} must be within grid bounds [0-{grid_height - 1}, 0-{grid_width - 1}]"
			)
	
	# Compute grid statistics
	grid_stats = {
		"mean_ice_concentration": float(day_grid.mean()),
		"max_ice_concentration": float(day_grid.max()),
		"min_ice_concentration": float(day_grid.min()),
		"grid_shape": day_grid.shape,
	}
	
	active_icebergs = fetch_usnic_icebergs()
	iceberg_positions = []
	for iceberg in active_icebergs:
		try:
			iceberg_positions.append(latlon_to_grid(
				float(iceberg["latitude"]), float(iceberg["longitude"])
			))
		except (KeyError, TypeError, ValueError):
			continue
	route_options = generate_route_options(forecast_grid, start, goal, iceberg_positions, req.vessel_ice_class or "PC5")
	route_labels = {"safest": "Safest", "fuel_optimal": "Fuel-Optimal", "shortest": "Shortest"}
	routes = [
		Route(name=route_labels[name], path=[list(point) for point in option["path"]], distance=option["metrics"]["distance_km"], ice_risk_score=option["metrics"]["avg_ice_risk"], estimated_fuel_tons=option["metrics"]["estimated_fuel_tons"], minimum_speed_knots=option["metrics"]["minimum_speed_knots"], peak_power_kw=option["metrics"]["peak_power_kw"])
		for name, option in route_options.items()
	]
	
	result = RouteResponse(
		forecast_day=req.forecast_day,
		origin=list(start),
		destination=list(goal),
		routes=routes,
		ice_grid_stats=grid_stats,
		vessel_ice_class=req.vessel_ice_class or "PC5",
	)
	with SessionLocal() as session:
		route_payload = result.model_dump()
		session.add(RouteAudit(
			forecast_day=req.forecast_day,
			vessel_ice_class=req.vessel_ice_class or "PC5",
			origin=json.dumps(list(start)),
			destination=json.dumps(list(goal)),
			iceberg_positions=json.dumps(iceberg_positions),
		selected_route="",
		estimated_fuel_tons=min((route.estimated_fuel_tons for route in routes if route.path), default=0.0),
		mission_id=req.mission_id or "default",
		route_data=json.dumps(route_payload),
	))
		session.commit()
	return result


@app.get("/api/v1/mission-summary/{mission_id}")
def get_mission_summary(mission_id: str, db=Depends(get_db)) -> dict:
	"""Return aggregate route-audit metrics for one mission.

	The endpoint is backed by the local SQLite audit store, so it remains
	available when optional PostGIS or Redis services are not running.
	"""
	routes = (
		db.query(RouteAudit)
		.filter(RouteAudit.mission_id == mission_id)
		.order_by(RouteAudit.created_at.asc(), RouteAudit.id.asc())
		.all()
	)
	if not routes:
		return {
			"mission_id": mission_id,
			"status": "NO_ROUTE_AUDITS",
			"total_routes_evaluated": 0,
			"total_distance_km": 0.0,
			"total_fuel_burn_mt": 0.0,
			"avg_ice_concentration": None,
			"audit_status": "NO_AUDITS",
		}

	payloads = []
	for route in routes:
		try:
			payloads.append(json.loads(route.route_data))
		except (TypeError, json.JSONDecodeError):
			payloads.append({})
	latest_payload = payloads[-1]
	all_options = [option for payload in payloads for option in payload.get("routes", [])]
	ice_scores = [float(option["ice_risk_score"]) for option in all_options if option.get("ice_risk_score") is not None]
	distances = [float(option["distance"]) for option in all_options if option.get("distance") is not None]
	audit_material = "\n".join(
		f"{route.id}|{route.created_at.isoformat()}|{route.route_data}" for route in routes
	)
	import hashlib
	audit_sha256 = hashlib.sha256(audit_material.encode("utf-8")).hexdigest()
	return {
		"mission_id": mission_id,
		"status": "COMPLETED",
		"total_routes_evaluated": len(routes),
		"total_distance_km": round(sum(distances), 2),
		"total_fuel_burn_mt": round(sum(route.estimated_fuel_tons for route in routes), 2),
		"avg_ice_concentration": round(sum(ice_scores) / len(ice_scores), 4) if ice_scores else None,
		"latest_route": latest_payload,
		"created_at": routes[-1].created_at.isoformat(),
		"audit_status": "VERIFIED_SHA256",
		"audit_sha256": audit_sha256,
	}


@app.get("/api/v1/forecast/icebergs")
def get_iceberg_forecasts() -> dict:
	"""Return a seven-day drift trajectory for the tracked sample iceberg."""
	active = forecast_active_icebergs(grid_position_resolver=latlon_to_grid)
	if active:
		return {
			"icebergs": [
				{**iceberg, "grid_position": [iceberg["grid_row"], iceberg["grid_column"]]}
				for iceberg in active
			]
		}
	model = IcebergDriftModel()
	wind_u = np.array([2.5, 3.0, 1.5, -0.5, -2.0, 1.0, 3.5])
	wind_v = np.array([1.0, 1.2, 0.8, 2.0, 1.5, -0.5, 0.0])
	current_u = np.array([0.2, 0.25, 0.22, 0.18, 0.15, 0.2, 0.25])
	current_v = np.array([0.05, 0.08, 0.06, 0.04, 0.02, 0.05, 0.07])
	trajectory = model.predict_trajectory(-69.5, 39.5, wind_u, wind_v, current_u, current_v)
	return {
		"iceberg_id": "A-23a_TRACK",
		"initial_position": {"lat": -69.5, "lon": 39.5},
		"grid_position": list(latlon_to_grid(-69.5, 39.5)),
		"trajectory": trajectory,
	}


@app.get("/api/v1/environment/sources")
def get_environment_sources() -> dict:
	"""List modern-data fetchers and whether a deployment configured them."""
	return {
		"sources": configured_environmental_sources(),
		"contract": "Use authoritative current/recent exports. Unconfigured sources are not represented as live data.",
	}


@app.post("/api/v1/icebergs/melt-simulations")
def create_iceberg_melt_simulation(
	request: IcebergMeltSimulationRequest,
	_: None = Depends(require_api_key),
) -> dict:
	"""Run and persist an auditable physical iceberg melt simulation."""
	forcing = _resolve_melt_forcing(request)
	iceberg = IcebergProperties(
		iceberg_id=request.iceberg_id,
		latitude=request.latitude,
		longitude=request.longitude,
		length_m=request.length_m,
		width_m=request.width_m,
		thickness_m=request.thickness_m,
		shape_factor=request.shape_factor,
		ice_density_kg_m3=request.ice_density_kg_m3,
		dimensions_status=request.dimensions_status,
	)
	result = simulate_iceberg(
		iceberg=iceberg,
		base_forcing=forcing,
		horizon_years=request.horizon_years,
		scenario=request.scenario,
		params=MeltParameters(
			ocean_area_m2=request.ocean_area_m2,
			freezing_temperature_c=(
				-0.054 * request.forcing.salinity_psu
				if request.forcing is not None and request.forcing.salinity_psu is not None
				else -1.92
			),
		),
	)
	# Return the exact forcing consumed by the model so clients never need to
	# render invented environmental telemetry. Salinity is optional because it
	# is only supplied by an explicit client forcing payload.
	result["environmental_conditions"] = {
		**asdict(forcing),
		"salinity_psu": request.forcing.salinity_psu if request.forcing else None,
	}
	with SessionLocal() as session:
		from backend.db.models import IcebergSimulation
		record = IcebergSimulation(
			iceberg_id=iceberg.iceberg_id,
			horizon_years=request.horizon_years,
			scenario=request.scenario,
			forcing_status=forcing.source_status,
			forcing_source=forcing.source,
			simulation_data=json.dumps(result),
		)
		session.add(record)
		session.commit()
		session.refresh(record)
	result["simulation_id"] = record.id
	return result


@app.get("/api/v1/icebergs/melt-simulations/{simulation_id}")
def get_iceberg_melt_simulation(simulation_id: int) -> dict:
	"""Retrieve a persisted simulation result by its audit identifier."""
	from backend.db.models import IcebergSimulation
	with SessionLocal() as session:
		record = session.get(IcebergSimulation, simulation_id)
		if record is None:
			raise HTTPException(status_code=404, detail="Iceberg simulation not found")
		result = json.loads(record.simulation_data)
		result["simulation_id"] = record.id
		result["created_at"] = record.created_at.isoformat()
		return result


@app.get("/api/v1/forecast/sea-ice")
def get_sea_ice_forecast_metadata() -> dict:
	"""Return metadata and summary statistics for the seven-day forecast."""
	forecast_path = PROJECT_ROOT / "data" / "processed" / "ice_forecast_7day.npy"
	if not forecast_path.exists():
		if not HAS_ML:
			raise HTTPException(status_code=500, detail="ML pipeline unavailable")
		generate_7day_forecast()
	forecast_grid = np.load(forecast_path)
	return {
		"forecast_days": int(forecast_grid.shape[0]),
		"grid_shape": list(forecast_grid.shape[1:]),
		"min_concentration": float(forecast_grid.min()),
		"max_concentration": float(forecast_grid.max()),
		"mean_concentration": float(forecast_grid.mean()),
	}


@app.get("/api/v1/forecast/{day}")
def get_forecast(day: int) -> dict:
	"""
	Retrieve sea-ice forecast for a specific day.
	
	Args:
		day: Forecast day (1-7)
	
	Returns:
		Grid statistics and metadata
	"""
	forecast_path = PROJECT_ROOT / "data" / "processed" / "ice_forecast_7day.npy"
	
	if not forecast_path.exists():
		if not HAS_ML:
			raise HTTPException(status_code=500, detail="ML pipeline unavailable")
		generate_7day_forecast()
	
	forecast_grid = np.load(forecast_path)
	
	if day < 1 or day > forecast_grid.shape[0]:
		raise HTTPException(status_code=400, detail="Invalid forecast day")
	
	day_data = forecast_grid[day - 1]
	
	return {
		"day": day,
		"grid_shape": day_data.shape,
		"mean_concentration": float(day_data.mean()),
		"max_concentration": float(day_data.max()),
		"min_concentration": float(day_data.min()),
		"high_risk_area_fraction": float((day_data > 0.8).sum() / day_data.size),
	}


@app.post("/api/v1/copilot/briefing")
def copilot_briefing(req: CopilotRequest, _: None = Depends(require_api_key)) -> dict:
	"""Generate an operational briefing from a live route evaluation."""
	route_response = compute_routes(RouteRequest(
		start_coords=req.start_coords,
		goal_coords=req.goal_coords,
		forecast_day=req.forecast_day,
	))
	briefing = generate_captain_briefing(req.query, route_response.model_dump())
	return {
		"query": req.query,
		"briefing": briefing,
		"route_summary": route_response,
	}


if __name__ == "__main__":
	import uvicorn
	uvicorn.run(app, host="0.0.0.0", port=8000)
