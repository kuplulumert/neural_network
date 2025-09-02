import streamlit as st
import streamlit.components.v1 as components
import json
import random

# Page configuration
st.set_page_config(
    page_title="Pokemon Game Boy Adventure",
    page_icon="🎮",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Game Boy Color Palette
GB_COLORS = {
    'darkest': '#0f380f',
    'dark': '#306230', 
    'light': '#8bac0f',
    'lightest': '#9bbc0f'
}

# Initialize session state
if 'game_data' not in st.session_state:
    st.session_state.game_data = {
        'player_x': 320,
        'player_y': 240,
        'player_direction': 'down',
        'player_moving': False,
        'player_frame': 0,
        'wild_pokemon': [],
        'in_battle': False,
        'in_grass': False,
        'steps': 0,
        'player_name': 'Red',
        'badges': 0,
        'money': 3000,
        'pokemon_party': [],
        'map_offset_x': 0,
        'map_offset_y': 0
    }

# HTML5 Canvas Game Component
def create_game_canvas():
    # Read the HTML and JS files
    with open('game_canvas.html', 'r') as f:
        html_content = f.read()
    with open('game_engine.js', 'r') as f:
        js_content = f.read()
    
    # Embed JS directly in HTML
    game_html = html_content.replace('<script src="game_engine.js"></script>', 
                                     f'<script>{js_content}</script>')
    return game_html

# Streamlit App
def main():
    st.markdown("""
    <style>
        .stApp {
            background-color: #8bac0f;
        }
        h1, h2, h3 {
            color: #0f380f;
            font-family: monospace;
        }
    </style>
    """, unsafe_allow_html=True)
    
    st.title("🎮 Pokemon Game Boy Adventure")
    
    # Create tabs
    tab1, tab2, tab3 = st.tabs(["🎮 Play Game", "📖 Instructions", "📊 Stats"])
    
    with tab1:
        # Embed the game
        game_html = create_game_canvas()
        components.html(game_html, height=700, scrolling=False)
    
    with tab2:
        st.markdown("""
        ## 🎮 How to Play
        
        ### Controls:
        - **Arrow Keys / WASD**: Move your character
        - **A Button / Space / Enter**: Interact with NPCs and buildings
        - **B Button**: Cancel (coming soon)
        - **START / Escape**: Open menu
        
        ### Gameplay:
        1. **Explore the World**: Walk around using the D-pad or arrow keys
        2. **Tall Grass**: Wild Pokemon appear in tall grass (dark green areas)
        3. **Buildings**: 
           - 🏥 Pokemon Center: Heal your Pokemon
           - 🏪 Poke Mart: Buy items
           - 🏠 Houses: Talk to residents
        4. **NPCs**: Approach and press A to talk
        5. **Paths**: Brown paths connect different areas
        
        ### Features:
        - Authentic Game Boy Color graphics
        - Smooth pixel-perfect movement
        - Collision detection with buildings, trees, and water
        - Random Pokemon encounters in grass
        - Interactive NPCs with dialogue
        - Animated sprites and environment
        
        ### Tips:
        - Stay on paths to avoid wild Pokemon
        - Visit Pokemon Centers to heal
        - Talk to everyone for hints
        - Save your game often (START menu)
        """)
    
    with tab3:
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("### 🏆 Trainer Stats")
            st.metric("Steps Taken", st.session_state.game_data['steps'])
            st.metric("Badges", f"{st.session_state.game_data['badges']}/8")
            st.metric("Money", f"₽{st.session_state.game_data['money']}")
        
        with col2:
            st.markdown("### 🎒 Inventory")
            st.write("- Poke Balls: 5")
            st.write("- Potions: 3")
            st.write("- Rare Candy: 1")
            st.write("- Town Map: 1")
    
    # Footer
    st.markdown("---")
    st.markdown("*A faithful recreation of the Pokemon Game Boy experience in your browser!*")

if __name__ == "__main__":
    main()