"""Train and checkpoint the sea-ice ConvLSTM model on Antarctic data."""

import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from ml_engine.models.convlstm_ice import SeaIceConvLSTM


class SeaIceDataset(Dataset):
	"""PyTorch Dataset wrapper for preprocessed sea-ice tensor."""
	
	def __init__(self, tensor_path: Path, sequence_length: int = 3):
		"""
		Load sea-ice concentration tensor and prepare sequences.
		
		Args:
			tensor_path: Path to sea_ice_tensors.npy (shape: [T, H, W])
			sequence_length: Number of timesteps per training sequence
		"""
		self.data = np.load(tensor_path).astype(np.float32)  # (T, H, W)
		self.sequence_length = sequence_length
		
		if len(self.data) < 30:
			raise ValueError(f"Expanded training requires at least 30 frames, received {len(self.data)}")

		if len(self.data) < sequence_length + 1:
			raise ValueError(
				f"Tensor has {len(self.data)} frames, "
				f"need at least {sequence_length + 1} for sequences"
			)
	
	def __len__(self) -> int:
		return len(self.data) - self.sequence_length
	
	def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
		# Input: sequence_length frames; Target: next frame
		x = self.data[idx : idx + self.sequence_length]  # (seq_len, H, W)
		y = self.data[idx + self.sequence_length]  # (H, W)
		
		# Convert to tensors; add channel dimension: (seq_len, 1, H, W)
		x = torch.from_numpy(x).unsqueeze(1)
		y = torch.from_numpy(y).unsqueeze(0)  # (1, H, W)
		
		return x, y





def train():
	"""Train ConvLSTM on Antarctic sea-ice data."""
	device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
	print(f"Using device: {device}")
	
	# Paths
	tensor_path = PROJECT_ROOT / "data" / "processed" / "sea_ice_tensors_v2.npy"
	checkpoint_dir = PROJECT_ROOT / "ml_engine" / "training" / "checkpoints"
	checkpoint_dir.mkdir(parents=True, exist_ok=True)
	
	if not tensor_path.exists():
		raise FileNotFoundError(f"Tensor not found: {tensor_path}")
	
	# Dataset and DataLoader
	dataset = SeaIceDataset(tensor_path, sequence_length=3)
	dataloader = DataLoader(dataset, batch_size=1, shuffle=False)
	
	print(f"Loaded dataset with {len(dataset)} sequences")
	print(f"Grid shape: {dataset.data.shape[1:]}")
	
	# Model
	model = SeaIceConvLSTM(input_dim=1, hidden_dim=16, num_layers=2)
	model = model.to(device)
	
	# Optimizer and loss
	optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
	criterion = nn.MSELoss()
	
	# Training loop
	num_epochs = 18
	print(f"\nTraining for {num_epochs} epochs...")
	
	for epoch in range(num_epochs):
		model.train()
		total_loss = 0.0
		
		for batch_idx, (x, y) in enumerate(dataloader):
			x = x.to(device)  # (B, seq_len, 1, H, W)
			y = y.to(device)  # (B, 1, H, W)
			
			# Forward pass
			y_pred = model(x)
			loss = criterion(y_pred, y)
			
			# Backward pass
			optimizer.zero_grad()
			loss.backward()
			optimizer.step()
			
			total_loss += loss.item()
		
		avg_loss = total_loss / len(dataloader)
		mae = 0.0
		with torch.no_grad():
			for x, y in dataloader:
				mae += torch.abs(model(x.to(device)) - y.to(device)).mean().item()
		mae /= len(dataloader)
		print(f"Epoch {epoch + 1}/{num_epochs} | Loss: {avg_loss:.6f} | MAE: {mae:.6f}")
	
	# Save checkpoint
	checkpoint_path = checkpoint_dir / "convlstm_ice_v2.pt"
	torch.save({
		'model_state_dict': model.state_dict(),
		'model_architecture': {
			'input_dim': 1,
			'hidden_dim': 16,
			'num_layers': 2,
		},
		'epoch': num_epochs,
	}, checkpoint_path)
    #for the trainig purpose 
	
	print(f"\n✅ Training complete. Checkpoint saved to {checkpoint_path}")
	print(f"   Model parameters: {sum(p.numel() for p in model.parameters()):,}")


if __name__ == "__main__":
	train()
