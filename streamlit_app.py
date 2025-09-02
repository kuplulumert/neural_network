import streamlit as st
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
import time
import json
from datetime import datetime
import math
from dataclasses import dataclass
from typing import List, Tuple, Dict
import random

# Page configuration
st.set_page_config(
    page_title="Fluid Dynamics Adventure",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'game_state' not in st.session_state:
    st.session_state.game_state = {
        'level': 1,
        'knowledge_points': 0,
        'discovered_concepts': [],
        'current_puzzle': None,
        'puzzle_solved': False,
        'player_name': None,
        'achievements': [],
        'current_location': 'hub',
        'simulation_params': {
            'viscosity': 0.001,
            'density': 1000,
            'flow_rate': 5.0,
            'pressure': 101325,
            'temperature': 20
        }
    }

# Fluid properties database
FLUIDS = {
    'water': {'density': 1000, 'viscosity': 0.001, 'color': 'blue', 'name': 'Water'},
    'oil': {'density': 900, 'viscosity': 0.1, 'color': 'brown', 'name': 'Oil'},
    'honey': {'density': 1400, 'viscosity': 10, 'color': 'gold', 'name': 'Honey'},
    'air': {'density': 1.2, 'viscosity': 0.000018, 'color': 'lightblue', 'name': 'Air'},
    'mercury': {'density': 13600, 'viscosity': 0.0015, 'color': 'silver', 'name': 'Mercury'}
}

# Educational concepts
CONCEPTS = {
    'bernoulli': {
        'name': "Bernoulli's Principle",
        'description': "As the speed of a fluid increases, its pressure decreases",
        'formula': "P + ½ρv² + ρgh = constant",
        'points': 10
    },
    'reynolds': {
        'name': "Reynolds Number",
        'description': "Predicts flow patterns in different fluid flow situations",
        'formula': "Re = ρvL/μ",
        'points': 15
    },
    'buoyancy': {
        'name': "Archimedes' Principle",
        'description': "The upward buoyant force equals the weight of displaced fluid",
        'formula': "F_b = ρ_fluid × V_displaced × g",
        'points': 10
    },
    'viscosity': {
        'name': "Viscosity",
        'description': "A fluid's resistance to flow",
        'formula': "τ = μ(du/dy)",
        'points': 12
    },
    'continuity': {
        'name': "Continuity Equation",
        'description': "Mass flow rate must remain constant in a pipe",
        'formula': "A₁v₁ = A₂v₂",
        'points': 10
    }
}

class FluidSimulation:
    """Simplified fluid simulation for web visualization"""
    
    def __init__(self, width=50, height=50):
        self.width = width
        self.height = height
        self.reset()
        
    def reset(self):
        """Reset simulation to initial state"""
        # Velocity field
        self.vx = np.zeros((self.height, self.width))
        self.vy = np.zeros((self.height, self.width))
        
        # Pressure field
        self.pressure = np.ones((self.height, self.width)) * 101325  # Pa
        
        # Density field
        self.density = np.ones((self.height, self.width)) * 1000  # kg/m³
        
        # Add some initial flow
        for i in range(self.height):
            for j in range(self.width):
                self.vx[i, j] = 0.5 + 0.1 * np.sin(j * 0.2)
                self.vy[i, j] = 0.1 * np.cos(i * 0.2)
    
    def add_obstacle(self, x, y, radius):
        """Add circular obstacle to flow"""
        for i in range(max(0, y-radius), min(self.height, y+radius)):
            for j in range(max(0, x-radius), min(self.width, x+radius)):
                if np.sqrt((i-y)**2 + (j-x)**2) <= radius:
                    self.vx[i, j] = 0
                    self.vy[i, j] = 0
    
    def add_source(self, x, y, strength):
        """Add flow source"""
        if 0 <= x < self.width and 0 <= y < self.height:
            self.vx[y, x] += strength
    
    def step(self, dt=0.1, viscosity=0.001):
        """Simple simulation step"""
        # Diffusion (viscosity effect)
        alpha = viscosity * dt
        
        # Simple diffusion
        new_vx = self.vx.copy()
        new_vy = self.vy.copy()
        
        for i in range(1, self.height-1):
            for j in range(1, self.width-1):
                new_vx[i, j] = self.vx[i, j] + alpha * (
                    self.vx[i+1, j] + self.vx[i-1, j] + 
                    self.vx[i, j+1] + self.vx[i, j-1] - 4*self.vx[i, j]
                )
                new_vy[i, j] = self.vy[i, j] + alpha * (
                    self.vy[i+1, j] + self.vy[i-1, j] + 
                    self.vy[i, j+1] + self.vy[i, j-1] - 4*self.vy[i, j]
                )
        
        self.vx = new_vx
        self.vy = new_vy
        
        # Advection (fluid movement)
        new_vx = self.vx.copy()
        new_vy = self.vy.copy()
        
        for i in range(1, self.height-1):
            for j in range(1, self.width-1):
                # Where did this fluid come from?
                x = j - self.vx[i, j] * dt
                y = i - self.vy[i, j] * dt
                
                # Clamp to boundaries
                x = max(0, min(self.width-1, x))
                y = max(0, min(self.height-1, y))
                
                # Simple interpolation
                x0, y0 = int(x), int(y)
                x1, y1 = min(x0+1, self.width-1), min(y0+1, self.height-1)
                
                sx = x - x0
                sy = y - y0
                
                new_vx[i, j] = (1-sx)*(1-sy)*self.vx[y0, x0] + sx*(1-sy)*self.vx[y0, x1] + \
                              (1-sx)*sy*self.vx[y1, x0] + sx*sy*self.vx[y1, x1]
                new_vy[i, j] = (1-sx)*(1-sy)*self.vy[y0, x0] + sx*(1-sy)*self.vy[y0, x1] + \
                              (1-sx)*sy*self.vy[y1, x0] + sx*sy*self.vy[y1, x1]
        
        self.vx = new_vx
        self.vy = new_vy
        
        # Update pressure based on velocity divergence
        for i in range(1, self.height-1):
            for j in range(1, self.width-1):
                div = (self.vx[i, j+1] - self.vx[i, j-1])/(2) + \
                      (self.vy[i+1, j] - self.vy[i-1, j])/(2)
                self.pressure[i, j] = 101325 - div * 1000
    
    def get_velocity_magnitude(self):
        """Calculate speed at each point"""
        return np.sqrt(self.vx**2 + self.vy**2)
    
    def get_streamlines(self, num_lines=20):
        """Generate streamline data for visualization"""
        streamlines = []
        
        for _ in range(num_lines):
            # Random starting point
            x = random.uniform(0, self.width-1)
            y = random.uniform(0, self.height-1)
            
            line = [(x, y)]
            
            # Trace streamline
            for _ in range(50):
                ix, iy = int(x), int(y)
                if 0 <= ix < self.width-1 and 0 <= iy < self.height-1:
                    vx = self.vx[iy, ix]
                    vy = self.vy[iy, ix]
                    
                    # Move along velocity
                    x += vx * 0.5
                    y += vy * 0.5
                    
                    line.append((x, y))
                else:
                    break
            
            streamlines.append(line)
        
        return streamlines

def create_flow_visualization(simulation, show_streamlines=True, show_vectors=False):
    """Create Plotly visualization of fluid flow"""
    
    fig = go.Figure()
    
    # Velocity magnitude as heatmap
    vel_mag = simulation.get_velocity_magnitude()
    
    fig.add_trace(go.Heatmap(
        z=vel_mag,
        colorscale='Blues',
        showscale=True,
        colorbar=dict(title="Velocity (m/s)"),
        hovertemplate="x: %{x}<br>y: %{y}<br>Velocity: %{z:.2f} m/s<extra></extra>"
    ))
    
    # Add streamlines
    if show_streamlines:
        streamlines = simulation.get_streamlines(15)
        for line in streamlines:
            xs = [p[0] for p in line]
            ys = [p[1] for p in line]
            fig.add_trace(go.Scatter(
                x=xs, y=ys,
                mode='lines',
                line=dict(color='white', width=1),
                showlegend=False,
                hoverinfo='skip'
            ))
    
    # Add velocity vectors
    if show_vectors:
        step = 5
        for i in range(0, simulation.height, step):
            for j in range(0, simulation.width, step):
                fig.add_annotation(
                    x=j, y=i,
                    ax=j + simulation.vx[i, j]*3,
                    ay=i + simulation.vy[i, j]*3,
                    xref="x", yref="y",
                    axref="x", ayref="y",
                    showarrow=True,
                    arrowhead=2,
                    arrowsize=1,
                    arrowwidth=1,
                    arrowcolor="red"
                )
    
    fig.update_layout(
        title="Fluid Flow Simulation",
        xaxis_title="X",
        yaxis_title="Y",
        height=500,
        showlegend=False,
        xaxis=dict(scaleanchor="y", scaleratio=1),
        yaxis=dict(scaleanchor="x", scaleratio=1)
    )
    
    return fig

def create_puzzle(puzzle_type):
    """Create an interactive puzzle"""
    
    if puzzle_type == "bernoulli":
        return {
            'title': "Bernoulli's Challenge",
            'description': "Adjust the pipe diameter to create the right pressure difference",
            'target': 5000,  # Pa
            'current': 0,
            'parameter': 'diameter',
            'min_val': 0.01,
            'max_val': 0.5,
            'unit': 'm'
        }
    elif puzzle_type == "reynolds":
        return {
            'title': "Reynolds Number Quest",
            'description': "Find the right velocity to achieve laminar flow (Re < 2300)",
            'target': 2000,
            'current': 0,
            'parameter': 'velocity',
            'min_val': 0.1,
            'max_val': 10,
            'unit': 'm/s'
        }
    elif puzzle_type == "buoyancy":
        return {
            'title': "Buoyancy Balance",
            'description': "Adjust object density to make it float at 50% submerged",
            'target': 0.5,
            'current': 0,
            'parameter': 'density',
            'min_val': 100,
            'max_val': 2000,
            'unit': 'kg/m³'
        }
    else:
        return None

def calculate_puzzle_result(puzzle, value):
    """Calculate result based on puzzle type and input"""
    
    if puzzle['title'] == "Bernoulli's Challenge":
        # Simplified Bernoulli calculation
        velocity = 10 / (value * value)  # Inverse relationship
        pressure_diff = 0.5 * 1000 * velocity * velocity
        return pressure_diff
    
    elif puzzle['title'] == "Reynolds Number Quest":
        # Reynolds number calculation
        Re = 1000 * value * 0.1 / 0.001  # ρvL/μ
        return Re
    
    elif puzzle['title'] == "Buoyancy Balance":
        # Buoyancy calculation
        fluid_density = 1000  # water
        submerged_fraction = min(1.0, value / fluid_density)
        return submerged_fraction
    
    return 0

def main():
    # Title and intro
    st.title("🌊 Fluid Dynamics Adventure")
    st.markdown("*An educational journey through the physics of fluids*")
    
    # Sidebar - Game Status
    with st.sidebar:
        st.header("🎮 Game Status")
        
        # Player info
        if st.session_state.game_state['player_name'] is None:
            player_name = st.text_input("Enter your name:", key="name_input")
            if st.button("Start Adventure"):
                if player_name:
                    st.session_state.game_state['player_name'] = player_name
                    st.rerun()
        else:
            st.write(f"**Player:** {st.session_state.game_state['player_name']}")
            st.write(f"**Level:** {st.session_state.game_state['level']}")
            st.write(f"**Knowledge Points:** {st.session_state.game_state['knowledge_points']} 🏆")
            
            # Progress bar
            progress = min(100, (st.session_state.game_state['knowledge_points'] / 100) * 100)
            st.progress(progress / 100)
            
            # Discovered concepts
            st.subheader("📚 Discovered Concepts")
            if st.session_state.game_state['discovered_concepts']:
                for concept in st.session_state.game_state['discovered_concepts']:
                    st.success(f"✓ {CONCEPTS[concept]['name']}")
            else:
                st.info("Explore to discover concepts!")
            
            # Achievements
            if st.session_state.game_state['achievements']:
                st.subheader("🏅 Achievements")
                for achievement in st.session_state.game_state['achievements']:
                    st.write(f"🏆 {achievement}")
    
    # Main game area
    if st.session_state.game_state['player_name'] is None:
        st.info("👈 Enter your name in the sidebar to begin your fluid dynamics adventure!")
        
        # Show demo
        st.header("Preview: Fluid Flow Simulation")
        demo_sim = FluidSimulation(30, 30)
        demo_sim.add_obstacle(15, 15, 3)
        
        col1, col2 = st.columns([2, 1])
        with col1:
            fig = create_flow_visualization(demo_sim, show_streamlines=True)
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            st.info("""
            **What you'll learn:**
            - Fluid flow patterns
            - Pressure and velocity
            - Viscosity effects
            - Buoyancy principles
            - Reynolds number
            - And much more!
            """)
        
    else:
        # Game navigation
        tabs = st.tabs(["🗺️ World Map", "🔬 Laboratory", "📖 Learn", "🧩 Puzzles", "📊 Analysis"])
        
        with tabs[0]:  # World Map
            st.header("🗺️ Fluid World")
            
            col1, col2 = st.columns([2, 1])
            
            with col1:
                # Create world map visualization
                locations = {
                    'hub': {'x': 50, 'y': 50, 'name': 'Central Hub', 'color': 'blue'},
                    'river': {'x': 30, 'y': 70, 'name': 'Flowing River', 'color': 'cyan'},
                    'lake': {'x': 70, 'y': 60, 'name': 'Pressure Lake', 'color': 'darkblue'},
                    'lab': {'x': 50, 'y': 30, 'name': 'Fluid Lab', 'color': 'red'},
                    'factory': {'x': 20, 'y': 40, 'name': 'Pipe Factory', 'color': 'gray'},
                    'ocean': {'x': 80, 'y': 80, 'name': 'Buoyancy Ocean', 'color': 'teal'}
                }
                
                fig = go.Figure()
                
                # Add locations
                for loc_id, loc in locations.items():
                    size = 20 if loc_id == st.session_state.game_state['current_location'] else 15
                    fig.add_trace(go.Scatter(
                        x=[loc['x']], y=[loc['y']],
                        mode='markers+text',
                        marker=dict(size=size, color=loc['color']),
                        text=[loc['name']],
                        textposition='top center',
                        name=loc['name']
                    ))
                
                # Add paths
                paths = [
                    ('hub', 'river'), ('hub', 'lake'), ('hub', 'lab'),
                    ('river', 'factory'), ('lake', 'ocean'), ('lab', 'factory')
                ]
                
                for start, end in paths:
                    fig.add_trace(go.Scatter(
                        x=[locations[start]['x'], locations[end]['x']],
                        y=[locations[start]['y'], locations[end]['y']],
                        mode='lines',
                        line=dict(color='lightgray', width=1, dash='dot'),
                        showlegend=False
                    ))
                
                fig.update_layout(
                    title="Fluid World Map",
                    xaxis=dict(range=[0, 100], showgrid=False),
                    yaxis=dict(range=[0, 100], showgrid=False),
                    height=400,
                    showlegend=False
                )
                
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                st.subheader("📍 Travel")
                current_loc = locations[st.session_state.game_state['current_location']]
                st.info(f"Current Location: **{current_loc['name']}**")
                
                # Travel options
                st.write("Travel to:")
                for loc_id, loc in locations.items():
                    if loc_id != st.session_state.game_state['current_location']:
                        if st.button(f"Go to {loc['name']}", key=f"travel_{loc_id}"):
                            st.session_state.game_state['current_location'] = loc_id
                            st.rerun()
                
                # Location description
                descriptions = {
                    'hub': "The central meeting place for fluid scientists",
                    'river': "Study flow patterns and velocity profiles",
                    'lake': "Explore pressure at different depths",
                    'lab': "Conduct advanced fluid experiments",
                    'factory': "Learn about pipe flow and Reynolds number",
                    'ocean': "Discover buoyancy and Archimedes' principle"
                }
                
                st.write("---")
                st.write(f"**About this location:**")
                st.write(descriptions.get(st.session_state.game_state['current_location'], ""))
        
        with tabs[1]:  # Laboratory
            st.header("🔬 Fluid Dynamics Laboratory")
            
            # Simulation controls
            col1, col2, col3 = st.columns(3)
            
            with col1:
                fluid_type = st.selectbox("Select Fluid", list(FLUIDS.keys()))
                viscosity = FLUIDS[fluid_type]['viscosity']
                density = FLUIDS[fluid_type]['density']
            
            with col2:
                flow_speed = st.slider("Flow Speed", 0.1, 10.0, 2.0)
                add_obstacle = st.checkbox("Add Obstacle")
            
            with col3:
                show_streamlines = st.checkbox("Show Streamlines", True)
                show_vectors = st.checkbox("Show Velocity Vectors")
                
            # Run simulation
            if st.button("Run Simulation", type="primary"):
                with st.spinner("Simulating fluid flow..."):
                    # Create and run simulation
                    sim = FluidSimulation(40, 40)
                    
                    # Add initial flow
                    for j in range(sim.width):
                        sim.vx[20, j] = flow_speed
                    
                    # Add obstacle if requested
                    if add_obstacle:
                        sim.add_obstacle(20, 20, 4)
                    
                    # Run simulation steps
                    for _ in range(10):
                        sim.step(dt=0.1, viscosity=viscosity)
                    
                    # Visualize
                    fig = create_flow_visualization(sim, show_streamlines, show_vectors)
                    st.plotly_chart(fig, use_container_width=True)
                    
                    # Show fluid properties
                    col1, col2, col3, col4 = st.columns(4)
                    col1.metric("Fluid", FLUIDS[fluid_type]['name'])
                    col2.metric("Density", f"{density} kg/m³")
                    col3.metric("Viscosity", f"{viscosity} Pa·s")
                    col4.metric("Reynolds Number", f"{int(density * flow_speed * 0.1 / viscosity)}")
                    
                    # Educational info
                    if density * flow_speed * 0.1 / viscosity < 2300:
                        st.success("✅ Laminar Flow - Smooth and predictable")
                    else:
                        st.warning("🌀 Turbulent Flow - Chaotic and mixing")
        
        with tabs[2]:  # Learn
            st.header("📖 Fluid Dynamics Concepts")
            
            # Concept selector
            concept_choice = st.selectbox(
                "Choose a concept to learn:",
                options=list(CONCEPTS.keys()),
                format_func=lambda x: CONCEPTS[x]['name']
            )
            
            concept = CONCEPTS[concept_choice]
            
            # Display concept
            col1, col2 = st.columns([2, 1])
            
            with col1:
                st.subheader(concept['name'])
                st.write(concept['description'])
                st.latex(concept['formula'])
                
                # Interactive example based on concept
                if concept_choice == 'bernoulli':
                    st.write("---")
                    st.write("**Interactive Example:**")
                    
                    pipe_d1 = st.slider("Pipe Diameter 1 (m)", 0.1, 1.0, 0.5)
                    pipe_d2 = st.slider("Pipe Diameter 2 (m)", 0.1, 1.0, 0.25)
                    
                    # Calculate velocities using continuity
                    v1 = 2.0  # m/s
                    A1 = math.pi * (pipe_d1/2)**2
                    A2 = math.pi * (pipe_d2/2)**2
                    v2 = v1 * A1 / A2
                    
                    # Calculate pressure difference
                    rho = 1000  # water
                    delta_p = 0.5 * rho * (v2**2 - v1**2)
                    
                    col_a, col_b = st.columns(2)
                    col_a.metric("Velocity 1", f"{v1:.2f} m/s")
                    col_b.metric("Velocity 2", f"{v2:.2f} m/s")
                    
                    st.metric("Pressure Difference", f"{delta_p:.0f} Pa")
                    
                    if v2 > v1:
                        st.info("💡 When the pipe narrows, velocity increases and pressure decreases!")
                
                elif concept_choice == 'reynolds':
                    st.write("---")
                    st.write("**Reynolds Number Calculator:**")
                    
                    col_a, col_b = st.columns(2)
                    with col_a:
                        re_velocity = st.number_input("Velocity (m/s)", 0.1, 10.0, 1.0)
                        re_length = st.number_input("Characteristic Length (m)", 0.01, 1.0, 0.1)
                    with col_b:
                        re_density = st.number_input("Density (kg/m³)", 1.0, 15000.0, 1000.0)
                        re_viscosity = st.number_input("Viscosity (Pa·s)", 0.0001, 10.0, 0.001)
                    
                    reynolds = re_density * re_velocity * re_length / re_viscosity
                    
                    st.metric("Reynolds Number", f"{reynolds:.0f}")
                    
                    if reynolds < 2300:
                        st.success("Laminar Flow")
                    elif reynolds < 4000:
                        st.warning("Transitional Flow")
                    else:
                        st.error("Turbulent Flow")
            
            with col2:
                # Mark as discovered
                if concept_choice not in st.session_state.game_state['discovered_concepts']:
                    if st.button(f"Mark as Learned (+{concept['points']} points)"):
                        st.session_state.game_state['discovered_concepts'].append(concept_choice)
                        st.session_state.game_state['knowledge_points'] += concept['points']
                        st.balloons()
                        st.rerun()
                else:
                    st.success("✅ Concept Learned!")
                
                # Show related concepts
                st.write("**Related Concepts:**")
                for other_concept in CONCEPTS:
                    if other_concept != concept_choice:
                        if other_concept in st.session_state.game_state['discovered_concepts']:
                            st.write(f"✓ {CONCEPTS[other_concept]['name']}")
                        else:
                            st.write(f"🔒 {CONCEPTS[other_concept]['name']}")
        
        with tabs[3]:  # Puzzles
            st.header("🧩 Fluid Puzzles")
            
            # Select puzzle based on location
            location_puzzles = {
                'hub': 'bernoulli',
                'river': 'continuity',
                'lake': 'pressure',
                'lab': 'reynolds',
                'factory': 'reynolds',
                'ocean': 'buoyancy'
            }
            
            available_puzzles = ['bernoulli', 'reynolds', 'buoyancy']
            puzzle_type = st.selectbox("Choose a puzzle:", available_puzzles)
            
            if st.button("Start Puzzle"):
                st.session_state.game_state['current_puzzle'] = create_puzzle(puzzle_type)
                st.session_state.game_state['puzzle_solved'] = False
            
            if st.session_state.game_state['current_puzzle']:
                puzzle = st.session_state.game_state['current_puzzle']
                
                st.subheader(puzzle['title'])
                st.write(puzzle['description'])
                
                # Puzzle input
                value = st.slider(
                    f"Adjust {puzzle['parameter']} ({puzzle['unit']})",
                    puzzle['min_val'],
                    puzzle['max_val'],
                    (puzzle['min_val'] + puzzle['max_val']) / 2
                )
                
                # Calculate result
                result = calculate_puzzle_result(puzzle, value)
                puzzle['current'] = result
                
                # Display progress
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Current Value", f"{result:.2f}")
                with col2:
                    st.metric("Target Value", f"{puzzle['target']:.2f}")
                
                # Progress bar
                if puzzle['target'] > 0:
                    accuracy = 1 - abs(result - puzzle['target']) / puzzle['target']
                    accuracy = max(0, min(1, accuracy))
                    st.progress(accuracy)
                    
                    # Check if solved
                    if accuracy > 0.95 and not st.session_state.game_state['puzzle_solved']:
                        st.success("🎉 Puzzle Solved!")
                        st.session_state.game_state['puzzle_solved'] = True
                        points_earned = 20
                        st.session_state.game_state['knowledge_points'] += points_earned
                        st.write(f"You earned {points_earned} knowledge points!")
                        
                        # Add achievement
                        achievement = f"Solved {puzzle['title']}"
                        if achievement not in st.session_state.game_state['achievements']:
                            st.session_state.game_state['achievements'].append(achievement)
                        
                        if st.button("Next Puzzle"):
                            st.session_state.game_state['current_puzzle'] = None
                            st.rerun()
                    elif accuracy > 0.8:
                        st.warning("Getting close! Fine-tune your answer.")
                    elif accuracy > 0.5:
                        st.info("You're on the right track!")
        
        with tabs[4]:  # Analysis
            st.header("📊 Fluid Analysis Tools")
            
            tool = st.selectbox("Select Analysis Tool", 
                              ["Pipe Flow Calculator", "Buoyancy Calculator", 
                               "Drag Force Calculator", "Flow Rate Converter"])
            
            if tool == "Pipe Flow Calculator":
                st.subheader("Pipe Flow Analysis")
                
                col1, col2 = st.columns(2)
                with col1:
                    pipe_diameter = st.number_input("Pipe Diameter (m)", 0.01, 2.0, 0.1)
                    flow_velocity = st.number_input("Flow Velocity (m/s)", 0.1, 20.0, 2.0)
                    pipe_length = st.number_input("Pipe Length (m)", 1.0, 1000.0, 10.0)
                
                with col2:
                    fluid_density = st.number_input("Fluid Density (kg/m³)", 1.0, 15000.0, 1000.0)
                    fluid_viscosity = st.number_input("Dynamic Viscosity (Pa·s)", 0.0001, 10.0, 0.001)
                    roughness = st.number_input("Pipe Roughness (mm)", 0.0, 10.0, 0.05)
                
                if st.button("Calculate"):
                    # Calculate flow parameters
                    area = math.pi * (pipe_diameter/2)**2
                    flow_rate = flow_velocity * area
                    reynolds = fluid_density * flow_velocity * pipe_diameter / fluid_viscosity
                    
                    # Friction factor (simplified Colebrook equation)
                    if reynolds < 2300:
                        friction = 64 / reynolds
                    else:
                        friction = 0.02  # Simplified
                    
                    # Pressure drop
                    pressure_drop = friction * (pipe_length/pipe_diameter) * \
                                  (fluid_density * flow_velocity**2 / 2)
                    
                    # Display results
                    col1, col2, col3 = st.columns(3)
                    col1.metric("Flow Rate", f"{flow_rate:.3f} m³/s")
                    col2.metric("Reynolds Number", f"{reynolds:.0f}")
                    col3.metric("Pressure Drop", f"{pressure_drop:.0f} Pa")
                    
                    # Flow regime
                    if reynolds < 2300:
                        st.success("✅ Laminar Flow")
                    elif reynolds < 4000:
                        st.warning("⚠️ Transitional Flow")
                    else:
                        st.error("🌀 Turbulent Flow")
            
            elif tool == "Buoyancy Calculator":
                st.subheader("Buoyancy Force Analysis")
                
                col1, col2 = st.columns(2)
                with col1:
                    obj_volume = st.number_input("Object Volume (m³)", 0.001, 100.0, 1.0)
                    obj_mass = st.number_input("Object Mass (kg)", 0.1, 10000.0, 500.0)
                
                with col2:
                    fluid_density = st.number_input("Fluid Density (kg/m³)", 1.0, 15000.0, 1000.0)
                    gravity = st.number_input("Gravity (m/s²)", 1.0, 20.0, 9.81)
                
                if st.button("Calculate Buoyancy"):
                    # Calculate forces
                    buoyant_force = fluid_density * obj_volume * gravity
                    weight = obj_mass * gravity
                    net_force = buoyant_force - weight
                    obj_density = obj_mass / obj_volume
                    
                    # Display results
                    col1, col2 = st.columns(2)
                    col1.metric("Buoyant Force", f"{buoyant_force:.1f} N")
                    col2.metric("Object Weight", f"{weight:.1f} N")
                    
                    st.metric("Net Force", f"{net_force:.1f} N")
                    
                    if net_force > 0:
                        st.success("🎈 Object will float!")
                        submerged = (obj_density / fluid_density) * 100
                        st.write(f"Submerged portion: {submerged:.1f}%")
                    elif net_force < 0:
                        st.error("⚓ Object will sink!")
                    else:
                        st.info("⚖️ Object is neutrally buoyant!")
        
        # Level progression
        if st.session_state.game_state['knowledge_points'] >= 50 * st.session_state.game_state['level']:
            st.sidebar.success(f"🎉 Level {st.session_state.game_state['level'] + 1} Unlocked!")
            if st.sidebar.button("Level Up!"):
                st.session_state.game_state['level'] += 1
                st.balloons()
                st.rerun()

if __name__ == "__main__":
    main()