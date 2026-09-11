"""Prepare the supplied Antarctic datasets without generating synthetic values."""

from __future__ import annotations

import csv
import gzip
import json
import shutil
import zipfile
from pathlib import Path

import numpy as np


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = PROJECT_ROOT / "test_data"
RAW_DIR = PROJECT_ROOT / "data" / "raw" / "icebergs"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
TRAINING_COLUMNS = (
    "iceberg_id",
    "date",
    "latitude",
    "longitude",
    "previous_latitude",
    "previous_longitude",
    "delta_latitude",
    "delta_longitude_wrapped",
    "time_difference",
    "speed",
    "lat_velocity",
    "lon_velocity",
    "movement_distance_deg",
    "movement_rate_deg_per_day",
    "year",
    "month",
    "day_of_year",
    "sensor",
    "target_latitude",
    "target_longitude",
    "target_date",
    "target_time_difference",
)


def _copy_xgboost_training() -> Path:
    source = SOURCE_DIR / "PolarNavX_XGBoost_Training.zip"
    if not source.exists():
        raise FileNotFoundError(source)
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(source) as archive:
        matches = [name for name in archive.namelist() if name.endswith("PolarNavX_XGBoost_Training.csv")]
        if len(matches) != 1:
            raise ValueError(f"Expected one XGBoost training CSV in {source}, found {matches}")
        output = RAW_DIR / "PolarNavX_XGBoost_Training.csv"
        with archive.open(matches[0]) as input_file, output.open("wb") as output_file:
            shutil.copyfileobj(input_file, output_file)
    return output


def _validate_and_copy_trajectories() -> int:
    source = SOURCE_DIR / "Iceberg Trajectory Standardized.csv.gz"
    if not source.exists():
        raise FileNotFoundError(source)
    required = {"iceberg_id", "date", "latitude", "longitude"}
    rows = 0
    with gzip.open(source, "rt", encoding="utf-8-sig", newline="") as input_file:
        reader = csv.DictReader(input_file)
        if not required.issubset(reader.fieldnames or ()):
            raise ValueError(f"{source} is missing required columns: {required - set(reader.fieldnames or ())}")
        for row in reader:
            try:
                float(row["latitude"])
                float(row["longitude"])
            except (TypeError, ValueError):
                continue
            rows += 1
    shutil.copyfile(source, RAW_DIR / source.name)
    return rows


def _extract_historical_trajectories() -> int:
    source = SOURCE_DIR / "Antarctica Historical Icebergs Trajectory.zip"
    if not source.exists():
        raise FileNotFoundError(source)
    destination = RAW_DIR / "historical"
    destination.mkdir(parents=True, exist_ok=True)
    csv_rows = 0
    with zipfile.ZipFile(source) as archive:
        for member in archive.infolist():
            if member.is_dir() or not member.filename.lower().endswith(".csv"):
                continue
            output = destination / Path(member.filename).name
            with archive.open(member) as input_file, output.open("wb") as output_file:
                shutil.copyfileobj(input_file, output_file)
            with output.open(encoding="utf-8-sig", newline="") as input_file:
                csv_rows += max(0, sum(1 for _ in csv.DictReader(input_file)))
    if csv_rows == 0:
        raise ValueError(f"No CSV trajectory rows found in {source}")
    return csv_rows


def _prepare_extent_series() -> int:
    source = SOURCE_DIR / "Total Antarctic sea-ice extent between 1978 →2026..csv"
    if not source.exists():
        raise FileNotFoundError(source)
    records: list[tuple[str, float]] = []
    with source.open(encoding="utf-8-sig", newline="") as input_file:
        for row in csv.reader(input_file):
            if not row or row[0].strip().lower() == "year" or not row[0].strip().isdigit():
                continue
            try:
                records.append((f"{int(row[0]):04d}-{int(row[1]):02d}-{int(row[2]):02d}", float(row[3])))
            except (IndexError, ValueError):
                continue
    if not records:
        raise ValueError(f"No valid sea-ice extent records found in {source}")
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    np.save(PROCESSED_DIR / "sea_ice_extent_real.npy", np.asarray([value for _, value in records], dtype=np.float32))
    (PROCESSED_DIR / "sea_ice_extent_real.json").write_text(
        json.dumps({"source": str(source.relative_to(PROJECT_ROOT)), "dates": [date for date, _ in records]}, indent=2),
        encoding="utf-8",
    )
    return len(records)


def prepare_real_data() -> dict[str, int]:
    """Extract and validate all real training inputs used by the project."""
    training_csv = _copy_xgboost_training()
    with training_csv.open(encoding="utf-8-sig", newline="") as input_file:
        reader = csv.DictReader(input_file)
        if tuple(reader.fieldnames or ()) != TRAINING_COLUMNS:
            raise ValueError("Unexpected XGBoost training schema")
        training_rows = sum(1 for _ in reader)
    trajectory_rows = _validate_and_copy_trajectories()
    historical_rows = _extract_historical_trajectories()
    extent_rows = _prepare_extent_series()
    snapshot = SOURCE_DIR / "AntarcticIcebergs_20260827.csv"
    if not snapshot.exists():
        raise FileNotFoundError(snapshot)
    shutil.copyfile(snapshot, RAW_DIR / snapshot.name)
    manifest = {
        "training_rows": training_rows,
        "trajectory_rows": trajectory_rows,
        "historical_trajectory_rows": historical_rows,
        "extent_rows": extent_rows,
    }
    (PROCESSED_DIR / "real_data_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))
    return manifest


if __name__ == "__main__":
    prepare_real_data()