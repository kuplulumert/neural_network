import streamlit as st
import random
import json
import time
from enum import Enum
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
import math

# Page config
st.set_page_config(
    page_title="Pokemon Adventure",
    page_icon="🎮",
    layout="wide"
)

# Custom CSS for Game Boy style
st.markdown("""
<style>
    .stButton > button {
        background-color: #8BAC0F;
        color: #0F380F;
        border: 2px solid #306230;
        font-family: monospace;
        font-weight: bold;
    }
    .pokemon-text {
        font-family: monospace;
        background-color: #9BBD0F;
        color: #0F380F;
        padding: 10px;
        border-radius: 5px;
        border: 2px solid #306230;
    }
</style>
""", unsafe_allow_html=True)

# Game constants
WORLD_WIDTH = 20
WORLD_HEIGHT = 15
VISION_RANGE = 5

class TileType(Enum):
    GRASS = "🌿"
    TALL_GRASS = "🌾"
    WATER = "💧"
    TREE = "🌳"
    ROCK = "🪨"
    PATH = "🟫"
    BUILDING = "🏠"
    POKECENTER = "🏥"
    MART = "🏪"
    GYM = "🏛️"
    FLOWER = "🌸"

class Direction(Enum):
    UP = (0, -1)
    DOWN = (0, 1)
    LEFT = (-1, 0)
    RIGHT = (1, 0)

# Pokemon type effectiveness
TYPE_CHART = {
    "Fire": {"Water": 0.5, "Grass": 2.0, "Fire": 0.5},
    "Water": {"Fire": 2.0, "Grass": 0.5, "Water": 0.5},
    "Grass": {"Water": 2.0, "Fire": 0.5, "Grass": 0.5},
    "Normal": {},
    "Electric": {"Water": 2.0, "Electric": 0.5, "Grass": 0.5},
    "Psychic": {"Psychic": 0.5},
    "Fighting": {"Normal": 2.0, "Psychic": 0.5},
    "Flying": {"Grass": 2.0, "Electric": 0.5, "Fighting": 2.0},
    "Bug": {"Grass": 2.0, "Fire": 0.5, "Psychic": 2.0},
    "Poison": {"Grass": 2.0, "Poison": 0.5}
}

@dataclass
class Move:
    name: str
    type: str
    power: int
    accuracy: int
    pp: int
    max_pp: int
    category: str  # "Physical", "Special", "Status"

@dataclass
class Pokemon:
    name: str
    species: str
    type1: str
    type2: Optional[str]
    level: int
    hp: int
    max_hp: int
    attack: int
    defense: int
    speed: int
    exp: int
    exp_to_next: int
    moves: List[Move]
    sprite: str
    
    def calculate_damage(self, move: Move, defender: 'Pokemon') -> int:
        """Calculate damage using simplified Pokemon formula"""
        # Type effectiveness
        effectiveness = 1.0
        if move.type in TYPE_CHART:
            if defender.type1 in TYPE_CHART[move.type]:
                effectiveness *= TYPE_CHART[move.type][defender.type1]
            if defender.type2 and defender.type2 in TYPE_CHART[move.type]:
                effectiveness *= TYPE_CHART[move.type][defender.type2]
        
        # Random factor
        random_factor = random.randint(85, 100) / 100
        
        # Simplified damage formula
        damage = ((2 * self.level / 5 + 2) * move.power * self.attack / defender.defense / 50 + 2) * effectiveness * random_factor
        
        return max(1, int(damage))
    
    def gain_exp(self, amount: int) -> bool:
        """Gain experience and check for level up"""
        self.exp += amount
        leveled_up = False
        
        while self.exp >= self.exp_to_next:
            self.exp -= self.exp_to_next
            self.level += 1
            leveled_up = True
            
            # Stat increases
            self.max_hp += random.randint(2, 5)
            self.hp = self.max_hp
            self.attack += random.randint(1, 3)
            self.defense += random.randint(1, 3)
            self.speed += random.randint(1, 3)
            
            # Next level exp requirement
            self.exp_to_next = self.level * 100
        
        return leveled_up

# Pokemon database
POKEMON_DB = {
    "Bulbasaur": {
        "type1": "Grass", "type2": "Poison",
        "base_stats": {"hp": 45, "attack": 49, "defense": 49, "speed": 45},
        "sprite": "🌱",
        "moves": [
            Move("Tackle", "Normal", 40, 100, 35, 35, "Physical"),
            Move("Vine Whip", "Grass", 45, 100, 25, 25, "Physical")
        ]
    },
    "Charmander": {
        "type1": "Fire", "type2": None,
        "base_stats": {"hp": 39, "attack": 52, "defense": 43, "speed": 65},
        "sprite": "🔥",
        "moves": [
            Move("Scratch", "Normal", 40, 100, 35, 35, "Physical"),
            Move("Ember", "Fire", 40, 100, 25, 25, "Special")
        ]
    },
    "Squirtle": {
        "type1": "Water", "type2": None,
        "base_stats": {"hp": 44, "attack": 48, "defense": 65, "speed": 43},
        "sprite": "💧",
        "moves": [
            Move("Tackle", "Normal", 40, 100, 35, 35, "Physical"),
            Move("Water Gun", "Water", 40, 100, 25, 25, "Special")
        ]
    },
    "Pikachu": {
        "type1": "Electric", "type2": None,
        "base_stats": {"hp": 35, "attack": 55, "defense": 40, "speed": 90},
        "sprite": "⚡",
        "moves": [
            Move("Quick Attack", "Normal", 40, 100, 30, 30, "Physical"),
            Move("Thunder Shock", "Electric", 40, 100, 30, 30, "Special")
        ]
    },
    "Pidgey": {
        "type1": "Normal", "type2": "Flying",
        "base_stats": {"hp": 40, "attack": 45, "defense": 40, "speed": 56},
        "sprite": "🦅",
        "moves": [
            Move("Tackle", "Normal", 40, 100, 35, 35, "Physical"),
            Move("Gust", "Flying", 40, 100, 35, 35, "Special")
        ]
    },
    "Rattata": {
        "type1": "Normal", "type2": None,
        "base_stats": {"hp": 30, "attack": 56, "defense": 35, "speed": 72},
        "sprite": "🐀",
        "moves": [
            Move("Tackle", "Normal", 40, 100, 35, 35, "Physical"),
            Move("Quick Attack", "Normal", 40, 100, 30, 30, "Physical")
        ]
    },
    "Caterpie": {
        "type1": "Bug", "type2": None,
        "base_stats": {"hp": 45, "attack": 30, "defense": 35, "speed": 45},
        "sprite": "🐛",
        "moves": [
            Move("Tackle", "Normal", 40, 100, 35, 35, "Physical"),
            Move("String Shot", "Bug", 0, 95, 40, 40, "Status")
        ]
    },
    "Oddish": {
        "type1": "Grass", "type2": "Poison",
        "base_stats": {"hp": 45, "attack": 50, "defense": 55, "speed": 30},
        "sprite": "🌿",
        "moves": [
            Move("Absorb", "Grass", 40, 100, 25, 25, "Special"),
            Move("Acid", "Poison", 40, 100, 30, 30, "Special")
        ]
    }
}

def create_pokemon(species: str, level: int) -> Pokemon:
    """Create a Pokemon instance from the database"""
    data = POKEMON_DB[species]
    stats = data["base_stats"]
    
    # Calculate stats based on level
    hp = stats["hp"] + (level * 2)
    attack = stats["attack"] + level
    defense = stats["defense"] + level
    speed = stats["speed"] + level
    
    return Pokemon(
        name=species,
        species=species,
        type1=data["type1"],
        type2=data["type2"],
        level=level,
        hp=hp,
        max_hp=hp,
        attack=attack,
        defense=defense,
        speed=speed,
        exp=0,
        exp_to_next=level * 100,
        moves=data["moves"].copy(),
        sprite=data["sprite"]
    )

class World:
    def __init__(self):
        self.tiles = [[TileType.GRASS for _ in range(WORLD_WIDTH)] for _ in range(WORLD_HEIGHT)]
        self.generate_world()
    
    def generate_world(self):
        """Generate a Pokemon-style world"""
        # Create paths
        for y in range(WORLD_HEIGHT):
            self.tiles[y][WORLD_WIDTH//2] = TileType.PATH
        for x in range(WORLD_WIDTH):
            self.tiles[WORLD_HEIGHT//2][x] = TileType.PATH
        
        # Add Pokemon Center
        self.tiles[WORLD_HEIGHT//2][WORLD_WIDTH//2] = TileType.POKECENTER
        
        # Add Poke Mart
        self.tiles[WORLD_HEIGHT//2 + 1][WORLD_WIDTH//2 + 1] = TileType.MART
        
        # Add Gym
        self.tiles[2][WORLD_WIDTH//2] = TileType.GYM
        
        # Add houses
        house_positions = [(3, 3), (3, WORLD_WIDTH-4), (WORLD_HEIGHT-4, 3), (WORLD_HEIGHT-4, WORLD_WIDTH-4)]
        for y, x in house_positions:
            if 0 <= y < WORLD_HEIGHT and 0 <= x < WORLD_WIDTH:
                self.tiles[y][x] = TileType.BUILDING
        
        # Add tall grass patches
        grass_patches = [
            (1, 1, 4, 4), (1, WORLD_WIDTH-5, 4, 4),
            (WORLD_HEIGHT-5, 1, 4, 4), (WORLD_HEIGHT-5, WORLD_WIDTH-5, 4, 4),
            (6, 2, 3, 5), (6, WORLD_WIDTH-7, 3, 5)
        ]
        for y, x, h, w in grass_patches:
            for dy in range(h):
                for dx in range(w):
                    if 0 <= y+dy < WORLD_HEIGHT and 0 <= x+dx < WORLD_WIDTH:
                        if self.tiles[y+dy][x+dx] == TileType.GRASS:
                            self.tiles[y+dy][x+dx] = TileType.TALL_GRASS
        
        # Add trees
        for _ in range(30):
            y, x = random.randint(0, WORLD_HEIGHT-1), random.randint(0, WORLD_WIDTH-1)
            if self.tiles[y][x] == TileType.GRASS:
                self.tiles[y][x] = TileType.TREE
        
        # Add rocks
        for _ in range(15):
            y, x = random.randint(0, WORLD_HEIGHT-1), random.randint(0, WORLD_WIDTH-1)
            if self.tiles[y][x] == TileType.GRASS:
                self.tiles[y][x] = TileType.ROCK
        
        # Add water
        water_y = random.randint(5, WORLD_HEIGHT-6)
        for x in range(3, 8):
            for dy in range(-1, 2):
                if 0 <= water_y + dy < WORLD_HEIGHT:
                    self.tiles[water_y + dy][x] = TileType.WATER
        
        # Add flowers
        for _ in range(20):
            y, x = random.randint(0, WORLD_HEIGHT-1), random.randint(0, WORLD_WIDTH-1)
            if self.tiles[y][x] == TileType.GRASS:
                self.tiles[y][x] = TileType.FLOWER
    
    def is_walkable(self, x: int, y: int) -> bool:
        """Check if a tile is walkable"""
        if not (0 <= x < WORLD_WIDTH and 0 <= y < WORLD_HEIGHT):
            return False
        tile = self.tiles[y][x]
        return tile not in [TileType.WATER, TileType.TREE, TileType.ROCK, TileType.BUILDING]
    
    def get_wild_encounter(self, x: int, y: int) -> Optional[Pokemon]:
        """Check for wild Pokemon encounter"""
        if self.tiles[y][x] == TileType.TALL_GRASS:
            if random.random() < 0.15:  # 15% encounter rate
                # Random wild Pokemon
                species = random.choice(["Pidgey", "Rattata", "Caterpie", "Oddish", "Pikachu"])
                level = random.randint(2, 5)
                return create_pokemon(species, level)
        return None

class Player:
    def __init__(self, name: str, x: int = WORLD_WIDTH//2, y: int = WORLD_HEIGHT//2):
        self.name = name
        self.x = x
        self.y = y
        self.party: List[Pokemon] = []
        self.pc_storage: List[Pokemon] = []
        self.pokedex: Dict[str, bool] = {species: False for species in POKEMON_DB.keys()}
        self.badges = 0
        self.money = 3000
        self.items = {
            "Poke Ball": 5,
            "Potion": 5,
            "Super Potion": 2,
            "Antidote": 2
        }
        self.sprite = "🚶"
    
    def move(self, direction: Direction, world: World) -> bool:
        """Move player in direction if possible"""
        dx, dy = direction.value
        new_x = self.x + dx
        new_y = self.y + dy
        
        if world.is_walkable(new_x, new_y):
            self.x = new_x
            self.y = new_y
            return True
        return False
    
    def add_pokemon(self, pokemon: Pokemon):
        """Add Pokemon to party or PC"""
        self.pokedex[pokemon.species] = True
        if len(self.party) < 6:
            self.party.append(pokemon)
        else:
            self.pc_storage.append(pokemon)
    
    def heal_party(self):
        """Heal all Pokemon in party"""
        for pokemon in self.party:
            pokemon.hp = pokemon.max_hp
            for move in pokemon.moves:
                move.pp = move.max_pp

class Battle:
    def __init__(self, player: Player, wild_pokemon: Pokemon):
        self.player = player
        self.wild_pokemon = wild_pokemon
        self.player_pokemon = player.party[0] if player.party else None
        self.turn = "player"
        self.battle_log = []
        self.battle_over = False
        self.result = None
    
    def use_move(self, attacker: Pokemon, defender: Pokemon, move: Move) -> str:
        """Execute a move in battle"""
        if move.pp <= 0:
            return f"{attacker.name} has no PP left for {move.name}!"
        
        move.pp -= 1
        
        # Check accuracy
        if random.randint(1, 100) > move.accuracy:
            return f"{attacker.name}'s {move.name} missed!"
        
        if move.category == "Status":
            return f"{attacker.name} used {move.name}!"
        
        # Calculate damage
        damage = attacker.calculate_damage(move, defender)
        defender.hp = max(0, defender.hp - damage)
        
        # Type effectiveness message
        effectiveness = 1.0
        if move.type in TYPE_CHART and defender.type1 in TYPE_CHART[move.type]:
            effectiveness = TYPE_CHART[move.type][defender.type1]
        
        effect_msg = ""
        if effectiveness > 1:
            effect_msg = " It's super effective!"
        elif effectiveness < 1:
            effect_msg = " It's not very effective..."
        
        return f"{attacker.name} used {move.name}! Dealt {damage} damage!{effect_msg}"
    
    def player_turn(self, action: str, move_index: int = 0) -> str:
        """Process player's turn"""
        if action == "fight":
            if move_index < len(self.player_pokemon.moves):
                move = self.player_pokemon.moves[move_index]
                return self.use_move(self.player_pokemon, self.wild_pokemon, move)
        
        elif action == "catch":
            if self.player.items.get("Poke Ball", 0) > 0:
                self.player.items["Poke Ball"] -= 1
                
                # Catch rate calculation
                catch_rate = (1 - self.wild_pokemon.hp / self.wild_pokemon.max_hp) * 0.5 + 0.3
                
                if random.random() < catch_rate:
                    self.player.add_pokemon(self.wild_pokemon)
                    self.battle_over = True
                    self.result = "caught"
                    return f"Gotcha! {self.wild_pokemon.name} was caught!"
                else:
                    return f"Oh no! The Pokemon broke free!"
            else:
                return "No Poke Balls left!"
        
        elif action == "run":
            if random.random() < 0.5:
                self.battle_over = True
                self.result = "ran"
                return "Got away safely!"
            else:
                return "Can't escape!"
        
        return ""
    
    def wild_turn(self) -> str:
        """Process wild Pokemon's turn"""
        if self.wild_pokemon.hp > 0:
            # Wild Pokemon uses random move
            available_moves = [m for m in self.wild_pokemon.moves if m.pp > 0]
            if available_moves:
                move = random.choice(available_moves)
                return self.use_move(self.wild_pokemon, self.player_pokemon, move)
        return ""
    
    def check_battle_end(self) -> bool:
        """Check if battle should end"""
        if self.player_pokemon.hp <= 0:
            self.battle_over = True
            self.result = "lost"
            return True
        elif self.wild_pokemon.hp <= 0:
            self.battle_over = True
            self.result = "won"
            # Give exp
            exp_gained = self.wild_pokemon.level * 20
            if self.player_pokemon.gain_exp(exp_gained):
                self.battle_log.append(f"{self.player_pokemon.name} leveled up to {self.player_pokemon.level}!")
            return True
        return False

# Initialize session state
if 'game_state' not in st.session_state:
    st.session_state.game_state = {
        'player': None,
        'world': World(),
        'current_battle': None,
        'game_mode': 'title',  # title, overworld, battle, menu
        'last_direction': Direction.DOWN,
        'steps': 0,
        'play_time': 0
    }

def render_world_view(player: Player, world: World):
    """Render the world around the player"""
    view = ""
    
    for dy in range(-VISION_RANGE, VISION_RANGE + 1):
        row = ""
        for dx in range(-VISION_RANGE, VISION_RANGE + 1):
            x = player.x + dx
            y = player.y + dy
            
            if dx == 0 and dy == 0:
                row += player.sprite + " "
            elif 0 <= x < WORLD_WIDTH and 0 <= y < WORLD_HEIGHT:
                row += world.tiles[y][x].value + " "
            else:
                row += "⬛ "
        view += row + "\n"
    
    return view