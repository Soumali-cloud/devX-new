"""Train real-data iceberg drift regressors from the supplied labeled trajectories."""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

import numpy as np
import xgboost as xgb

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from data_pipeline.prepare_real_data import TRAINING_COLUMNS, prepare_real_data


FEATURE_COLUMNS = (
    "latitude", "longitude", "previous_latitude", "previous_longitude", "delta_latitude",
    "delta_longitude_wrapped", "time_difference", "speed", "lat_velocity", "lon_velocity",
    "movement_distance_deg", "movement_rate_deg_per_day", "year", "month", "day_of_year",
)


def _load_training_rows(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    features: list[list[float]] = []
    targets: list[list[float]] = []
    dates: list[str] = []
    with path.open(encoding="utf-8-sig", newline="") as input_file:
        reader = csv.DictReader(input_file)
        if tuple(reader.fieldnames or ()) != TRAINING_COLUMNS:
            raise ValueError("Unexpected real training schema")
        for row in reader:
            try:
                features.append([float(row[name]) for name in FEATURE_COLUMNS])
                targets.append([float(row["target_latitude"]), float(row["target_longitude"])])
                dates.append(row["date"])
            except (TypeError, ValueError):
                continue
    if not features:
        raise ValueError(f"No numeric labeled rows found in {path}")
    return np.asarray(features, dtype=np.float32), np.asarray(targets, dtype=np.float32), np.asarray(dates)


def train_iceberg() -> Path:
    """Fit both target coordinates using every valid labeled real-data row."""
    prepare_real_data()
    training_path = PROJECT_ROOT / "data" / "raw" / "icebergs" / "PolarNavX_XGBoost_Training.csv"
    features, targets, dates = _load_training_rows(training_path)
    split = max(1, int(len(features) * 0.8))
    train_x, validation_x = features[:split], features[split:]
    train_y, validation_y = targets[:split], targets[split:]
    if not len(validation_x):
        raise ValueError("Real training data needs validation rows")

    models = []
    for index, target_name in enumerate(("latitude", "longitude")):
        model = xgb.XGBRegressor(
            n_estimators=250,
            max_depth=8,
            learning_rate=0.05,
            subsample=0.85,
            colsample_bytree=0.85,
            objective="reg:squarederror",
            tree_method="hist",
            n_jobs=-1,
            random_state=42,
        )
        model.fit(train_x, train_y[:, index], eval_set=[(validation_x, validation_y[:, index])], verbose=False)
        models.append(model)

    checkpoint_dir = PROJECT_ROOT / "ml_engine" / "training" / "checkpoints" / "iceberg_drift"
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    for model, target_name in zip(models, ("latitude", "longitude")):
        model.save_model(checkpoint_dir / f"{target_name}.json")
    predictions = np.column_stack([model.predict(validation_x) for model in models])
    metrics = {
        "rows_used": int(len(features)),
        "date_range": [str(dates[0]), str(dates[-1])],
        "validation_mae_degrees": np.abs(predictions - validation_y).mean(axis=0).tolist(),
        "features": list(FEATURE_COLUMNS),
        "source": "data/raw/icebergs/PolarNavX_XGBoost_Training.csv",
    }
    (checkpoint_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))
    return checkpoint_dir


if __name__ == "__main__":
    train_iceberg()
