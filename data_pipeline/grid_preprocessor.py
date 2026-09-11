"""Parse and normalize real NSIDC sea-ice concentration frames."""

from pathlib import Path

import numpy as np

try:
    import rasterio
except ImportError:
    rasterio = None

try:
    import xarray as xr
except ImportError:
    xr = None


NSIDC_GRID_SHAPE = (316, 332)
NSIDC_SCALE = 200.0


def _read_frame(path: Path) -> np.ndarray:
    if path.suffix.lower() in {".nc", ".nc4", ".netcdf"}:
        if xr is None:
            raise ImportError("Install xarray and a NetCDF backend to read NetCDF files")
        with xr.open_dataset(path) as dataset:
            variables = [variable for variable in ("seaice_conc", "cdr_seaice_conc") if variable in dataset]
            if not variables:
                raise ValueError(f"No two-dimensional data variable found in {path}")
            return np.asarray(dataset[variables[0]].squeeze().values, dtype=np.float32)
    if path.suffix.lower() in {".tif", ".tiff"} and rasterio is not None:
        with rasterio.open(path) as source:
            if source.crs is not None and source.crs.to_epsg() != 3031:
                raise ValueError(f"Expected EPSG:3031 projection for {path}, received {source.crs}")
            return source.read(1).astype(np.float32)
    data = np.fromfile(path, dtype=np.uint8)
    if data.size != np.prod(NSIDC_GRID_SHAPE):
        raise ValueError(f"Unsupported frame format or shape for {path}: {data.size} values")
    return data.reshape(NSIDC_GRID_SHAPE).astype(np.float32)


def _normalize_frame(data: np.ndarray, previous: np.ndarray | None) -> np.ndarray:
    if data.shape != NSIDC_GRID_SHAPE:
        raise ValueError(f"Expected grid {NSIDC_GRID_SHAPE}, received {data.shape}")
    land = (data >= 253) & (data <= 254)
    missing = (data == 251) | (data == 252) | (data == 255) | ~np.isfinite(data)
    valid = ~land & ~missing & (data >= 0) & (data <= 200)
    result = np.full(data.shape, np.nan, dtype=np.float32)
    result[valid] = data[valid] / NSIDC_SCALE
    result[land] = 1.0
    if previous is not None:
        result[missing] = previous[missing]
    else:
        result[missing] = float(np.nanmean(result)) if np.any(valid) else 0.0
    return np.clip(np.nan_to_num(result, nan=0.0), 0.0, 1.0)


def process_geotiffs(
    raw_dir: str | Path = "data/raw/nsidc",
    output_path: str | Path = "data/processed/sea_ice_tensors_v2.npy",
    minimum_frames: int = 30,
) -> np.ndarray:
    """Parse at least 30 frames and save a normalized tensor."""
    project_root = Path(__file__).resolve().parents[1]
    raw_path = project_root / raw_dir
    output_file = project_root / output_path
    files = sorted(
        path for pattern in ("*.tif", "*.tiff", "*.nc", "*.nc4", "*.netcdf", "*.bin")
        for path in raw_path.glob(pattern)
    )
    if len(files) < minimum_frames:
        raise FileNotFoundError(f"Found {len(files)} frames in {raw_path}; need at least {minimum_frames}")
    frames: list[np.ndarray] = []
    for path in files[:minimum_frames]:
        frames.append(_normalize_frame(_read_frame(path), frames[-1] if frames else None))
    tensor = np.stack(frames).astype(np.float32)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    np.save(output_file, tensor)
    print(f"Saved {output_file} | Shape: {tensor.shape} | Range: [{tensor.min():.4f}, {tensor.max():.4f}]")
    return tensor


if __name__ == "__main__":
    process_geotiffs()
