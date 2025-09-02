import numpy as np
import math
import pygame
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class FluidProperties:
    """Properties of different fluids"""
    name: str
    density: float  # kg/m³
    viscosity: float  # Pa·s
    color: Tuple[int, int, int]
    
# Common fluid types
WATER = FluidProperties("Water", 1000, 0.001, (0, 100, 255))
OIL = FluidProperties("Oil", 900, 0.1, (200, 150, 0))
HONEY = FluidProperties("Honey", 1400, 10, (255, 200, 0))
AIR = FluidProperties("Air", 1.2, 0.000018, (200, 200, 255))
MERCURY = FluidProperties("Mercury", 13600, 0.0015, (192, 192, 192))

class FluidSimulation:
    """Advanced fluid dynamics simulation using Lattice Boltzmann Method (simplified)"""
    
    def __init__(self, width, height, scale=4):
        self.width = width // scale
        self.height = height // scale
        self.scale = scale
        
        # Velocity field
        self.vx = np.zeros((self.height, self.width))
        self.vy = np.zeros((self.height, self.width))
        
        # Pressure field
        self.pressure = np.zeros((self.height, self.width))
        
        # Density field
        self.density = np.ones((self.height, self.width))
        
        # Obstacles (1 = obstacle, 0 = fluid)
        self.obstacles = np.zeros((self.height, self.width))
        
        # Fluid properties
        self.fluid_type = WATER
        self.gravity = 9.81
        
        # Visualization
        self.show_vectors = False
        self.show_pressure = False
        self.show_streamlines = False
        
    def add_obstacle(self, x, y, radius):
        """Add a circular obstacle"""
        for i in range(max(0, y-radius), min(self.height, y+radius+1)):
            for j in range(max(0, x-radius), min(self.width, x+radius+1)):
                if math.sqrt((i-y)**2 + (j-x)**2) <= radius:
                    self.obstacles[i, j] = 1
                    
    def add_rectangular_obstacle(self, x, y, width, height):
        """Add a rectangular obstacle"""
        for i in range(max(0, y), min(self.height, y+height)):
            for j in range(max(0, x), min(self.width, x+width)):
                self.obstacles[i, j] = 1
    
    def add_flow_source(self, x, y, vx, vy):
        """Add a flow source at position"""
        if 0 <= x < self.width and 0 <= y < self.height:
            self.vx[y, x] = vx
            self.vy[y, x] = vy
            
    def step(self, dt=0.01):
        """Perform one simulation step"""
        # Store old values
        old_vx = self.vx.copy()
        old_vy = self.vy.copy()
        old_density = self.density.copy()
        
        # Advection (move fluid)
        for i in range(1, self.height-1):
            for j in range(1, self.width-1):
                if self.obstacles[i, j] == 0:
                    # Calculate where this fluid came from
                    x = j - old_vx[i, j] * dt
                    y = i - old_vy[i, j] * dt
                    
                    # Bilinear interpolation
                    x = max(0, min(self.width-1, x))
                    y = max(0, min(self.height-1, y))
                    
                    x0 = int(x)
                    x1 = min(x0 + 1, self.width-1)
                    y0 = int(y)
                    y1 = min(y0 + 1, self.height-1)
                    
                    sx = x - x0
                    sy = y - y0
                    
                    # Interpolate velocity
                    self.vx[i, j] = (1-sx)*(1-sy)*old_vx[y0, x0] + \
                                   sx*(1-sy)*old_vx[y0, x1] + \
                                   (1-sx)*sy*old_vx[y1, x0] + \
                                   sx*sy*old_vx[y1, x1]
                                   
                    self.vy[i, j] = (1-sx)*(1-sy)*old_vy[y0, x0] + \
                                   sx*(1-sy)*old_vy[y0, x1] + \
                                   (1-sx)*sy*old_vy[y1, x0] + \
                                   sx*sy*old_vy[y1, x1]
                    
                    # Add gravity
                    self.vy[i, j] += self.gravity * dt * 0.01
        
        # Diffusion (viscosity)
        visc = self.fluid_type.viscosity * 0.01
        for _ in range(2):  # Multiple iterations for stability
            new_vx = self.vx.copy()
            new_vy = self.vy.copy()
            
            for i in range(1, self.height-1):
                for j in range(1, self.width-1):
                    if self.obstacles[i, j] == 0:
                        new_vx[i, j] = (self.vx[i, j] + visc * dt * (
                            self.vx[i-1, j] + self.vx[i+1, j] +
                            self.vx[i, j-1] + self.vx[i, j+1]
                        )) / (1 + 4*visc*dt)
                        
                        new_vy[i, j] = (self.vy[i, j] + visc * dt * (
                            self.vy[i-1, j] + self.vy[i+1, j] +
                            self.vy[i, j-1] + self.vy[i, j+1]
                        )) / (1 + 4*visc*dt)
            
            self.vx = new_vx
            self.vy = new_vy
        
        # Pressure projection (ensure incompressibility)
        # Calculate divergence
        div = np.zeros((self.height, self.width))
        for i in range(1, self.height-1):
            for j in range(1, self.width-1):
                if self.obstacles[i, j] == 0:
                    div[i, j] = (self.vx[i, j+1] - self.vx[i, j-1]) / 2 + \
                               (self.vy[i+1, j] - self.vy[i-1, j]) / 2
        
        # Solve for pressure (simplified Poisson equation)
        for _ in range(10):  # Iterations
            new_pressure = self.pressure.copy()
            for i in range(1, self.height-1):
                for j in range(1, self.width-1):
                    if self.obstacles[i, j] == 0:
                        new_pressure[i, j] = (
                            self.pressure[i-1, j] + self.pressure[i+1, j] +
                            self.pressure[i, j-1] + self.pressure[i, j+1] -
                            div[i, j]
                        ) / 4
            self.pressure = new_pressure
        
        # Apply pressure correction
        for i in range(1, self.height-1):
            for j in range(1, self.width-1):
                if self.obstacles[i, j] == 0:
                    self.vx[i, j] -= (self.pressure[i, j+1] - self.pressure[i, j-1]) / 2
                    self.vy[i, j] -= (self.pressure[i+1, j] - self.pressure[i-1, j]) / 2
        
        # Boundary conditions
        self.apply_boundary_conditions()
    
    def apply_boundary_conditions(self):
        """Apply boundary conditions"""
        # No-slip boundaries (velocity = 0 at walls)
        self.vx[0, :] = 0
        self.vx[-1, :] = 0
        self.vx[:, 0] = 0
        self.vx[:, -1] = 0
        
        self.vy[0, :] = 0
        self.vy[-1, :] = 0
        self.vy[:, 0] = 0
        self.vy[:, -1] = 0
        
        # Obstacles
        for i in range(self.height):
            for j in range(self.width):
                if self.obstacles[i, j] == 1:
                    self.vx[i, j] = 0
                    self.vy[i, j] = 0
    
    def get_velocity_magnitude(self):
        """Calculate velocity magnitude field"""
        return np.sqrt(self.vx**2 + self.vy**2)
    
    def draw(self, screen, offset_x=0, offset_y=0):
        """Draw the fluid simulation"""
        # Draw velocity magnitude as color field
        vel_mag = self.get_velocity_magnitude()
        max_vel = np.max(vel_mag) + 0.001
        
        for i in range(self.height):
            for j in range(self.width):
                x = offset_x + j * self.scale
                y = offset_y + i * self.scale
                
                if self.obstacles[i, j] == 1:
                    # Draw obstacle
                    pygame.draw.rect(screen, (100, 100, 100), 
                                   (x, y, self.scale, self.scale))
                else:
                    # Color based on velocity or pressure
                    if self.show_pressure:
                        # Pressure visualization
                        p = self.pressure[i, j]
                        color_val = int(128 + p * 50)
                        color_val = max(0, min(255, color_val))
                        color = (color_val, color_val//2, 255-color_val)
                    else:
                        # Velocity visualization
                        vel = vel_mag[i, j] / max_vel
                        base_color = self.fluid_type.color
                        color = tuple(int(c * (0.3 + 0.7 * vel)) for c in base_color)
                    
                    pygame.draw.rect(screen, color, (x, y, self.scale, self.scale))
        
        # Draw velocity vectors
        if self.show_vectors:
            for i in range(0, self.height, 3):
                for j in range(0, self.width, 3):
                    if self.obstacles[i, j] == 0:
                        x = offset_x + j * self.scale + self.scale // 2
                        y = offset_y + i * self.scale + self.scale // 2
                        
                        vx = self.vx[i, j] * 10
                        vy = self.vy[i, j] * 10
                        
                        if abs(vx) > 0.1 or abs(vy) > 0.1:
                            end_x = x + vx
                            end_y = y + vy
                            pygame.draw.line(screen, (255, 255, 0), (x, y), (end_x, end_y), 1)
                            # Arrow head
                            pygame.draw.circle(screen, (255, 0, 0), (int(end_x), int(end_y)), 2)

class FluidPuzzle:
    """Base class for fluid dynamics puzzles"""
    
    def __init__(self, name, description, goal):
        self.name = name
        self.description = description
        self.goal = goal
        self.completed = False
        self.simulation = None
        
    def check_completion(self):
        """Check if puzzle is solved"""
        return False
    
    def reset(self):
        """Reset the puzzle"""
        self.completed = False

class FlowRatePuzzle(FluidPuzzle):
    """Puzzle about controlling flow rate through pipes"""
    
    def __init__(self):
        super().__init__(
            "Flow Rate Challenge",
            "Adjust the pipe diameter to achieve the target flow rate",
            "Match the flow rate to 5.0 ± 0.5 L/s"
        )
        self.pipe_diameter = 0.1  # meters
        self.target_flow_rate = 5.0  # L/s
        self.current_flow_rate = 0.0
        
    def calculate_flow_rate(self, velocity, diameter):
        """Calculate flow rate using Q = v * A"""
        area = math.pi * (diameter/2)**2
        return velocity * area * 1000  # Convert to L/s
    
    def check_completion(self):
        return abs(self.current_flow_rate - self.target_flow_rate) < 0.5

class BuoyancyPuzzle(FluidPuzzle):
    """Puzzle about buoyancy and floating objects"""
    
    def __init__(self):
        super().__init__(
            "Buoyancy Balance",
            "Adjust object density to make it float at the right level",
            "Make the object float with 50% submerged"
        )
        self.object_density = 500  # kg/m³
        self.fluid_density = 1000  # kg/m³ (water)
        self.submerged_fraction = 0.0
        
    def calculate_buoyancy(self):
        """Calculate how much of object is submerged"""
        if self.object_density < self.fluid_density:
            self.submerged_fraction = self.object_density / self.fluid_density
        else:
            self.submerged_fraction = 1.0  # Sinks
        return self.submerged_fraction
    
    def check_completion(self):
        self.calculate_buoyancy()
        return abs(self.submerged_fraction - 0.5) < 0.05

class ViscosityPuzzle(FluidPuzzle):
    """Puzzle about viscosity and flow resistance"""
    
    def __init__(self):
        super().__init__(
            "Viscosity Voyage",
            "Select the right fluid to reach the target in time",
            "Fluid must reach the end in 5-7 seconds"
        )
        self.selected_fluid = WATER
        self.flow_time = 0.0
        self.target_time = 6.0
        
    def calculate_flow_time(self):
        """Calculate time based on viscosity"""
        # Simplified: time proportional to viscosity
        self.flow_time = 3 + self.selected_fluid.viscosity * 2
        return self.flow_time
    
    def check_completion(self):
        self.calculate_flow_time()
        return 5.0 <= self.flow_time <= 7.0