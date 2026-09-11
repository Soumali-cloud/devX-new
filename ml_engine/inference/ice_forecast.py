"""Generate a seven-day sea-ice forecast using trained ConvLSTM model."""

import sys
from pathlib import Path

import numpy as np
import torch

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from ml_engine.models.convlstm_ice import SeaIceConvLSTM


def generate_7day_forecast(
	tensor_path: str | Path = "data/processed/sea_ice_tensors_v2.npy",
	model_path: str | Path = "ml_engine/training/checkpoints/convlstm_ice_v2.pt",
	forecast_days: int = 7,
) -> np.ndarray:
	"""
	Loads trained ConvLSTM weights and autoregressively generates 
	a 7-day spatial sea-ice forecast array.
	
	Args:
		tensor_path: Path to preprocessed tensor (T, H, W)
		model_path: Path to trained model checkpoint
		forecast_days: Number of days to forecast (default: 7)
	
	Returns:
		Forecast array (forecast_days, H, W) with values in [0.0, 1.0]
	"""
	device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
	print(f"Using device: {device}")
	
	# Resolve paths relative to project root
	tensor_path = PROJECT_ROOT / tensor_path
	model_path = PROJECT_ROOT / model_path
	
	# Load processed tensor (shape: T, H, W)
	if not tensor_path.exists():
		raise FileNotFoundError(f"Missing {tensor_path}")
	
	data = np.load(tensor_path)
	print(f"Loaded tensor: {data.shape}")
	
	# Take the most recent 3 frames to seed the model
	recent_sequence = data[-3:]  # Shape: (3, H, W)
	
	# Format input tensor: (Batch=1, Seq_Len=3, Channels=1, H, W)
	input_tensor = (
		torch.from_numpy(recent_sequence)
		.unsqueeze(0)  # Add batch dim: (1, 3, H, W)
		.unsqueeze(2)  # Add channel dim: (1, 3, 1, H, W)
		.float()
		.to(device)
	)
	
	# Load Model Checkpoint
	model = SeaIceConvLSTM(input_dim=1, hidden_dim=16, num_layers=2)
	model = model.to(device)
	
	checkpoint = torch.load(model_path, map_location=device)
	if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
		model.load_state_dict(checkpoint['model_state_dict'])
	else:
		model.load_state_dict(checkpoint)
	
	model.eval()
	print(f"Loaded checkpoint from {model_path}")
	
	forecasts = []
	current_input = input_tensor
	
	print(f"Generating {forecast_days}-day autoregressive ice forecast...")
	with torch.no_grad():
		for day in range(forecast_days):
			# Predict next day frame: (1, 1, H, W)
			pred_frame = model(current_input)
			forecasts.append(pred_frame.squeeze().cpu().numpy())
			
			# Slide context window forward (Drop oldest, append prediction)
			pred_unsqueezed = pred_frame.unsqueeze(1)  # (1, 1, 1, H, W)
			current_input = torch.cat([current_input[:, 1:], pred_unsqueezed], dim=1)
			
			print(f"  Day {day + 1}/{forecast_days} | Mean ice: {forecasts[-1].mean():.4f}")
	
	# Stack into shape: (7, H, W)
	forecast_array = np.stack(forecasts, axis=0)
	forecast_array = np.clip(forecast_array, 0.0, 1.0)
	
	out_path = PROJECT_ROOT / "data" / "processed" / "ice_forecast_7day.npy"
	out_path.parent.mkdir(parents=True, exist_ok=True)
	np.save(out_path, forecast_array)
	
	print(f"✅ 7-Day Forecast saved to {out_path}")
	print(f"   Shape: {forecast_array.shape}")
	print(f"   Value range: [{forecast_array.min():.4f}, {forecast_array.max():.4f}]")
	
	return forecast_array


if __name__ == "__main__":
	generate_7day_forecast()
