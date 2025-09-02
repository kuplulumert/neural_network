import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from typing import List, Tuple
import time

# Set page config
st.set_page_config(
    page_title="Neural Network Visualizer",
    page_icon="🧠",
    layout="wide"
)

class SimpleNeuralNetwork:
    """A simple 2-layer neural network for educational purposes"""
    
    def __init__(self, input_size: int, hidden_size: int, output_size: int, learning_rate: float = 0.1):
        """
        Initialize the neural network with random weights
        
        Args:
            input_size: Number of input neurons
            hidden_size: Number of hidden layer neurons
            output_size: Number of output neurons
            learning_rate: Learning rate for gradient descent
        """
        # Initialize weights with small random values
        np.random.seed(42)  # For reproducibility
        self.learning_rate = learning_rate
        
        # Weights from input to hidden layer (input_size x hidden_size)
        self.weights_input_hidden = np.random.randn(input_size, hidden_size) * 0.5
        # Bias for hidden layer
        self.bias_hidden = np.zeros((1, hidden_size))
        
        # Weights from hidden to output layer (hidden_size x output_size)
        self.weights_hidden_output = np.random.randn(hidden_size, output_size) * 0.5
        # Bias for output layer
        self.bias_output = np.zeros((1, output_size))
        
        # Store intermediate values for visualization
        self.last_input = None
        self.last_hidden_raw = None
        self.last_hidden_activated = None
        self.last_output_raw = None
        self.last_output = None
        self.last_gradients = {}
        
    def sigmoid(self, x: np.ndarray) -> np.ndarray:
        """Sigmoid activation function"""
        return 1 / (1 + np.exp(-np.clip(x, -500, 500)))  # Clip to prevent overflow
    
    def sigmoid_derivative(self, x: np.ndarray) -> np.ndarray:
        """Derivative of sigmoid function"""
        sig = self.sigmoid(x)
        return sig * (1 - sig)
    
    def forward(self, X: np.ndarray) -> np.ndarray:
        """
        Forward propagation through the network
        
        Args:
            X: Input data (batch_size x input_size)
            
        Returns:
            Output predictions (batch_size x output_size)
        """
        # Store input for visualization
        self.last_input = X
        
        # Hidden layer computation
        # z1 = X * W1 + b1
        self.last_hidden_raw = np.dot(X, self.weights_input_hidden) + self.bias_hidden
        # a1 = sigmoid(z1)
        self.last_hidden_activated = self.sigmoid(self.last_hidden_raw)
        
        # Output layer computation
        # z2 = a1 * W2 + b2
        self.last_output_raw = np.dot(self.last_hidden_activated, self.weights_hidden_output) + self.bias_output
        # a2 = sigmoid(z2)
        self.last_output = self.sigmoid(self.last_output_raw)
        
        return self.last_output
    
    def backward(self, X: np.ndarray, y: np.ndarray, output: np.ndarray) -> float:
        """
        Backward propagation (backpropagation) to calculate gradients
        
        Args:
            X: Input data
            y: True labels
            output: Predicted output from forward pass
            
        Returns:
            Loss value
        """
        m = X.shape[0]  # Number of samples
        
        # Calculate loss (Mean Squared Error)
        loss = np.mean((output - y) ** 2)
        
        # Output layer gradients
        # dL/dz2 = dL/da2 * da2/dz2 = (a2 - y) * sigmoid'(z2)
        output_error = output - y
        output_delta = output_error * self.sigmoid_derivative(self.last_output_raw)
        
        # Hidden layer gradients
        # dL/dz1 = dL/dz2 * dz2/da1 * da1/dz1
        hidden_error = np.dot(output_delta, self.weights_hidden_output.T)
        hidden_delta = hidden_error * self.sigmoid_derivative(self.last_hidden_raw)
        
        # Calculate weight gradients
        # dL/dW2 = a1.T * dL/dz2
        d_weights_hidden_output = np.dot(self.last_hidden_activated.T, output_delta) / m
        d_bias_output = np.sum(output_delta, axis=0, keepdims=True) / m
        
        # dL/dW1 = X.T * dL/dz1
        d_weights_input_hidden = np.dot(X.T, hidden_delta) / m
        d_bias_hidden = np.sum(hidden_delta, axis=0, keepdims=True) / m
        
        # Store gradients for visualization
        self.last_gradients = {
            'weights_hidden_output': d_weights_hidden_output,
            'bias_output': d_bias_output,
            'weights_input_hidden': d_weights_input_hidden,
            'bias_hidden': d_bias_hidden,
            'output_delta': output_delta,
            'hidden_delta': hidden_delta
        }
        
        # Update weights using gradient descent
        self.weights_hidden_output -= self.learning_rate * d_weights_hidden_output
        self.bias_output -= self.learning_rate * d_bias_output
        self.weights_input_hidden -= self.learning_rate * d_weights_input_hidden
        self.bias_hidden -= self.learning_rate * d_bias_hidden
        
        return loss
    
    def train_step(self, X: np.ndarray, y: np.ndarray) -> float:
        """
        Perform one training step (forward + backward)
        
        Args:
            X: Input data
            y: True labels
            
        Returns:
            Loss value
        """
        output = self.forward(X)
        loss = self.backward(X, y, output)
        return loss
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions on input data"""
        return self.forward(X)

def create_network_visualization(nn: SimpleNeuralNetwork, input_data: np.ndarray = None):
    """Create an interactive visualization of the neural network architecture"""
    
    fig = go.Figure()
    
    # Define layer positions
    layers = {
        'input': {'x': 0, 'neurons': 2, 'y_positions': [0.3, 0.7]},
        'hidden': {'x': 0.5, 'neurons': 3, 'y_positions': [0.2, 0.5, 0.8]},
        'output': {'x': 1, 'neurons': 1, 'y_positions': [0.5]}
    }
    
    # Draw connections with weights
    # Input to hidden connections
    for i, y1 in enumerate(layers['input']['y_positions']):
        for j, y2 in enumerate(layers['hidden']['y_positions']):
            weight = nn.weights_input_hidden[i, j]
            color = 'green' if weight > 0 else 'red'
            opacity = min(abs(weight), 1)
            
            fig.add_trace(go.Scatter(
                x=[layers['input']['x'], layers['hidden']['x']],
                y=[y1, y2],
                mode='lines',
                line=dict(color=color, width=abs(weight)*3),
                opacity=opacity,
                hovertemplate=f'Weight: {weight:.3f}<extra></extra>',
                showlegend=False
            ))
    
    # Hidden to output connections
    for i, y1 in enumerate(layers['hidden']['y_positions']):
        for j, y2 in enumerate(layers['output']['y_positions']):
            weight = nn.weights_hidden_output[i, j]
            color = 'green' if weight > 0 else 'red'
            opacity = min(abs(weight), 1)
            
            fig.add_trace(go.Scatter(
                x=[layers['hidden']['x'], layers['output']['x']],
                y=[y1, y2],
                mode='lines',
                line=dict(color=color, width=abs(weight)*3),
                opacity=opacity,
                hovertemplate=f'Weight: {weight:.3f}<extra></extra>',
                showlegend=False
            ))
    
    # Draw neurons
    # Input neurons
    for i, y in enumerate(layers['input']['y_positions']):
        value = nn.last_input[0, i] if nn.last_input is not None else 0
        fig.add_trace(go.Scatter(
            x=[layers['input']['x']],
            y=[y],
            mode='markers+text',
            marker=dict(size=40, color='lightblue'),
            text=[f'x{i+1}<br>{value:.2f}' if nn.last_input is not None else f'x{i+1}'],
            textposition='middle center',
            hovertemplate=f'Input {i+1}: {value:.3f}<extra></extra>' if nn.last_input is not None else f'Input {i+1}<extra></extra>',
            showlegend=False
        ))
    
    # Hidden neurons
    for i, y in enumerate(layers['hidden']['y_positions']):
        value = nn.last_hidden_activated[0, i] if nn.last_hidden_activated is not None else 0
        fig.add_trace(go.Scatter(
            x=[layers['hidden']['x']],
            y=[y],
            mode='markers+text',
            marker=dict(size=40, color='lightgreen'),
            text=[f'h{i+1}<br>{value:.2f}' if nn.last_hidden_activated is not None else f'h{i+1}'],
            textposition='middle center',
            hovertemplate=f'Hidden {i+1}: {value:.3f}<extra></extra>' if nn.last_hidden_activated is not None else f'Hidden {i+1}<extra></extra>',
            showlegend=False
        ))
    
    # Output neuron
    value = nn.last_output[0, 0] if nn.last_output is not None else 0
    fig.add_trace(go.Scatter(
        x=[layers['output']['x']],
        y=[layers['output']['y_positions'][0]],
        mode='markers+text',
        marker=dict(size=40, color='lightyellow'),
        text=[f'y<br>{value:.2f}' if nn.last_output is not None else 'y'],
        textposition='middle center',
        hovertemplate=f'Output: {value:.3f}<extra></extra>' if nn.last_output is not None else 'Output<extra></extra>',
        showlegend=False
    ))
    
    fig.update_layout(
        title="Neural Network Architecture",
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False, range=[-0.2, 1.2]),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False, range=[0, 1]),
        height=400,
        showlegend=False,
        hovermode='closest'
    )
    
    return fig

def create_dataset(dataset_type: str, n_samples: int = 100) -> Tuple[np.ndarray, np.ndarray]:
    """Create a simple dataset for demonstration"""
    np.random.seed(42)
    
    if dataset_type == "XOR":
        # XOR problem
        X = np.random.uniform(-1, 1, (n_samples, 2))
        y = np.array([1 if x[0]*x[1] > 0 else 0 for x in X]).reshape(-1, 1)
    elif dataset_type == "Circle":
        # Circle classification
        X = np.random.uniform(-1, 1, (n_samples, 2))
        y = np.array([1 if np.sqrt(x[0]**2 + x[1]**2) < 0.5 else 0 for x in X]).reshape(-1, 1)
    else:  # Linear
        # Linearly separable
        X = np.random.uniform(-1, 1, (n_samples, 2))
        y = np.array([1 if x[0] + x[1] > 0 else 0 for x in X]).reshape(-1, 1)
    
    return X, y

def plot_decision_boundary(nn: SimpleNeuralNetwork, X: np.ndarray, y: np.ndarray):
    """Plot the decision boundary of the neural network"""
    
    # Create a mesh
    h = 0.02
    x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
    y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
    xx, yy = np.meshgrid(np.arange(x_min, x_max, h), np.arange(y_min, y_max, h))
    
    # Predict on mesh
    Z = nn.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)
    
    # Create plotly figure
    fig = go.Figure()
    
    # Add contour for decision boundary
    fig.add_trace(go.Contour(
        x=np.arange(x_min, x_max, h),
        y=np.arange(y_min, y_max, h),
        z=Z,
        colorscale='RdBu',
        opacity=0.6,
        showscale=True,
        contours=dict(start=0, end=1, size=0.1),
        colorbar=dict(title="Prediction")
    ))
    
    # Add scatter points
    fig.add_trace(go.Scatter(
        x=X[y.ravel() == 0, 0],
        y=X[y.ravel() == 0, 1],
        mode='markers',
        marker=dict(color='blue', size=8),
        name='Class 0'
    ))
    
    fig.add_trace(go.Scatter(
        x=X[y.ravel() == 1, 0],
        y=X[y.ravel() == 1, 1],
        mode='markers',
        marker=dict(color='red', size=8),
        name='Class 1'
    ))
    
    fig.update_layout(
        title="Decision Boundary",
        xaxis_title="Feature 1",
        yaxis_title="Feature 2",
        height=400
    )
    
    return fig

# Streamlit App
def main():
    st.title("🧠 Interactive Neural Network Visualizer")
    st.markdown("""
    This app demonstrates how a simple neural network works, including:
    - **Forward Propagation**: How data flows through the network
    - **Backpropagation**: How the network learns from errors
    - **Weight Updates**: How weights are adjusted during training
    - **Decision Boundaries**: How the network classifies data
    """)
    
    # Sidebar configuration
    st.sidebar.header("⚙️ Network Configuration")
    
    # Dataset selection
    dataset_type = st.sidebar.selectbox(
        "Select Dataset",
        ["XOR", "Circle", "Linear"],
        help="Choose the type of classification problem"
    )
    
    # Network parameters
    hidden_neurons = st.sidebar.slider("Hidden Layer Neurons", 2, 10, 3)
    learning_rate = st.sidebar.slider("Learning Rate", 0.01, 1.0, 0.1, 0.01)
    
    # Training controls
    st.sidebar.header("🎮 Training Controls")
    epochs = st.sidebar.slider("Training Epochs", 10, 1000, 100, 10)
    batch_size = st.sidebar.slider("Batch Size", 1, 50, 10)
    
    # Initialize or reset network
    if st.sidebar.button("🔄 Reset Network") or 'nn' not in st.session_state:
        st.session_state.nn = SimpleNeuralNetwork(
            input_size=2,
            hidden_size=hidden_neurons,
            output_size=1,
            learning_rate=learning_rate
        )
        st.session_state.losses = []
        st.session_state.epoch_count = 0
    
    # Generate dataset
    X_train, y_train = create_dataset(dataset_type, n_samples=100)
    
    # Main content area
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📊 Dataset Visualization")
        # Plot dataset
        fig_data = go.Figure()
        fig_data.add_trace(go.Scatter(
            x=X_train[y_train.ravel() == 0, 0],
            y=X_train[y_train.ravel() == 0, 1],
            mode='markers',
            marker=dict(color='blue', size=8),
            name='Class 0'
        ))
        fig_data.add_trace(go.Scatter(
            x=X_train[y_train.ravel() == 1, 0],
            y=X_train[y_train.ravel() == 1, 1],
            mode='markers',
            marker=dict(color='red', size=8),
            name='Class 1'
        ))
        fig_data.update_layout(
            title=f"{dataset_type} Dataset",
            xaxis_title="Feature 1",
            yaxis_title="Feature 2",
            height=400
        )
        st.plotly_chart(fig_data, use_container_width=True)
    
    with col2:
        st.subheader("🏗️ Network Architecture")
        # Visualize network
        network_fig = create_network_visualization(st.session_state.nn)
        st.plotly_chart(network_fig, use_container_width=True)
    
    # Training section
    st.header("🎯 Training Process")
    
    col3, col4 = st.columns(2)
    
    with col3:
        # Training controls
        if st.button("▶️ Train Network", type="primary"):
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            # Training loop
            for epoch in range(epochs):
                # Shuffle data
                indices = np.random.permutation(len(X_train))
                X_shuffled = X_train[indices]
                y_shuffled = y_train[indices]
                
                epoch_loss = 0
                num_batches = len(X_train) // batch_size
                
                for i in range(0, len(X_train), batch_size):
                    batch_X = X_shuffled[i:i+batch_size]
                    batch_y = y_shuffled[i:i+batch_size]
                    
                    loss = st.session_state.nn.train_step(batch_X, batch_y)
                    epoch_loss += loss
                
                avg_loss = epoch_loss / num_batches
                st.session_state.losses.append(avg_loss)
                st.session_state.epoch_count += 1
                
                # Update progress
                progress = (epoch + 1) / epochs
                progress_bar.progress(progress)
                status_text.text(f"Epoch {epoch+1}/{epochs} - Loss: {avg_loss:.4f}")
                
                time.sleep(0.01)  # Small delay for visualization
            
            st.success(f"✅ Training completed! Final loss: {st.session_state.losses[-1]:.4f}")
        
        # Single step training
        if st.button("⏭️ Train Single Step"):
            sample_idx = np.random.randint(0, len(X_train))
            loss = st.session_state.nn.train_step(
                X_train[sample_idx:sample_idx+1],
                y_train[sample_idx:sample_idx+1]
            )
            st.session_state.losses.append(loss)
            st.session_state.epoch_count += 1
            st.info(f"Single step loss: {loss:.4f}")
    
    with col4:
        # Loss visualization
        if st.session_state.losses:
            fig_loss = go.Figure()
            fig_loss.add_trace(go.Scatter(
                x=list(range(1, len(st.session_state.losses) + 1)),
                y=st.session_state.losses,
                mode='lines',
                name='Training Loss',
                line=dict(color='orange', width=2)
            ))
            fig_loss.update_layout(
                title="Training Loss Over Time",
                xaxis_title="Iteration",
                yaxis_title="Loss (MSE)",
                height=300
            )
            st.plotly_chart(fig_loss, use_container_width=True)
    
    # Decision boundary and predictions
    st.header("🎨 Decision Boundary & Predictions")
    
    col5, col6 = st.columns(2)
    
    with col5:
        if st.session_state.epoch_count > 0:
            boundary_fig = plot_decision_boundary(st.session_state.nn, X_train, y_train)
            st.plotly_chart(boundary_fig, use_container_width=True)
        else:
            st.info("Train the network to see the decision boundary")
    
    with col6:
        st.subheader("🔮 Make Predictions")
        col_input1, col_input2 = st.columns(2)
        with col_input1:
            input1 = st.number_input("Feature 1", value=0.5, min_value=-1.0, max_value=1.0, step=0.1)
        with col_input2:
            input2 = st.number_input("Feature 2", value=0.5, min_value=-1.0, max_value=1.0, step=0.1)
        
        if st.button("Predict"):
            test_input = np.array([[input1, input2]])
            prediction = st.session_state.nn.predict(test_input)[0, 0]
            
            st.metric("Prediction", f"{prediction:.4f}")
            if prediction > 0.5:
                st.success(f"Class 1 (Confidence: {prediction*100:.1f}%)")
            else:
                st.info(f"Class 0 (Confidence: {(1-prediction)*100:.1f}%)")
    
    # Mathematical explanation
    with st.expander("📚 How It Works - Mathematical Details"):
        st.markdown("""
        ### Forward Propagation
        
        1. **Input to Hidden Layer:**
           - Linear combination: $z^{[1]} = W^{[1]} \\cdot x + b^{[1]}$
           - Activation: $a^{[1]} = \\sigma(z^{[1]})$ where $\\sigma(x) = \\frac{1}{1 + e^{-x}}$
        
        2. **Hidden to Output Layer:**
           - Linear combination: $z^{[2]} = W^{[2]} \\cdot a^{[1]} + b^{[2]}$
           - Activation: $a^{[2]} = \\sigma(z^{[2]})$
        
        ### Backpropagation
        
        1. **Calculate Loss:**
           - Mean Squared Error: $L = \\frac{1}{2m} \\sum_{i=1}^{m} (y_i - \\hat{y}_i)^2$
        
        2. **Calculate Gradients (Chain Rule):**
           - Output layer: $\\delta^{[2]} = (a^{[2]} - y) \\cdot \\sigma'(z^{[2]})$
           - Hidden layer: $\\delta^{[1]} = (W^{[2]})^T \\cdot \\delta^{[2]} \\cdot \\sigma'(z^{[1]})$
        
        3. **Update Weights:**
           - $W^{[l]} = W^{[l]} - \\alpha \\cdot \\frac{\\partial L}{\\partial W^{[l]}}$
           - $b^{[l]} = b^{[l]} - \\alpha \\cdot \\frac{\\partial L}{\\partial b^{[l]}}$
        
        Where $\\alpha$ is the learning rate.
        """)
    
    # Gradient visualization
    with st.expander("🔬 Gradient Visualization"):
        if st.session_state.nn.last_gradients:
            st.subheader("Current Gradients")
            
            col_grad1, col_grad2 = st.columns(2)
            
            with col_grad1:
                st.write("**Input-Hidden Weight Gradients:**")
                grad_df = pd.DataFrame(
                    st.session_state.nn.last_gradients['weights_input_hidden'],
                    index=[f"Input {i+1}" for i in range(2)],
                    columns=[f"Hidden {i+1}" for i in range(hidden_neurons)]
                )
                st.dataframe(grad_df.style.background_gradient(cmap='RdBu'))
            
            with col_grad2:
                st.write("**Hidden-Output Weight Gradients:**")
                grad_df = pd.DataFrame(
                    st.session_state.nn.last_gradients['weights_hidden_output'],
                    index=[f"Hidden {i+1}" for i in range(hidden_neurons)],
                    columns=["Output"]
                )
                st.dataframe(grad_df.style.background_gradient(cmap='RdBu'))
        else:
            st.info("Train the network to see gradient values")
    
    # Weight matrices
    with st.expander("⚖️ Current Weight Matrices"):
        col_w1, col_w2 = st.columns(2)
        
        with col_w1:
            st.write("**Input-Hidden Weights:**")
            weights_df = pd.DataFrame(
                st.session_state.nn.weights_input_hidden,
                index=[f"Input {i+1}" for i in range(2)],
                columns=[f"Hidden {i+1}" for i in range(hidden_neurons)]
            )
            st.dataframe(weights_df.style.background_gradient(cmap='RdBu'))
        
        with col_w2:
            st.write("**Hidden-Output Weights:**")
            weights_df = pd.DataFrame(
                st.session_state.nn.weights_hidden_output,
                index=[f"Hidden {i+1}" for i in range(hidden_neurons)],
                columns=["Output"]
            )
            st.dataframe(weights_df.style.background_gradient(cmap='RdBu'))

if __name__ == "__main__":
    main()