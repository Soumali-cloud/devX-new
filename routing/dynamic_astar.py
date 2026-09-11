"""Deterministic grid-based A* pathfinding with ice-risk penalties."""

import heapq
from typing import List, Tuple

import numpy as np


def heuristic(a: Tuple[int, int], b: Tuple[int, int]) -> float:
	"""Return the Euclidean lower-bound distance between two cells."""
	return float(np.hypot(b[0] - a[0], b[1] - a[1]))


def dynamic_astar(
	grid: np.ndarray,
	start: Tuple[int, int],
	goal: Tuple[int, int],
	 iceberg_positions: List[Tuple[int, int]] = None,
	w_distance: float = 1.0,
	w_ice: float = 5.0,
	w_iceberg: float = 10.0,
	iceberg_buffer_radius: float = 5.0,
	max_ice_threshold: float = 0.95,
	steps_per_day: int = 10,
	search_margin: int = 25,
) -> list[Tuple[int, int]]:
	"""Find a deterministic, time-dependent path through forecast ice fields."""
	grid = np.asarray(grid, dtype=float)
	if grid.ndim not in (2, 3):
		raise ValueError("grid must be two- or three-dimensional")
	forecast = grid[None, ...] if grid.ndim == 2 else grid
	if forecast.shape[0] < 1:
		raise ValueError("grid must contain at least one forecast day")
	height, width = forecast.shape[1:]
	iceberg_positions = iceberg_positions or []
	if iceberg_buffer_radius <= 0 or steps_per_day < 1:
		raise ValueError("iceberg_buffer_radius and steps_per_day must be positive")
	if search_margin < 0:
		raise ValueError("search_margin must be non-negative")
	if not all(0 <= point[0] < height and 0 <= point[1] < width for point in (start, goal)):
		return []
	if not np.isfinite(forecast[0, start[0], start[1]]):
		return []
	if forecast[0, start[0], start[1]] >= max_ice_threshold:
		return []

	max_steps = int(heuristic(start, goal) * 2.0) + steps_per_day * forecast.shape[0]
	row_min = max(0, min(start[0], goal[0]) - search_margin)
	row_max = min(height - 1, max(start[0], goal[0]) + search_margin)
	column_min = max(0, min(start[1], goal[1]) - search_margin)
	column_max = min(width - 1, max(start[1], goal[1]) + search_margin)
	neighbors = (
		(-1, 0), (1, 0), (0, -1), (0, 1),
		(-1, -1), (-1, 1), (1, -1), (1, 1),
	)
	max_day = forecast.shape[0] - 1
	open_set: list[tuple[float, Tuple[int, int]]] = [(heuristic(start, goal), start)]
	came_from: dict[Tuple[int, int], Tuple[int, int]] = {}
	g_score = {start: 0.0}
	step_count = {start: 0}
	closed: set[Tuple[int, int]] = set()

	while open_set:
		queued_score, current = heapq.heappop(open_set)
		if queued_score > g_score.get(current, float("inf")) + heuristic(current, goal):
			continue
		if current in closed:
			continue
		closed.add(current)
		step = step_count[current]
		if current == goal:
			path = [current]
			while current in came_from:
				current = came_from[current]
				path.append(current)
			return path[::-1]

		for delta_row, delta_col in neighbors:
			neighbor = (current[0] + delta_row, current[1] + delta_col)
			if not (row_min <= neighbor[0] <= row_max and column_min <= neighbor[1] <= column_max):
				continue
			next_step = step + 1
			if next_step > max_steps:
				continue
			day_index = min(next_step // steps_per_day, max_day)
			ice_value = forecast[day_index, neighbor[0], neighbor[1]]
			if not np.isfinite(ice_value) or ice_value >= max_ice_threshold:
				continue
			step_distance = float(np.hypot(delta_row, delta_col))
			iceberg_penalty = 0.0
			for iceberg_row, iceberg_col in iceberg_positions:
				distance = float(np.hypot(neighbor[0] - iceberg_row, neighbor[1] - iceberg_col))
				if distance <= iceberg_buffer_radius:
					iceberg_penalty += w_iceberg * np.exp(-distance / iceberg_buffer_radius)
			step_cost = step_distance * w_distance + float(ice_value ** 2) * w_ice + iceberg_penalty
			tentative_g = g_score[current] + step_cost
			if tentative_g < g_score.get(neighbor, float("inf")):
				came_from[neighbor] = current
				g_score[neighbor] = tentative_g
				step_count[neighbor] = next_step
				heapq.heappush(open_set, (tentative_g + heuristic(neighbor, goal), neighbor))

	return []
