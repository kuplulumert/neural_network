import streamlit as st
import streamlit.components.v1 as components

# Page configuration  
st.set_page_config(
    page_title="Pokemon GBA SP",
    page_icon="🎮",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for page styling
st.markdown("""
<style>
    .stApp {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .main {
        padding-top: 2rem;
    }
    h1, h2, h3 {
        color: white !important;
        text-align: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 24px;
        background-color: rgba(255,255,255,0.1);
        padding: 10px;
        border-radius: 10px;
    }
    .stTabs [data-baseweb="tab"] {
        color: white;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

def main():
    st.title("🎮 Nintendo Game Boy Advance SP")
    st.markdown("<h3 style='text-align: center; color: rgba(255,255,255,0.8);'>Pokemon Ruby/Sapphire/Emerald Experience</h3>", unsafe_allow_html=True)
    
    # Create tabs
    tab1, tab2, tab3 = st.tabs(["🎮 Play Game", "📖 Game Guide", "🏆 Features"])
    
    with tab1:
        # Center the game
        col1, col2, col3 = st.columns([1, 3, 1])
        with col2:
            # Load and display the GBA game
            with open('gba_game.html', 'r') as f:
                game_html = f.read()
            
            components.html(game_html, height=800, scrolling=False)
    
    with tab2:
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            ### 🎮 Controls
            
            **Game Boy Advance SP Buttons:**
            - **D-Pad**: Move your character
            - **A Button**: Confirm / Interact
            - **B Button**: Cancel / Close menu
            - **START**: Open/Close game menu
            - **SELECT**: Additional options
            - **L/R**: Shoulder buttons (coming soon)
            
            **Keyboard Controls:**
            - **Arrow Keys / WASD**: Movement
            - **Enter / Space**: A button (confirm)
            - **Escape**: Start button (menu)
            - **Shift**: B button (cancel)
            """)
        
        with col2:
            st.markdown("""
            ### 🗺️ Game World
            
            **Terrain Types:**
            - 🌿 **Grass**: Normal walking area
            - 🌾 **Tall Grass**: Wild Pokemon appear (2% chance)
            - 🛤️ **Path**: Safe from Pokemon
            - 🌳 **Trees**: Cannot pass through
            - 💧 **Water**: Need Surf to cross
            - 🏠 **Buildings**: Enter for services
            
            **Tips:**
            - Save your game often using START menu
            - Tall grass has wild Pokemon encounters
            - Visit Pokemon Centers to heal
            """)
    
    with tab3:
        st.markdown("""
        ### 🌟 Authentic GBA SP Features
        
        This is an authentic recreation of the Nintendo Game Boy Advance SP experience:
        
        #### ✨ Visual Features
        - **240x160 pixel** authentic GBA resolution
        - **32-bit color** graphics like the real GBA
        - **Pixel-perfect** sprite rendering
        - **Authentic GBA SP silver shell** design
        - **Working power LED** with pulse animation
        - **Speaker grills** on both sides
        
        #### 🎮 Gameplay Features
        - **Pokemon Ruby/Sapphire/Emerald** style graphics
        - **Smooth character movement** with animations
        - **Tile-based world** (16x16 pixel tiles)
        - **Random Pokemon encounters** in tall grass
        - **Battle system** with menu interface
        - **Camera following** with boundary limits
        - **Collision detection** for obstacles
        
        #### 🎨 Technical Specs
        - **Authentic color palette** from Pokemon GBA games
        - **Proper sprite layering** system
        - **60 FPS** smooth gameplay
        - **Touch-friendly** controls for mobile
        - **Responsive D-Pad** with visual feedback
        
        #### 🏆 Pokemon Features
        - Character sprite based on Pokemon trainer
        - Walking animations with leg movement
        - Direction facing indicators
        - Shadow under character
        - Menu system like real Pokemon games
        - Route/location display
        - Battle encounter system
        
        This is a faithful recreation of playing Pokemon on a real Game Boy Advance SP!
        """)
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: rgba(255,255,255,0.8);'>
        <p>🎮 A faithful recreation of the Nintendo Game Boy Advance SP experience</p>
        <p style='font-size: 12px;'>Nintendo, Game Boy Advance, and Pokemon are trademarks of Nintendo Co., Ltd.</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()