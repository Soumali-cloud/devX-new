"""Generate deterministic multi-objective route options."""

from typing import Any, List, Tuple

import numpy as np

from routing.dynamic_astar import dynamic_astar


def calculate_hydrodynamic_fuel(
	path: List[Tuple[int, int]],
	grid: np.ndarray,
	vessel_ice_class: str = "PC5",
	cell_resolution_km: float = 10.0,
) -> dict[str, float]:
	"""Estimate open-water and Lindqvist-style ice resistance fuel burn."""
	if not path:
		return {
			"distance_km": 0.0,
			"avg_ice_risk": 1.0,
			"estimated_fuel_tons": 0.0,
			"minimum_speed_knots": 0.0,
			"peak_power_kw": 0.0,
		}

	beam = 20.0
	draft = 8.0
	displacement = 12000.0
	base_fuel_rate = 0.035
	water_density = 1025.0
	frontal_area = beam * draft
	base_speed_knots = 12.0
	class_multipliers = {"PC1": 1.1, "PC3": 1.3, "PC5": 1.6, "PC7": 2.0, "Standard": 3.5}
	k_ice = class_multipliers.get(vessel_ice_class, 1.6)
	total_distance = (len(path) - 1) * cell_resolution_km
	total_fuel = 0.0
	peak_power_kw = 0.0
	minimum_speed_knots = base_speed_knots
	ice_values: list[float] = []

	for row, column in path:
		ice_concentration = float(np.clip(grid[row, column], 0.0, 1.0))
		ice_values.append(ice_concentration)
		open_water_fuel = base_fuel_rate * cell_resolution_km
		ice_thickness = ice_concentration * 2.0
		speed_knots = base_speed_knots * (1.0 - 0.45 * max(0.0, ice_concentration - 0.5) / 0.5)
		speed_knots = max(6.0, speed_knots)
		minimum_speed_knots = min(minimum_speed_knots, speed_knots)
		crushing_resistance = 0.5 * beam * ice_thickness**1.5 * ice_concentration
		bending_resistance = 0.003 * displacement * ice_thickness * ice_concentration**2
		ice_drag_penalty = (crushing_resistance + bending_resistance) * k_ice * 0.001
		speed_mps = speed_knots * 0.514444
		power_kw = (0.5 * water_density * speed_mps**3 * frontal_area * 0.02 + crushing_resistance * speed_mps) / 1000.0
		peak_power_kw = max(peak_power_kw, power_kw)
		total_fuel += open_water_fuel * (1.0 + ice_drag_penalty)

	return {
		"distance_km": round(total_distance, 2),
		"avg_ice_risk": round(sum(ice_values) / len(ice_values), 4),
		"estimated_fuel_tons": round(total_fuel, 2),
		"minimum_speed_knots": round(minimum_speed_knots, 2),
		"peak_power_kw": round(peak_power_kw, 2),
	}


def generate_route_options(
	forecast_tensor: np.ndarray,
	start: Tuple[int, int],
	goal: Tuple[int, int],
	iceberg_positions: List[Tuple[int, int]] = None,
	vessel_ice_class: str = "PC5",
) -> dict[str, Any]:
	"""Generate route options using the forecast state at each path step."""
	forecast_tensor = np.asarray(forecast_tensor, dtype=float)
	if forecast_tensor.ndim != 3:
		raise ValueError("forecast_tensor must have shape (days, height, width)")
	grid = forecast_tensor[0]
	paths = {
		"safest": dynamic_astar(forecast_tensor, start, goal, iceberg_positions, w_distance=1.0, w_ice=25.0, w_iceberg=20.0, iceberg_buffer_radius=8.0, max_ice_threshold=0.75),
		"fuel_optimal": dynamic_astar(forecast_tensor, start, goal, iceberg_positions, w_distance=2.0, w_ice=5.0, w_iceberg=8.0, iceberg_buffer_radius=4.0, max_ice_threshold=0.88),
		"shortest": dynamic_astar(forecast_tensor, start, goal, iceberg_positions, w_distance=5.0, w_ice=0.5, w_iceberg=2.0, iceberg_buffer_radius=2.0, max_ice_threshold=0.98),
	}

	return {
		name: {"path": path, "metrics": calculate_hydrodynamic_fuel(path, grid, vessel_ice_class)}
		for name, path in paths.items()
	}
