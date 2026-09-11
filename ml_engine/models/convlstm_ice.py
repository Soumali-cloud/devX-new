"""ConvLSTM architecture for sea-ice forecasting."""

import torch
import torch.nn as nn


class ConvLSTMCell(nn.Module):
	"""Single ConvLSTM cell layer."""
	
	def __init__(self, input_dim: int, hidden_dim: int, kernel_size: int = 3):
		super().__init__()
		self.input_dim = input_dim
		self.hidden_dim = hidden_dim
		self.kernel_size = kernel_size
		padding = kernel_size // 2
		
		self.conv = nn.Conv2d(
			in_channels=input_dim + hidden_dim,
			out_channels=4 * hidden_dim,  # gates: input, forget, cell, output
			kernel_size=kernel_size,
			padding=padding,
			bias=True,
		)
	
	def forward(
		self, x: torch.Tensor, 
		h: torch.Tensor, c: torch.Tensor
	) -> tuple[torch.Tensor, torch.Tensor]:
		"""
		Args:
			x: Input (B, C, H, W)
			h: Hidden state (B, hidden_dim, H, W)
			c: Cell state (B, hidden_dim, H, W)
		
		Returns:
			h_new, c_new
		"""
		combined = torch.cat([x, h], dim=1)  # Concatenate on channel dimension
		gates = self.conv(combined)
		
		# Split into 4 gates
		i_t, f_t, c_tilde, o_t = torch.chunk(gates, 4, dim=1)
		
		i_t = torch.sigmoid(i_t)
		f_t = torch.sigmoid(f_t)
		c_tilde = torch.tanh(c_tilde)
		o_t = torch.sigmoid(o_t)
		
		c_new = f_t * c + i_t * c_tilde
		h_new = o_t * torch.tanh(c_new)
		
		return h_new, c_new


class SeaIceConvLSTM(nn.Module):
	"""Multi-layer ConvLSTM for sea-ice forecasting."""
	
	def __init__(self, input_dim: int = 1, hidden_dim: int = 16, num_layers: int = 2):
		super().__init__()
		self.input_dim = input_dim
		self.hidden_dim = hidden_dim
		self.num_layers = num_layers
		
		self.conv_lstm_cells = nn.ModuleList([
			ConvLSTMCell(
				input_dim=input_dim if i == 0 else hidden_dim,
				hidden_dim=hidden_dim,
				kernel_size=3
			)
			for i in range(num_layers)
		])
		
		# Output projection
		self.output_conv = nn.Conv2d(hidden_dim, 1, kernel_size=1, padding=0)
	
	def forward(self, x: torch.Tensor) -> torch.Tensor:
		"""
		Args:
			x: Input (B, seq_len, C, H, W)
		
		Returns:
			Prediction (B, 1, H, W)
		"""
		batch_size, seq_len, channels, h, w = x.shape
		
		# Initialize hidden and cell states
		h_states = [
			torch.zeros(batch_size, self.hidden_dim, h, w, device=x.device)
			for _ in range(self.num_layers)
		]
		c_states = [
			torch.zeros(batch_size, self.hidden_dim, h, w, device=x.device)
			for _ in range(self.num_layers)
		]
		
		# Process sequence
		for t in range(seq_len):
			x_t = x[:, t, :, :, :]  # (B, C, H, W)
			
			for layer in range(self.num_layers):
				h_states[layer], c_states[layer] = self.conv_lstm_cells[layer](
					x_t, h_states[layer], c_states[layer]
				)
				x_t = h_states[layer]
		
		# Output projection from final hidden state
		output = self.output_conv(h_states[-1])  # (B, 1, H, W)
		output = torch.sigmoid(output)  # Constrain to [0, 1]
		
		return output
