# 🎮 Pokemon Adventure - Streamlit Edition

A Pokemon Leaf Green inspired MVP game built with Streamlit! Explore the world, catch Pokemon, battle wild creatures, and become a Pokemon Master - all in your web browser!

## 🎯 Core Features (MVP)

### ✅ Implemented Features

1. **Tile-Based World Exploration**
   - 20x15 tile world with various terrain types
   - Grass, tall grass, water, trees, rocks, paths
   - Pokemon Center, Poke Mart, and Gym buildings
   - Movement with arrow buttons

2. **Starter Pokemon Selection**
   - Choose between Bulbasaur, Charmander, or Squirtle
   - Each with unique types and moves

3. **Wild Pokemon Encounters**
   - 15% encounter rate in tall grass
   - 8 different wild Pokemon species
   - Random levels (2-5)

4. **Turn-Based Battle System**
   - Type effectiveness system
   - Damage calculation using simplified Pokemon formula
   - Move PP system
   - Battle log with action history

5. **Pokemon Catching Mechanics**
   - Use Poke Balls to catch wild Pokemon
   - Catch rate based on Pokemon's remaining HP
   - Caught Pokemon added to party or PC storage

6. **Experience & Leveling**
   - Gain EXP from defeating wild Pokemon
   - Automatic stat increases on level up
   - Level-based stat calculations

7. **Party Management**
   - Up to 6 Pokemon in party
   - View Pokemon stats, moves, and types
   - PC storage for additional Pokemon

8. **Pokedex System**
   - Track discovered and caught Pokemon
   - View base stats of caught species

9. **Pokemon Center**
   - Heal all Pokemon in party
   - Restore move PP

10. **Poke Mart**
    - Buy items with in-game money
    - Poke Balls, Potions, and other items

## 🎮 How to Play

### Starting the Game
1. Enter your trainer name
2. Choose your starter Pokemon
3. Begin your adventure!

### Controls
- **Arrow Buttons**: Move around the world
- **Action Button**: Interact with buildings
- **Battle Commands**:
  - Fight: Use Pokemon moves
  - Bag: Use items (Poke Balls)
  - Pokemon: Switch Pokemon (coming soon)
  - Run: Escape from battle

### Game Objectives
- Explore the Kanto region
- Catch wild Pokemon in tall grass
- Build your team of 6 Pokemon
- Level up your Pokemon through battles
- Complete your Pokedex
- Collect all 8 gym badges (coming soon)

## 🚀 Installation & Running

### Local Setup
1. Install Python 3.8+
2. Install dependencies:
```bash
pip install streamlit
```

3. Run the game:
```bash
streamlit run streamlit_app.py
```

4. Open browser to `http://localhost:8501`

### Deploy on Streamlit Cloud
1. Push to GitHub
2. Connect to Streamlit Cloud
3. Deploy with one click!

## 📊 Game Data

### Available Pokemon
- **Starters**: Bulbasaur, Charmander, Squirtle
- **Wild Pokemon**: Pikachu, Pidgey, Rattata, Caterpie, Oddish

### Type Chart
The game includes type effectiveness:
- Fire > Grass
- Water > Fire  
- Grass > Water
- Electric > Water
- And more type matchups!

### Items
- **Poke Ball**: Catch wild Pokemon
- **Potion**: Restore 20 HP
- **Super Potion**: Restore 50 HP
- **Antidote**: Cure poison

## 🎨 Game Design

### World Generation
- Procedurally generated world with:
  - Central crossroads with paths
  - Pokemon Center at the center
  - Tall grass patches for encounters
  - Natural obstacles (trees, rocks, water)
  - Buildings and landmarks

### Battle System
- Turn-based combat
- Speed determines turn order
- Type effectiveness multipliers
- Critical hit chances
- Status effects (coming soon)

### Progression System
- Level 1-100 progression
- Experience points from battles
- Stat growth on level up
- Move learning (coming soon)
- Evolution system (coming soon)

## 🔧 Technical Details

### Architecture
- **Frontend**: Streamlit web interface
- **Game Logic**: Python classes and dataclasses
- **State Management**: Streamlit session state
- **Data**: In-memory game state

### Key Components
- `Pokemon`: Dataclass for Pokemon stats and moves
- `Player`: Manages trainer data and inventory
- `World`: Generates and manages the game map
- `Battle`: Handles combat logic
- `Move`: Defines attack properties

## 🚧 Planned Features

### Coming Soon
- [ ] Pokemon switching in battle
- [ ] More Pokemon species (151 total)
- [ ] Evolution system
- [ ] Gym battles and badges
- [ ] Trainer battles
- [ ] Save/Load game
- [ ] Sound effects
- [ ] Animations
- [ ] Trading system
- [ ] Breeding system
- [ ] Berry farming
- [ ] Day/night cycle
- [ ] Weather effects

## 🎯 MVP Checklist

### Core Gameplay ✅
- [x] World exploration
- [x] Pokemon encounters
- [x] Battle system
- [x] Catching mechanics
- [x] Leveling system
- [x] Type effectiveness
- [x] Party management
- [x] Pokedex
- [x] Pokemon Center healing
- [x] Shop system

### Pokemon Features ✅
- [x] 8 Pokemon species
- [x] 4 types implemented
- [x] 2 moves per Pokemon
- [x] Stats system
- [x] Experience/leveling

### UI/UX ✅
- [x] Game Boy color scheme
- [x] Tile-based world view
- [x] Battle interface
- [x] Trainer card
- [x] Inventory display
- [x] Pokedex viewer

## 🎮 Tips for Players

1. **Save your Poke Balls** - Don't waste them on full HP Pokemon
2. **Explore tall grass** - Different areas may have different Pokemon
3. **Type matchups matter** - Use super effective moves for more damage
4. **Heal regularly** - Visit Pokemon Centers to keep your team healthy
5. **Level up** - Grind in tall grass to strengthen your team

## 🤝 Contributing

This is an MVP implementation. Contributions welcome for:
- Adding more Pokemon species
- Implementing evolution
- Creating gym leaders
- Adding new moves
- Improving battle AI
- Adding sound/music
- Creating sprites

## 📝 License

Fan-made educational project inspired by Pokemon Leaf Green.

---

**Gotta Catch 'Em All!** 🎮✨