import pygame
import sys
import math
import numpy as np
from enum import Enum
import json
import random

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 1024
SCREEN_HEIGHT = 768
TILE_SIZE = 32
FPS = 60

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
BLUE = (0, 100, 255)
LIGHT_BLUE = (100, 150, 255)
GREEN = (0, 255, 0)
DARK_GREEN = (0, 150, 0)
BROWN = (139, 69, 19)
GRAY = (128, 128, 128)
YELLOW = (255, 255, 0)
RED = (255, 0, 0)
CYAN = (0, 255, 255)

class Direction(Enum):
    UP = (0, -1)
    DOWN = (0, 1)
    LEFT = (-1, 0)
    RIGHT = (1, 0)

class TileType(Enum):
    GRASS = 0
    WATER = 1
    STONE = 2
    SAND = 3
    TREE = 4
    FLOWER = 5
    HOUSE = 6
    LAB = 7
    BRIDGE = 8
    FLUID_PUZZLE = 9

class Player:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.speed = 4
        self.direction = Direction.DOWN
        self.moving = False
        self.move_counter = 0
        self.sprite_index = 0
        self.knowledge_points = 0
        self.fluid_level = 1
        self.discovered_concepts = []
        
    def move(self, dx, dy):
        self.x += dx * self.speed
        self.y += dy * self.speed
        self.move_counter += 1
        if self.move_counter % 8 == 0:
            self.sprite_index = (self.sprite_index + 1) % 4
            
    def get_tile_position(self):
        return (int(self.x // TILE_SIZE), int(self.y // TILE_SIZE))
    
    def draw(self, screen, camera_x, camera_y):
        # Draw player as a colored circle with direction indicator
        screen_x = self.x - camera_x
        screen_y = self.y - camera_y
        
        # Main body
        pygame.draw.circle(screen, BLUE, (int(screen_x + TILE_SIZE//2), int(screen_y + TILE_SIZE//2)), 12)
        pygame.draw.circle(screen, WHITE, (int(screen_x + TILE_SIZE//2), int(screen_y + TILE_SIZE//2)), 10)
        
        # Direction indicator
        dir_x, dir_y = self.direction.value
        pygame.draw.circle(screen, RED, 
                         (int(screen_x + TILE_SIZE//2 + dir_x * 8), 
                          int(screen_y + TILE_SIZE//2 + dir_y * 8)), 3)

class FluidParticle:
    def __init__(self, x, y, vx=0, vy=0):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.pressure = 0
        self.density = 1000  # kg/m³ (water)
        
    def update(self, dt, particles, obstacles):
        # Simple SPH (Smoothed Particle Hydrodynamics) simulation
        # Calculate pressure and forces from nearby particles
        force_x = 0
        force_y = 0
        
        for other in particles:
            if other != self:
                dx = other.x - self.x
                dy = other.y - self.y
                dist = math.sqrt(dx*dx + dy*dy)
                
                if dist < 20 and dist > 0:  # Interaction radius
                    # Pressure force (simplified)
                    force = 50 / (dist * dist)
                    force_x -= (dx / dist) * force
                    force_y -= (dy / dist) * force
        
        # Apply gravity
        force_y += 200
        
        # Update velocity
        self.vx += force_x * dt
        self.vy += force_y * dt
        
        # Apply damping
        self.vx *= 0.99
        self.vy *= 0.99
        
        # Update position
        new_x = self.x + self.vx * dt
        new_y = self.y + self.vy * dt
        
        # Check boundaries and obstacles
        if new_x > 10 and new_x < SCREEN_WIDTH - 10:
            self.x = new_x
        else:
            self.vx *= -0.5
            
        if new_y > 10 and new_y < SCREEN_HEIGHT - 100:
            self.y = new_y
        else:
            self.vy *= -0.5
    
    def draw(self, screen, camera_x, camera_y):
        screen_x = int(self.x - camera_x)
        screen_y = int(self.y - camera_y)
        
        # Color based on velocity (shows flow)
        speed = math.sqrt(self.vx*self.vx + self.vy*self.vy)
        color_intensity = min(255, int(speed * 2))
        color = (0, 100 + color_intensity//2, 255 - color_intensity//2)
        
        pygame.draw.circle(screen, color, (screen_x, screen_y), 4)

class FluidLab:
    def __init__(self, x, y, width, height):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.particles = []
        self.obstacles = []
        self.active = False
        self.puzzle_type = "flow"  # flow, pressure, buoyancy, viscosity
        self.solved = False
        
    def activate(self):
        self.active = True
        self.particles = []
        # Create initial fluid particles
        for i in range(50):
            px = self.x + random.randint(50, self.width - 50)
            py = self.y + random.randint(50, 100)
            self.particles.append(FluidParticle(px, py))
    
    def update(self, dt):
        if self.active:
            for particle in self.particles:
                particle.update(dt, self.particles, self.obstacles)
    
    def draw(self, screen, camera_x, camera_y):
        if self.active:
            # Draw lab boundary
            lab_rect = pygame.Rect(self.x - camera_x, self.y - camera_y, self.width, self.height)
            pygame.draw.rect(screen, GRAY, lab_rect, 3)
            
            # Draw particles
            for particle in self.particles:
                particle.draw(screen, camera_x, camera_y)
            
            # Draw UI
            font = pygame.font.Font(None, 24)
            title = font.render(f"Fluid Lab: {self.puzzle_type.title()}", True, WHITE)
            screen.blit(title, (self.x - camera_x + 10, self.y - camera_y + 10))

class NPC:
    def __init__(self, x, y, name, dialogue, teaches=None):
        self.x = x
        self.y = y
        self.name = name
        self.dialogue = dialogue
        self.teaches = teaches  # Fluid concept this NPC teaches
        self.talked = False
        
    def draw(self, screen, camera_x, camera_y):
        screen_x = self.x - camera_x
        screen_y = self.y - camera_y
        
        # Draw NPC as a different colored circle
        pygame.draw.circle(screen, YELLOW, (int(screen_x + TILE_SIZE//2), int(screen_y + TILE_SIZE//2)), 12)
        pygame.draw.circle(screen, GREEN, (int(screen_x + TILE_SIZE//2), int(screen_y + TILE_SIZE//2)), 10)
        
        # Draw name
        font = pygame.font.Font(None, 20)
        name_text = font.render(self.name, True, WHITE)
        screen.blit(name_text, (screen_x, screen_y - 20))

class World:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.tiles = [[TileType.GRASS for _ in range(width)] for _ in range(height)]
        self.npcs = []
        self.fluid_labs = []
        self.generate_world()
        
    def generate_world(self):
        # Create a more interesting world with different areas
        
        # Add a river
        river_y = self.height // 2
        for x in range(self.width):
            for y in range(river_y - 2, river_y + 3):
                if 0 <= y < self.height:
                    self.tiles[y][x] = TileType.WATER
                    
        # Add bridges
        for bridge_x in [10, 25, 40]:
            if bridge_x < self.width:
                for y in range(river_y - 2, river_y + 3):
                    if 0 <= y < self.height:
                        self.tiles[y][bridge_x] = TileType.BRIDGE
        
        # Add some trees
        for _ in range(50):
            tx = random.randint(1, self.width - 2)
            ty = random.randint(1, self.height - 2)
            if self.tiles[ty][tx] == TileType.GRASS:
                self.tiles[ty][tx] = TileType.TREE
                
        # Add flowers
        for _ in range(30):
            fx = random.randint(0, self.width - 1)
            fy = random.randint(0, self.height - 1)
            if self.tiles[fy][fx] == TileType.GRASS:
                self.tiles[fy][fx] = TileType.FLOWER
        
        # Add sand near water
        for y in range(self.height):
            for x in range(self.width):
                if self.tiles[y][x] == TileType.WATER:
                    for dy in [-3, 3]:
                        if 0 <= y + dy < self.height and self.tiles[y + dy][x] == TileType.GRASS:
                            if random.random() < 0.3:
                                self.tiles[y + dy][x] = TileType.SAND
        
        # Add lab buildings
        lab_positions = [(5, 5), (35, 8), (20, 35), (45, 25)]
        for lx, ly in lab_positions:
            if lx < self.width - 2 and ly < self.height - 2:
                for dy in range(3):
                    for dx in range(3):
                        self.tiles[ly + dy][lx + dx] = TileType.LAB
                        
                # Create fluid lab
                lab = FluidLab(lx * TILE_SIZE, ly * TILE_SIZE, 300, 300)
                lab.puzzle_type = random.choice(["flow", "pressure", "buoyancy", "viscosity"])
                self.fluid_labs.append(lab)
        
        # Add NPCs
        self.npcs = [
            NPC(6 * TILE_SIZE, 6 * TILE_SIZE, "Prof. Bernoulli", 
                ["Welcome to the Fluid Dynamics World!", 
                 "I study how fluids flow through pipes.",
                 "Did you know pressure and velocity are related?"],
                teaches="bernoulli_principle"),
            
            NPC(36 * TILE_SIZE, 9 * TILE_SIZE, "Dr. Reynolds", 
                ["Hello young scientist!",
                 "I research turbulence and laminar flow.",
                 "The Reynolds number tells us about flow patterns!"],
                teaches="reynolds_number"),
            
            NPC(21 * TILE_SIZE, 36 * TILE_SIZE, "Marina", 
                ["The ocean is full of fluid dynamics!",
                 "Waves, currents, and tides all follow fluid laws.",
                 "Want to learn about buoyancy?"],
                teaches="buoyancy"),
            
            NPC(15 * TILE_SIZE, 15 * TILE_SIZE, "Apprentice Tim", 
                ["I'm learning about viscosity!",
                 "Some fluids are thick like honey.",
                 "Others flow easily like water."],
                teaches="viscosity"),
        ]
    
    def get_tile(self, x, y):
        tile_x = x // TILE_SIZE
        tile_y = y // TILE_SIZE
        if 0 <= tile_x < self.width and 0 <= tile_y < self.height:
            return self.tiles[tile_y][tile_x]
        return TileType.STONE
    
    def is_walkable(self, x, y):
        tile = self.get_tile(x, y)
        return tile not in [TileType.WATER, TileType.TREE, TileType.LAB]
    
    def draw(self, screen, camera_x, camera_y):
        # Calculate visible tile range
        start_x = max(0, camera_x // TILE_SIZE)
        start_y = max(0, camera_y // TILE_SIZE)
        end_x = min(self.width, (camera_x + SCREEN_WIDTH) // TILE_SIZE + 1)
        end_y = min(self.height, (camera_y + SCREEN_HEIGHT) // TILE_SIZE + 1)
        
        # Draw tiles
        for y in range(start_y, end_y):
            for x in range(start_x, end_x):
                screen_x = x * TILE_SIZE - camera_x
                screen_y = y * TILE_SIZE - camera_y
                tile = self.tiles[y][x]
                
                # Draw tile based on type
                if tile == TileType.GRASS:
                    pygame.draw.rect(screen, GREEN, (screen_x, screen_y, TILE_SIZE, TILE_SIZE))
                    # Add some texture
                    for _ in range(3):
                        gx = screen_x + random.randint(2, TILE_SIZE-2)
                        gy = screen_y + random.randint(2, TILE_SIZE-2)
                        pygame.draw.circle(screen, DARK_GREEN, (gx, gy), 1)
                        
                elif tile == TileType.WATER:
                    pygame.draw.rect(screen, BLUE, (screen_x, screen_y, TILE_SIZE, TILE_SIZE))
                    # Animated water effect
                    wave_offset = (pygame.time.get_ticks() // 100) % 8
                    pygame.draw.rect(screen, LIGHT_BLUE, 
                                   (screen_x + wave_offset, screen_y + wave_offset, 
                                    TILE_SIZE - wave_offset*2, TILE_SIZE - wave_offset*2))
                    
                elif tile == TileType.STONE:
                    pygame.draw.rect(screen, GRAY, (screen_x, screen_y, TILE_SIZE, TILE_SIZE))
                    
                elif tile == TileType.SAND:
                    pygame.draw.rect(screen, YELLOW, (screen_x, screen_y, TILE_SIZE, TILE_SIZE))
                    
                elif tile == TileType.TREE:
                    pygame.draw.rect(screen, GREEN, (screen_x, screen_y, TILE_SIZE, TILE_SIZE))
                    pygame.draw.rect(screen, BROWN, (screen_x + 12, screen_y + 20, 8, 12))
                    pygame.draw.circle(screen, DARK_GREEN, (screen_x + 16, screen_y + 12), 10)
                    
                elif tile == TileType.FLOWER:
                    pygame.draw.rect(screen, GREEN, (screen_x, screen_y, TILE_SIZE, TILE_SIZE))
                    colors = [RED, YELLOW, WHITE, (255, 192, 203)]
                    pygame.draw.circle(screen, random.choice(colors), 
                                     (screen_x + 16, screen_y + 16), 4)
                    
                elif tile == TileType.LAB:
                    pygame.draw.rect(screen, GRAY, (screen_x, screen_y, TILE_SIZE, TILE_SIZE))
                    pygame.draw.rect(screen, WHITE, (screen_x + 2, screen_y + 2, 
                                                    TILE_SIZE - 4, TILE_SIZE - 4), 2)
                    
                elif tile == TileType.BRIDGE:
                    pygame.draw.rect(screen, BROWN, (screen_x, screen_y, TILE_SIZE, TILE_SIZE))
                    # Draw planks
                    for i in range(0, TILE_SIZE, 8):
                        pygame.draw.line(screen, BLACK, (screen_x, screen_y + i), 
                                       (screen_x + TILE_SIZE, screen_y + i))

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Fluid Dynamics Adventure")
        self.clock = pygame.time.Clock()
        self.running = True
        
        # Game objects
        self.world = World(60, 50)
        self.player = Player(10 * TILE_SIZE, 10 * TILE_SIZE)
        self.camera_x = 0
        self.camera_y = 0
        
        # UI
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        self.show_dialogue = False
        self.current_dialogue = []
        self.dialogue_index = 0
        self.current_npc = None
        
        # Fluid simulation
        self.active_lab = None
        
    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.active_lab:
                        self.active_lab.active = False
                        self.active_lab = None
                    else:
                        self.running = False
                        
                elif event.key == pygame.K_SPACE:
                    if self.show_dialogue:
                        self.dialogue_index += 1
                        if self.dialogue_index >= len(self.current_dialogue):
                            self.show_dialogue = False
                            self.dialogue_index = 0
                            if self.current_npc and self.current_npc.teaches:
                                if self.current_npc.teaches not in self.player.discovered_concepts:
                                    self.player.discovered_concepts.append(self.current_npc.teaches)
                                    self.player.knowledge_points += 10
                    else:
                        self.interact()
                        
                elif event.key == pygame.K_e:
                    # Activate nearby fluid lab
                    for lab in self.world.fluid_labs:
                        if abs(self.player.x - lab.x) < 100 and abs(self.player.y - lab.y) < 100:
                            if not lab.active:
                                lab.activate()
                                self.active_lab = lab
    
    def interact(self):
        # Check for nearby NPCs
        for npc in self.world.npcs:
            if abs(self.player.x - npc.x) < 50 and abs(self.player.y - npc.y) < 50:
                self.show_dialogue = True
                self.current_dialogue = npc.dialogue
                self.dialogue_index = 0
                self.current_npc = npc
                npc.talked = True
                break
    
    def update(self):
        dt = self.clock.tick(FPS) / 1000.0
        
        # Player movement
        keys = pygame.key.get_pressed()
        dx, dy = 0, 0
        
        if not self.show_dialogue and not self.active_lab:
            if keys[pygame.K_w] or keys[pygame.K_UP]:
                dy = -1
                self.player.direction = Direction.UP
            elif keys[pygame.K_s] or keys[pygame.K_DOWN]:
                dy = 1
                self.player.direction = Direction.DOWN
            elif keys[pygame.K_a] or keys[pygame.K_LEFT]:
                dx = -1
                self.player.direction = Direction.LEFT
            elif keys[pygame.K_d] or keys[pygame.K_RIGHT]:
                dx = 1
                self.player.direction = Direction.RIGHT
            
            # Check if movement is valid
            new_x = self.player.x + dx * self.player.speed
            new_y = self.player.y + dy * self.player.speed
            
            # Check all corners of the player
            can_move = True
            for corner_x in [new_x, new_x + TILE_SIZE - 1]:
                for corner_y in [new_y, new_y + TILE_SIZE - 1]:
                    if not self.world.is_walkable(corner_x, corner_y):
                        can_move = False
                        break
            
            if can_move:
                self.player.move(dx, dy)
        
        # Update camera to follow player
        self.camera_x = self.player.x - SCREEN_WIDTH // 2
        self.camera_y = self.player.y - SCREEN_HEIGHT // 2
        
        # Clamp camera to world bounds
        self.camera_x = max(0, min(self.camera_x, self.world.width * TILE_SIZE - SCREEN_WIDTH))
        self.camera_y = max(0, min(self.camera_y, self.world.height * TILE_SIZE - SCREEN_HEIGHT))
        
        # Update fluid labs
        for lab in self.world.fluid_labs:
            lab.update(dt)
    
    def draw_ui(self):
        # Draw HUD
        hud_surface = pygame.Surface((SCREEN_WIDTH, 60))
        hud_surface.set_alpha(200)
        hud_surface.fill(BLACK)
        self.screen.blit(hud_surface, (0, 0))
        
        # Player stats
        stats_text = self.small_font.render(
            f"Knowledge Points: {self.player.knowledge_points} | "
            f"Fluid Level: {self.player.fluid_level} | "
            f"Concepts: {len(self.player.discovered_concepts)}", 
            True, WHITE
        )
        self.screen.blit(stats_text, (10, 10))
        
        # Instructions
        inst_text = self.small_font.render(
            "WASD/Arrows: Move | SPACE: Talk/Interact | E: Enter Lab | ESC: Exit", 
            True, CYAN
        )
        self.screen.blit(inst_text, (10, 35))
        
        # Dialogue box
        if self.show_dialogue and self.current_dialogue:
            dialogue_surface = pygame.Surface((SCREEN_WIDTH - 100, 150))
            dialogue_surface.set_alpha(230)
            dialogue_surface.fill(BLACK)
            self.screen.blit(dialogue_surface, (50, SCREEN_HEIGHT - 200))
            
            # Draw dialogue text
            if self.dialogue_index < len(self.current_dialogue):
                text = self.current_dialogue[self.dialogue_index]
                dialogue_text = self.small_font.render(text, True, WHITE)
                self.screen.blit(dialogue_text, (70, SCREEN_HEIGHT - 170))
                
                # Show continue prompt
                continue_text = self.small_font.render("Press SPACE to continue...", True, YELLOW)
                self.screen.blit(continue_text, (70, SCREEN_HEIGHT - 80))
        
        # Show discovered concepts
        if self.player.discovered_concepts:
            concepts_surface = pygame.Surface((200, 30 + len(self.player.discovered_concepts) * 25))
            concepts_surface.set_alpha(180)
            concepts_surface.fill(BLACK)
            self.screen.blit(concepts_surface, (SCREEN_WIDTH - 220, 70))
            
            concepts_title = self.small_font.render("Learned Concepts:", True, YELLOW)
            self.screen.blit(concepts_title, (SCREEN_WIDTH - 210, 80))
            
            for i, concept in enumerate(self.player.discovered_concepts):
                concept_text = self.small_font.render(f"• {concept.replace('_', ' ').title()}", True, WHITE)
                self.screen.blit(concept_text, (SCREEN_WIDTH - 210, 105 + i * 25))
    
    def draw(self):
        self.screen.fill(BLACK)
        
        # Draw world
        self.world.draw(self.screen, self.camera_x, self.camera_y)
        
        # Draw NPCs
        for npc in self.world.npcs:
            npc.draw(self.screen, self.camera_x, self.camera_y)
        
        # Draw player
        self.player.draw(self.screen, self.camera_x, self.camera_y)
        
        # Draw fluid labs
        for lab in self.world.fluid_labs:
            if lab.active:
                lab.draw(self.screen, self.camera_x, self.camera_y)
        
        # Draw UI on top
        self.draw_ui()
        
        pygame.display.flip()
    
    def run(self):
        while self.running:
            self.handle_events()
            self.update()
            self.draw()
        
        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = Game()
    game.run()