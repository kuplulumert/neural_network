# Neural Network Visualizer 🧠

An interactive Streamlit application that demonstrates how a simple neural network works, including all the background processes like forward propagation, backpropagation, and weight updates.

## Features

- **Interactive Neural Network Architecture**: Visualize the network structure with neurons and weighted connections
- **Real-time Training**: Watch the network learn in real-time with adjustable parameters
- **Multiple Datasets**: Test the network on different classification problems (XOR, Circle, Linear)
- **Decision Boundary Visualization**: See how the network classifies different regions of the input space
- **Gradient Visualization**: Observe how gradients flow through the network during backpropagation
- **Weight Matrix Display**: Monitor how weights change during training
- **Mathematical Explanations**: Detailed mathematical formulas explaining each step

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

1. Start the Streamlit app:
```bash
streamlit run streamlit_app.py
```

2. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:8501`)

## How to Use

### 1. Configure the Network
Use the sidebar to:
- Select a dataset type (XOR, Circle, or Linear)
- Adjust the number of hidden neurons
- Set the learning rate
- Configure training epochs and batch size

### 2. Train the Network
- Click **"Train Network"** to run full training
- Click **"Train Single Step"** to see one training iteration
- Watch the loss decrease over time in the loss chart

### 3. Explore Visualizations
- **Dataset Visualization**: See the training data points
- **Network Architecture**: Observe neuron activations and connection weights
  - Green connections = positive weights
  - Red connections = negative weights
  - Line thickness = weight magnitude
- **Decision Boundary**: View how the network classifies the input space
- **Loss Chart**: Monitor training progress

### 4. Make Predictions
- Enter custom input values
- Click "Predict" to see the network's output
- View confidence levels for classification

### 5. Understand the Math
Expand the sections to see:
- Mathematical formulas for forward and backward propagation
- Current gradient values
- Weight matrices

## Understanding the Network

### Network Structure
- **Input Layer**: 2 neurons (for 2D features)
- **Hidden Layer**: Configurable (2-10 neurons)
- **Output Layer**: 1 neuron (binary classification)
- **Activation Function**: Sigmoid

### Learning Process
1. **Forward Pass**: Input flows through the network to produce an output
2. **Loss Calculation**: Compare output with true label using Mean Squared Error
3. **Backward Pass**: Calculate gradients using backpropagation
4. **Weight Update**: Adjust weights using gradient descent

### Key Concepts Demonstrated
- **Activation Functions**: How sigmoid transforms linear combinations
- **Gradient Descent**: How weights are updated to minimize loss
- **Backpropagation**: How errors propagate backward through the network
- **Decision Boundaries**: How the network learns to separate classes
- **Non-linear Classification**: How hidden layers enable complex decision boundaries

## Educational Value

This application is perfect for:
- Students learning about neural networks
- Educators teaching machine learning concepts
- Anyone curious about how neural networks work internally
- Visualizing the mathematics behind deep learning

## Tips for Learning

1. Start with the **Linear** dataset to see how the network solves simple problems
2. Move to **XOR** to understand why hidden layers are necessary
3. Try **Circle** to see complex non-linear decision boundaries
4. Experiment with different numbers of hidden neurons
5. Adjust the learning rate to see its effect on training speed and stability
6. Use single-step training to observe individual weight updates

## Technical Details

The neural network implementation includes:
- Vectorized operations using NumPy
- Efficient batch processing
- Gradient clipping to prevent overflow
- Interactive visualizations with Plotly
- Real-time updates with Streamlit

Enjoy exploring and learning about neural networks! 🚀