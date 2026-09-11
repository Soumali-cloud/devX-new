"""Rule-based captain briefing agent; routing remains deterministic."""

from typing import Any


def generate_captain_briefing(user_query: str, route_data: dict[str, Any]) -> str:
	"""Translate route metrics into a concise operational briefing."""
	if not user_query or not user_query.strip():
		return "ERROR: Query cannot be empty. Please ask a specific navigation question."
	day = route_data.get("forecast_day_selected", route_data.get("forecast_day", 1))
	routes = route_data.get("routes", [])
	if isinstance(routes, list):
		route_by_name = {route.get("name", "").lower().replace("-", "_"): route for route in routes}
	else:
		route_by_name = routes
	safest_path = route_by_name.get("safest", {}).get("path", [])
	fuel_path = route_by_name.get("fuel_optimal", {}).get("path", [])
	safest = route_by_name.get("safest", {})
	fuel = route_by_name.get("fuel_optimal", {})
	safest_risk = safest.get("metrics", {}).get("avg_ice_risk", safest.get("ice_risk_score", 0.0))
	fuel_risk = fuel.get("metrics", {}).get("avg_ice_risk", fuel.get("ice_risk_score", 0.0))
	safest_fuel = safest.get("metrics", {}).get("estimated_fuel_tons", safest.get("estimated_fuel_tons", 0.0))
	fuel_fuel = fuel.get("metrics", {}).get("estimated_fuel_tons", fuel.get("estimated_fuel_tons", 0.0))
	recommendation = (
		f"Follow 'Safest Route'; it reduces average ice risk by {(fuel_risk - safest_risk) * 100:.1f}%."
		if safest_risk < fuel_risk else
		f"Follow 'Fuel-Optimal Route'; it saves approximately {max(0.0, safest_fuel - fuel_fuel):.1f} tons of fuel."
	)
	return (
		f"CAPTAIN'S OPERATIONAL BRIEFING (Day {day} Forecast Evaluation)\n"
		"----------------------------------------------------------\n"
		f"Query: '{user_query}'\n\n"
		"1. Route Recommendation:\n"
		f"   - Safest Route: {len(safest_path)} waypoints, Avg Ice Risk = {safest_risk:.2%}, Fuel = {safest_fuel:.2f} tons.\n"
		f"   - Fuel-Optimal Route: {len(fuel_path)} waypoints, Avg Ice Risk = {fuel_risk:.2%}, Fuel = {fuel_fuel:.2f} tons.\n\n"
		"2. Core Recommendation:\n"
		f"   - {recommendation}"
	)
