from pokemon_game import *

def main():
    st.title("🎮 Pokemon Adventure")
    
    # Initialize session state if not exists
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
    
    # Game state management
    game_state = st.session_state.game_state
    
    # Title screen
    if game_state['game_mode'] == 'title':
        st.markdown("### Welcome to the World of Pokemon!")
        st.markdown("*A Pokemon Leaf Green inspired adventure*")
        
        col1, col2 = st.columns(2)
        with col1:
            trainer_name = st.text_input("Enter your trainer name:", max_chars=12)
        
        with col2:
            st.write("Choose your starter Pokemon:")
            starter_choice = st.radio(
                "Starter",
                ["Bulbasaur 🌱", "Charmander 🔥", "Squirtle 💧"],
                horizontal=True
            )
        
        if st.button("Start Adventure", type="primary"):
            if trainer_name:
                # Create player
                player = Player(trainer_name)
                
                # Add starter Pokemon
                starter_map = {
                    "Bulbasaur 🌱": "Bulbasaur",
                    "Charmander 🔥": "Charmander",
                    "Squirtle 💧": "Squirtle"
                }
                starter = create_pokemon(starter_map[starter_choice], 5)
                player.add_pokemon(starter)
                
                game_state['player'] = player
                game_state['game_mode'] = 'overworld'
                st.rerun()
            else:
                st.error("Please enter a trainer name!")
    
    # Main game - Overworld
    elif game_state['game_mode'] == 'overworld':
        player = game_state['player']
        world = game_state['world']
        
        # Layout
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.markdown("### 🗺️ Kanto Region")
            
            # Display world view
            world_view = render_world_view(player, world)
            st.code(world_view, language=None)
            
            # Movement controls
            st.markdown("**Controls:**")
            col_up, col_down, col_left, col_right, col_action = st.columns(5)
            
            with col_up:
                if st.button("⬆️", key="up"):
                    if player.move(Direction.UP, world):
                        game_state['steps'] += 1
                        # Check for wild encounter
                        wild = world.get_wild_encounter(player.x, player.y)
                        if wild:
                            game_state['current_battle'] = Battle(player, wild)
                            game_state['game_mode'] = 'battle'
                            st.rerun()
            
            with col_down:
                if st.button("⬇️", key="down"):
                    if player.move(Direction.DOWN, world):
                        game_state['steps'] += 1
                        wild = world.get_wild_encounter(player.x, player.y)
                        if wild:
                            game_state['current_battle'] = Battle(player, wild)
                            game_state['game_mode'] = 'battle'
                            st.rerun()
            
            with col_left:
                if st.button("⬅️", key="left"):
                    if player.move(Direction.LEFT, world):
                        game_state['steps'] += 1
                        wild = world.get_wild_encounter(player.x, player.y)
                        if wild:
                            game_state['current_battle'] = Battle(player, wild)
                            game_state['game_mode'] = 'battle'
                            st.rerun()
            
            with col_right:
                if st.button("➡️", key="right"):
                    if player.move(Direction.RIGHT, world):
                        game_state['steps'] += 1
                        wild = world.get_wild_encounter(player.x, player.y)
                        if wild:
                            game_state['current_battle'] = Battle(player, wild)
                            game_state['game_mode'] = 'battle'
                            st.rerun()
            
            with col_action:
                current_tile = world.tiles[player.y][player.x]
                if current_tile == TileType.POKECENTER:
                    if st.button("🏥 Heal"):
                        player.heal_party()
                        st.success("Your Pokemon have been healed!")
                        time.sleep(1)
                        st.rerun()
                elif current_tile == TileType.MART:
                    if st.button("🛒 Shop"):
                        game_state['game_mode'] = 'shop'
                        st.rerun()
                elif current_tile == TileType.GYM:
                    if st.button("⚔️ Challenge"):
                        st.info("Gym battles coming soon!")
            
            # Location info
            location_names = {
                TileType.POKECENTER: "Pokemon Center",
                TileType.MART: "Poke Mart",
                TileType.GYM: "Pokemon Gym",
                TileType.TALL_GRASS: "Tall Grass (Wild Pokemon!)",
                TileType.PATH: "Route 1",
                TileType.GRASS: "Grassy Field"
            }
            current_location = location_names.get(current_tile, "Unknown Area")
            st.info(f"📍 Location: {current_location}")
        
        with col2:
            st.markdown("### 👤 Trainer Card")
            st.write(f"**Name:** {player.name}")
            st.write(f"**Money:** ¥{player.money}")
            st.write(f"**Badges:** {player.badges}/8")
            st.write(f"**Steps:** {game_state['steps']}")
            
            st.markdown("### 🎒 Party")
            if player.party:
                for i, pokemon in enumerate(player.party):
                    with st.expander(f"{pokemon.sprite} {pokemon.name} Lv.{pokemon.level}"):
                        st.progress(pokemon.hp / pokemon.max_hp)
                        st.write(f"HP: {pokemon.hp}/{pokemon.max_hp}")
                        st.write(f"Type: {pokemon.type1}" + (f"/{pokemon.type2}" if pokemon.type2 else ""))
                        st.write(f"EXP: {pokemon.exp}/{pokemon.exp_to_next}")
                        st.write("**Moves:**")
                        for move in pokemon.moves:
                            st.write(f"- {move.name} ({move.pp}/{move.max_pp} PP)")
            
            st.markdown("### 🎒 Bag")
            for item, count in player.items.items():
                if count > 0:
                    st.write(f"{item}: {count}")
            
            st.markdown("### 📖 Pokedex")
            caught_count = sum(1 for caught in player.pokedex.values() if caught)
            st.write(f"Caught: {caught_count}/{len(player.pokedex)}")
            
            if st.button("View Pokedex"):
                game_state['game_mode'] = 'pokedex'
                st.rerun()
    
    # Battle mode
    elif game_state['game_mode'] == 'battle':
        battle = game_state['current_battle']
        player = game_state['player']
        
        if not battle.battle_over:
            st.markdown("### ⚔️ Wild Pokemon appeared!")
            
            # Battle display
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("**Wild Pokemon**")
                st.write(f"{battle.wild_pokemon.sprite} {battle.wild_pokemon.name} Lv.{battle.wild_pokemon.level}")
                st.progress(max(0, battle.wild_pokemon.hp / battle.wild_pokemon.max_hp))
                st.write(f"HP: {battle.wild_pokemon.hp}/{battle.wild_pokemon.max_hp}")
            
            with col2:
                st.markdown("**Your Pokemon**")
                st.write(f"{battle.player_pokemon.sprite} {battle.player_pokemon.name} Lv.{battle.player_pokemon.level}")
                st.progress(max(0, battle.player_pokemon.hp / battle.player_pokemon.max_hp))
                st.write(f"HP: {battle.player_pokemon.hp}/{battle.player_pokemon.max_hp}")
            
            # Battle log
            if battle.battle_log:
                with st.expander("Battle Log", expanded=True):
                    for log in battle.battle_log[-5:]:
                        st.write(log)
            
            # Battle actions
            st.markdown("### What will you do?")
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                if st.button("⚔️ Fight", key="fight"):
                    # Show move selection
                    game_state['game_mode'] = 'move_select'
                    st.rerun()
            
            with col2:
                if st.button("🎒 Bag", key="bag"):
                    # Use Poke Ball
                    result = battle.player_turn("catch")
                    battle.battle_log.append(result)
                    
                    if not battle.battle_over:
                        # Wild Pokemon's turn
                        wild_result = battle.wild_turn()
                        if wild_result:
                            battle.battle_log.append(wild_result)
                        battle.check_battle_end()
                    
                    st.rerun()
            
            with col3:
                if st.button("🔄 Pokemon", key="pokemon"):
                    st.info("Pokemon switching coming soon!")
            
            with col4:
                if st.button("🏃 Run", key="run"):
                    result = battle.player_turn("run")
                    battle.battle_log.append(result)
                    st.rerun()
        
        else:
            # Battle ended
            st.markdown("### Battle Ended!")
            
            if battle.result == "won":
                st.success(f"You defeated wild {battle.wild_pokemon.name}!")
                st.balloons()
            elif battle.result == "caught":
                st.success(f"You caught {battle.wild_pokemon.name}!")
                st.balloons()
            elif battle.result == "lost":
                st.error(f"Your {battle.player_pokemon.name} fainted!")
            elif battle.result == "ran":
                st.info("Got away safely!")
            
            if st.button("Continue"):
                game_state['current_battle'] = None
                game_state['game_mode'] = 'overworld'
                st.rerun()
    
    # Move selection
    elif game_state['game_mode'] == 'move_select':
        battle = game_state['current_battle']
        
        st.markdown("### Choose a move:")
        
        for i, move in enumerate(battle.player_pokemon.moves):
            col1, col2, col3 = st.columns([3, 1, 1])
            with col1:
                if st.button(f"{move.name}", key=f"move_{i}"):
                    # Use the move
                    result = battle.player_turn("fight", i)
                    battle.battle_log.append(result)
                    
                    if not battle.check_battle_end():
                        # Wild Pokemon's turn
                        wild_result = battle.wild_turn()
                        if wild_result:
                            battle.battle_log.append(wild_result)
                        battle.check_battle_end()
                    
                    game_state['game_mode'] = 'battle'
                    st.rerun()
            with col2:
                st.write(f"Type: {move.type}")
            with col3:
                st.write(f"PP: {move.pp}/{move.max_pp}")
        
        if st.button("Back"):
            game_state['game_mode'] = 'battle'
            st.rerun()
    
    # Shop mode
    elif game_state['game_mode'] == 'shop':
        player = game_state['player']
        
        st.markdown("### 🏪 Poke Mart")
        st.write(f"Your money: ¥{player.money}")
        
        shop_items = {
            "Poke Ball": 200,
            "Potion": 300,
            "Super Potion": 700,
            "Antidote": 100
        }
        
        for item, price in shop_items.items():
            col1, col2, col3 = st.columns([2, 1, 1])
            with col1:
                st.write(f"{item}")
            with col2:
                st.write(f"¥{price}")
            with col3:
                if st.button(f"Buy", key=f"buy_{item}"):
                    if player.money >= price:
                        player.money -= price
                        player.items[item] = player.items.get(item, 0) + 1
                        st.success(f"Bought {item}!")
                        time.sleep(0.5)
                        st.rerun()
                    else:
                        st.error("Not enough money!")
        
        if st.button("Leave Shop"):
            game_state['game_mode'] = 'overworld'
            st.rerun()
    
    # Pokedex view
    elif game_state['game_mode'] == 'pokedex':
        player = game_state['player']
        
        st.markdown("### 📖 Pokedex")
        
        for species, data in POKEMON_DB.items():
            if player.pokedex.get(species, False):
                with st.expander(f"{data['sprite']} {species} - CAUGHT"):
                    st.write(f"Type: {data['type1']}" + (f"/{data['type2']}" if data['type2'] else ""))
                    st.write(f"Base Stats:")
                    st.write(f"- HP: {data['base_stats']['hp']}")
                    st.write(f"- Attack: {data['base_stats']['attack']}")
                    st.write(f"- Defense: {data['base_stats']['defense']}")
                    st.write(f"- Speed: {data['base_stats']['speed']}")
            else:
                st.write(f"??? - Not yet discovered")
        
        if st.button("Back"):
            game_state['game_mode'] = 'overworld'
            st.rerun()

if __name__ == "__main__":
    main()