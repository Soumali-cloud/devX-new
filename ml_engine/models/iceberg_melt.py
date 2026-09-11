"""Physics-based iceberg trajectory and melt model.

This module adapts the melt-process architecture of OceanParcels'
MeltingIcebergs project for the application's modern Antarctic workflow.  It
does not use the repository's Eocene forcing.  See docs/SCIENTIFIC_SOURCES.md
for attribution and model limitations.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date, timedelta
import math
from typing import Literal


SECONDS_PER_DAY = 86_400.0
KM_PER_DEGREE_LATITUDE = 111.32


@dataclass(frozen=True)
class IcebergProperties:
    iceberg_id: str
    latitude: float
    longitude: float
    length_m: float
    width_m: float
    thickness_m: float
    shape_factor: float = 0.78
    ice_density_kg_m3: float = 917.0
    dimensions_status: Literal["observed", "estimated"] = "estimated"

    def __post_init__(self) -> None:
        if not self.iceberg_id.strip():
            raise ValueError("iceberg_id is required")
        if not -90 <= self.latitude <= 90 or not -180 <= self.longitude <= 180:
            raise ValueError("latitude/longitude are outside valid ranges")
        if min(self.length_m, self.width_m, self.thickness_m) <= 0:
            raise ValueError("iceberg dimensions must be positive")
        if not 0 < self.shape_factor <= 1:
            raise ValueError("shape_factor must be in (0, 1]")
        if not 800 <= self.ice_density_kg_m3 <= 950:
            raise ValueError("ice_density_kg_m3 must be between 800 and 950")

    @property
    def volume_m3(self) -> float:
        return self.length_m * self.width_m * self.thickness_m * self.shape_factor

    @property
    def mass_kg(self) -> float:
        return self.volume_m3 * self.ice_density_kg_m3


@dataclass(frozen=True)
class EnvironmentalForcing:
    """Environmental state at an iceberg's position for one integration step."""

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
    sea_ice_fraction: float
    source_status: Literal["observed", "modelled", "scenario-based"]
    source: str

    def __post_init__(self) -> None:
        if not 0 <= self.sea_ice_fraction <= 1:
            raise ValueError("sea_ice_fraction must be in [0, 1]")


@dataclass(frozen=True)
class MeltParameters:
    freezing_temperature_c: float = -1.92
    seawater_density_kg_m3: float = 1027.5
    freshwater_density_kg_m3: float = 1000.0
    ocean_area_m2: float = 3.61e14
    basal_multiplier: float = 1.0
    convection_multiplier: float = 1.0
    wave_multiplier: float = 1.0


def _norm(u: float, v: float) -> float:
    return math.hypot(u, v)


def melt_rates_m_per_day(
    iceberg: IcebergProperties,
    forcing: EnvironmentalForcing,
    params: MeltParameters = MeltParameters(),
) -> dict[str, float]:
    """Return basal, convection and wave-erosion rates in metres per day.

    The parameterisations follow the architecture used by MeltingIcebergs:
    buoyant convection, a relative-velocity basal term, and sea-ice-damped
    wave erosion. Temperatures are converted to non-negative thermal forcing
    relative to the configurable local freezing temperature.
    """
    integrated_excess = max(0.0, forcing.depth_integrated_temp_c - params.freezing_temperature_c)
    basal_excess = max(0.0, forcing.ocean_basal_temp_c - params.freezing_temperature_c)
    surface_excess = max(0.0, forcing.ocean_surface_temp_c + 2.0)
    convection = (7.62e-3 * integrated_excess + 1.29e-3 * integrated_excess**2)
    relative_basal_speed = _norm(
        forcing.ocean_integrated_u_m_s - forcing.ocean_basal_u_m_s,
        forcing.ocean_integrated_v_m_s - forcing.ocean_basal_v_m_s,
    )
    basal = 0.58 * relative_basal_speed**0.8 * basal_excess / max(iceberg.length_m, 1.0) ** 0.2
    air_ocean_speed = _norm(
        forcing.wind_u_m_s - forcing.ocean_surface_u_m_s,
        forcing.wind_v_m_s - forcing.ocean_surface_v_m_s,
    )
    sea_state = 1.5 * math.sqrt(air_ocean_speed) + 0.1 * air_ocean_speed
    ice_damping = 0.5 * (1.0 + math.cos(math.pi * forcing.sea_ice_fraction**3))
    wave = (1.0 / 6.0) * sea_state * ice_damping * surface_excess
    return {
        "basal_m_per_day": max(0.0, basal * params.basal_multiplier),
        "buoyant_convection_m_per_day": max(0.0, convection * params.convection_multiplier),
        "wave_erosion_m_per_day": max(0.0, wave * params.wave_multiplier),
    }


def step_iceberg(
    iceberg: IcebergProperties,
    forcing: EnvironmentalForcing,
    days: float,
    params: MeltParameters = MeltParameters(),
) -> tuple[IcebergProperties | None, dict[str, float]]:
    """Advance dimensions one step using process-specific working areas."""
    if days <= 0:
        raise ValueError("days must be positive")
    rates = melt_rates_m_per_day(iceberg, forcing, params)
    draft_m = iceberg.thickness_m * iceberg.ice_density_kg_m3 / params.seawater_density_kg_m3
    basal_area = iceberg.length_m * iceberg.width_m * iceberg.shape_factor
    submerged_side_area = 2.0 * draft_m * (iceberg.length_m + iceberg.width_m)
    exposed_side_area = iceberg.thickness_m * (iceberg.length_m + iceberg.width_m)
    volume_loss = days * (
        rates["basal_m_per_day"] * basal_area
        + rates["buoyant_convection_m_per_day"] * submerged_side_area
        + rates["wave_erosion_m_per_day"] * exposed_side_area
    )
    old_volume = iceberg.volume_m3
    new_volume = max(0.0, old_volume - volume_loss)
    actual_volume_loss = old_volume - new_volume
    mass_loss = actual_volume_loss * iceberg.ice_density_kg_m3
    freshwater_m3 = mass_loss / params.freshwater_density_kg_m3
    displaced_seawater_m3 = mass_loss / params.seawater_density_kg_m3
    net_sea_level_equivalent_m = (freshwater_m3 - displaced_seawater_m3) / params.ocean_area_m2
    diagnostics = {
        **rates,
        "melted_ice_volume_m3": actual_volume_loss,
        "melted_ice_mass_kg": mass_loss,
        "meltwater_m3": freshwater_m3,
        "displaced_seawater_change_m3": displaced_seawater_m3,
        "net_sea_level_equivalent_m": net_sea_level_equivalent_m,
    }
    if new_volume <= 1.0:
        return None, diagnostics

    new_thickness = max(0.1, iceberg.thickness_m - rates["basal_m_per_day"] * days)
    horizontal_area = new_volume / (new_thickness * iceberg.shape_factor)
    aspect_ratio = iceberg.length_m / iceberg.width_m
    new_width = math.sqrt(horizontal_area / aspect_ratio)
    new_length = aspect_ratio * new_width
    return IcebergProperties(
        iceberg_id=iceberg.iceberg_id,
        latitude=iceberg.latitude,
        longitude=iceberg.longitude,
        length_m=new_length,
        width_m=new_width,
        thickness_m=new_thickness,
        shape_factor=iceberg.shape_factor,
        ice_density_kg_m3=iceberg.ice_density_kg_m3,
        dimensions_status=iceberg.dimensions_status,
    ), diagnostics


def advance_position(
    iceberg: IcebergProperties, forcing: EnvironmentalForcing, days: float
) -> tuple[float, float]:
    """Advect with depth-integrated current plus a small windage component."""
    east_m_s = forcing.ocean_integrated_u_m_s + 0.02 * forcing.wind_u_m_s
    north_m_s = forcing.ocean_integrated_v_m_s + 0.02 * forcing.wind_v_m_s
    latitude = iceberg.latitude + north_m_s * days * SECONDS_PER_DAY / 1000.0 / KM_PER_DEGREE_LATITUDE
    longitude_scale = max(0.01, KM_PER_DEGREE_LATITUDE * math.cos(math.radians(latitude)))
    longitude = iceberg.longitude + east_m_s * days * SECONDS_PER_DAY / 1000.0 / longitude_scale
    return max(-90.0, min(90.0, latitude)), ((longitude + 180.0) % 360.0) - 180.0


def scenario_forcing(
    base: EnvironmentalForcing, day_index: int, scenario: str
) -> EnvironmentalForcing:
    """Create non-constant, transparently scenario-based long-horizon forcing."""
    if scenario not in {"low", "moderate", "high"}:
        raise ValueError("scenario must be low, moderate, or high")
    multipliers = {"low": 0.75, "moderate": 1.0, "high": 1.35}
    thermal_offsets = {"low": -0.15, "moderate": 0.0, "high": 0.35}
    seasonal = math.sin(2.0 * math.pi * (day_index % 365) / 365.0)
    years = day_index / 365.25
    warming = thermal_offsets[scenario] + years * {"low": 0.005, "moderate": 0.015, "high": 0.03}[scenario]
    wind_scale = multipliers[scenario] * (1.0 + 0.15 * seasonal)
    sea_ice = min(1.0, max(0.0, base.sea_ice_fraction + 0.20 * math.cos(2.0 * math.pi * (day_index % 365) / 365.0) - 0.005 * years * multipliers[scenario]))
    return EnvironmentalForcing(
        ocean_surface_temp_c=base.ocean_surface_temp_c + warming + 0.5 * seasonal,
        ocean_basal_temp_c=base.ocean_basal_temp_c + warming + 0.2 * seasonal,
        depth_integrated_temp_c=base.depth_integrated_temp_c + warming + 0.3 * seasonal,
        ocean_surface_u_m_s=base.ocean_surface_u_m_s,
        ocean_surface_v_m_s=base.ocean_surface_v_m_s,
        ocean_basal_u_m_s=base.ocean_basal_u_m_s,
        ocean_basal_v_m_s=base.ocean_basal_v_m_s,
        ocean_integrated_u_m_s=base.ocean_integrated_u_m_s,
        ocean_integrated_v_m_s=base.ocean_integrated_v_m_s,
        wind_u_m_s=base.wind_u_m_s * wind_scale,
        wind_v_m_s=base.wind_v_m_s * wind_scale,
        sea_ice_fraction=sea_ice,
        source_status="scenario-based",
        source=f"scenario:{scenario}; baseline={base.source}",
    )


def simulate_iceberg(
    iceberg: IcebergProperties,
    base_forcing: EnvironmentalForcing,
    horizon_years: int,
    scenario: str = "moderate",
    start_date: date | None = None,
    params: MeltParameters = MeltParameters(),
) -> dict:
    """Run a daily trajectory + melt simulation and emit annual checkpoints."""
    if horizon_years not in {1, 5, 10, 20, 30}:
        raise ValueError("horizon_years must be one of 1, 5, 10, 20, 30")
    current = iceberg
    current_date = start_date or date.today()
    totals = {"melted_ice_volume_m3": 0.0, "melted_ice_mass_kg": 0.0, "meltwater_m3": 0.0, "net_sea_level_equivalent_m": 0.0}
    checkpoints: list[dict] = []
    total_days = round(horizon_years * 365.25)
    for day_index in range(total_days):
        forcing = scenario_forcing(base_forcing, day_index, scenario)
        latitude, longitude = advance_position(current, forcing, 1.0)
        moved = IcebergProperties(**{**asdict(current), "latitude": latitude, "longitude": longitude})
        current, diagnostics = step_iceberg(moved, forcing, 1.0, params)
        for key in totals:
            totals[key] += diagnostics[key]
        is_year_end = (day_index + 1) % 365 == 0 or day_index + 1 == total_days
        if is_year_end or current is None:
            state = current
            checkpoints.append({
                "date": (current_date + timedelta(days=day_index + 1)).isoformat(),
                "year": round((day_index + 1) / 365.25, 2),
                "position": None if state is None else {"latitude": state.latitude, "longitude": state.longitude},
                "volume_m3": 0.0 if state is None else state.volume_m3,
                "mass_kg": 0.0 if state is None else state.mass_kg,
                "melted_ice_volume_m3": totals["melted_ice_volume_m3"],
                "meltwater_m3": totals["meltwater_m3"],
                "net_sea_level_equivalent_m": totals["net_sea_level_equivalent_m"],
                "status": "melted" if state is None else "afloat",
            })
        if current is None:
            break
    return {
        "model_type": "physics-based iceberg melt and trajectory model",
        "source_status": base_forcing.source_status if scenario == "moderate" else "scenario-based",
        "scenario": scenario,
        "initial_state": {**asdict(iceberg), "volume_m3": iceberg.volume_m3, "mass_kg": iceberg.mass_kg},
        "parameters": asdict(params),
        "forcing_source": base_forcing.source,
        "checkpoints": checkpoints,
        "totals": totals,
        "scientific_notice": "Floating freshwater ice already displaces seawater. The net sea-level equivalent is meltwater volume minus displaced seawater volume, divided by the supplied ocean area; it is generally tiny for one iceberg and is not a projection of global land-ice sea-level rise.",
    }
