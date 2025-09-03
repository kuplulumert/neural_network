import streamlit as st
import streamlit.components.v1 as components
import base64

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
</style>
""", unsafe_allow_html=True)

# GBA Game HTML
GBA_GAME_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: transparent;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Press Start 2P', cursive;
        }
        
        .gba-sp {
            position: relative;
            background: linear-gradient(180deg, #c0c5ce 0%, #a7adba 100%);
            width: 520px;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 
                0 10px 40px rgba(0,0,0,0.4),
                inset 0 2px 2px rgba(255,255,255,0.5),
                inset 0 -2px 2px rgba(0,0,0,0.3);
        }
        
        .screen-frame {
            background: #1a1a1a;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 
                inset 0 2px 5px rgba(0,0,0,0.8),
                0 1px 1px rgba(255,255,255,0.3);
        }
        
        #gba-screen {
            width: 480px;
            height: 320px;
            background: #000;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
            border: 2px solid #000;
            position: relative;
        }
        
        .nintendo-logo {
            position: absolute;
            top: 5px;
            left: 50%;
            transform: translateX(-50%);
            color: #4a5568;
            font-size: 8px;
            letter-spacing: 2px;
        }
        
        .power-led {
            position: absolute;
            top: 5px;
            right: 10px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #48bb78;
            box-shadow: 0 0 10px #48bb78;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        
        .controls {
            margin-top: 20px;
            position: relative;
            height: 140px;
        }
        
        .dpad {
            position: absolute;
            left: 40px;
            top: 30px;
            width: 80px;
            height: 80px;
        }
        
        .dpad-button {
            position: absolute;
            background: #4a5568;
            border: none;
            box-shadow: 
                0 2px 4px rgba(0,0,0,0.4),
                inset 0 1px 2px rgba(255,255,255,0.2);
            cursor: pointer;
            transition: all 0.1s;
        }
        
        .dpad-button:active {
            transform: scale(0.95);
            box-shadow: 
                0 1px 2px rgba(0,0,0,0.4),
                inset 0 1px 1px rgba(0,0,0,0.2);
        }
        
        .dpad-up, .dpad-down {
            width: 26px;
            height: 35px;
            left: 27px;
        }
        
        .dpad-up {
            top: 0;
            border-radius: 4px 4px 0 0;
        }
        
        .dpad-down {
            bottom: 0;
            border-radius: 0 0 4px 4px;
        }
        
        .dpad-left, .dpad-right {
            width: 35px;
            height: 26px;
            top: 27px;
        }
        
        .dpad-left {
            left: 0;
            border-radius: 4px 0 0 4px;
        }
        
        .dpad-right {
            right: 0;
            border-radius: 0 4px 4px 0;
        }
        
        .dpad-center {
            width: 26px;
            height: 26px;
            left: 27px;
            top: 27px;
            background: #2d3748;
            pointer-events: none;
        }
        
        .ab-buttons {
            position: absolute;
            right: 30px;
            top: 40px;
        }
        
        .btn-a, .btn-b {
            position: absolute;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #4a5568;
            border: none;
            color: #a7adba;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 
                0 3px 6px rgba(0,0,0,0.4),
                inset 0 1px 2px rgba(255,255,255,0.2);
            cursor: pointer;
            transition: all 0.1s;
        }
        
        .btn-a:active, .btn-b:active {
            transform: scale(0.95);
        }
        
        .btn-a {
            right: 0;
            top: 0;
        }
        
        .btn-b {
            right: 45px;
            top: 15px;
        }
        
        .start-select {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .btn-start, .btn-select {
            width: 50px;
            height: 20px;
            margin: 0 5px;
            border: none;
            border-radius: 10px;
            background: #4a5568;
            color: #a7adba;
            font-size: 8px;
            box-shadow: 
                0 2px 4px rgba(0,0,0,0.4),
                inset 0 1px 1px rgba(255,255,255,0.2);
            cursor: pointer;
        }
        
        canvas {
            display: block;
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div class="gba-sp">
        <div class="nintendo-logo">NINTENDO</div>
        <div class="power-led"></div>
        
        <div class="screen-frame">
            <canvas id="gba-screen" width="240" height="160"></canvas>
        </div>
        
        <div class="controls">
            <div class="dpad">
                <button class="dpad-button dpad-up" data-dir="up"></button>
                <button class="dpad-button dpad-down" data-dir="down"></button>
                <button class="dpad-button dpad-left" data-dir="left"></button>
                <button class="dpad-button dpad-right" data-dir="right"></button>
                <div class="dpad-button dpad-center"></div>
            </div>
            
            <div class="ab-buttons">
                <button class="btn-a">A</button>
                <button class="btn-b">B</button>
            </div>
            
            <div class="start-select">
                <button class="btn-select">SELECT</button>
                <button class="btn-start">START</button>
            </div>
        </div>
    </div>
    
    <script>
        const canvas = document.getElementById('gba-screen');
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // GBA Resolution
        const GBA_WIDTH = 240;
        const GBA_HEIGHT = 160;
        
        // Pokemon GBA Color Palette
        const colors = {
            black: '#081820',
            darkGreen: '#346856',
            green: '#88c070',
            lightGreen: '#b8d8b8',
            brown: '#7c6c48',
            lightBrown: '#b8a088',
            red: '#d03050',
            blue: '#3088d0',
            white: '#e0f8d0',
            gray: '#686868'
        };
        
        // Game State
        const game = {
            player: {
                x: 120,
                y: 80,
                facing: 'down',
                frame: 0,
                moving: false,
                moveTimer: 0
            },
            camera: { x: 0, y: 0 },
            map: {
                width: 30,
                height: 20,
                tileSize: 16,
                tiles: []
            },
            keys: {},
            menuOpen: false
        };
        
        // Initialize map
        function initMap() {
            for (let y = 0; y < game.map.height; y++) {
                game.map.tiles[y] = [];
                for (let x = 0; x < game.map.width; x++) {
                    let tile = 'grass';
                    
                    // Add paths
                    if (x === 15 || y === 10) tile = 'path';
                    
                    // Add trees border
                    if (x === 0 || x === game.map.width - 1 || 
                        y === 0 || y === game.map.height - 1) {
                        tile = 'tree';
                    }
                    
                    // Add tall grass patches
                    if ((x > 3 && x < 8 && y > 3 && y < 7) ||
                        (x > 20 && x < 25 && y > 12 && y < 16)) {
                        tile = 'tallgrass';
                    }
                    
                    // Add a house
                    if (x >= 14 && x <= 16 && y >= 4 && y <= 6) {
                        tile = 'house';
                    }
                    
                    // Add water
                    if (x > 8 && x < 12 && y > 14 && y < 18) {
                        tile = 'water';
                    }
                    
                    game.map.tiles[y][x] = tile;
                }
            }
        }
        
        // Draw a single tile
        function drawTile(type, x, y) {
            const size = game.map.tileSize;
            
            switch(type) {
                case 'grass':
                    ctx.fillStyle = colors.green;
                    ctx.fillRect(x, y, size, size);
                    ctx.fillStyle = colors.darkGreen;
                    ctx.fillRect(x + 2, y + 2, 2, 2);
                    ctx.fillRect(x + 8, y + 4, 2, 2);
                    ctx.fillRect(x + 4, y + 10, 2, 2);
                    ctx.fillRect(x + 12, y + 8, 2, 2);
                    break;
                    
                case 'tallgrass':
                    ctx.fillStyle = colors.darkGreen;
                    ctx.fillRect(x, y, size, size);
                    ctx.fillStyle = colors.green;
                    for (let i = 0; i < 4; i++) {
                        ctx.fillRect(x + i*4, y + 4, 2, 8);
                        ctx.fillRect(x + i*4 + 2, y + 6, 2, 6);
                    }
                    break;
                    
                case 'path':
                    ctx.fillStyle = colors.lightBrown;
                    ctx.fillRect(x, y, size, size);
                    ctx.fillStyle = colors.brown;
                    ctx.fillRect(x + 3, y + 3, 1, 1);
                    ctx.fillRect(x + 10, y + 7, 1, 1);
                    ctx.fillRect(x + 6, y + 12, 1, 1);
                    break;
                    
                case 'tree':
                    ctx.fillStyle = colors.darkGreen;
                    ctx.fillRect(x, y, size, size);
                    ctx.fillStyle = colors.brown;
                    ctx.fillRect(x + 6, y + 10, 4, 6);
                    ctx.fillStyle = colors.green;
                    ctx.fillRect(x + 2, y + 2, 12, 10);
                    ctx.fillStyle = colors.darkGreen;
                    ctx.fillRect(x + 4, y, 8, 8);
                    break;
                    
                case 'water':
                    ctx.fillStyle = colors.blue;
                    ctx.fillRect(x, y, size, size);
                    const wave = Math.sin(Date.now() * 0.002 + x * 0.5) * 2;
                    ctx.fillStyle = '#4098e0';
                    ctx.fillRect(x + wave, y + 4, 4, 2);
                    ctx.fillRect(x + 8 + wave, y + 10, 4, 2);
                    break;
                    
                case 'house':
                    ctx.fillStyle = colors.lightBrown;
                    ctx.fillRect(x, y, size, size);
                    ctx.fillStyle = colors.red;
                    ctx.fillRect(x, y, size, 6);
                    if (x % 16 === 0 && y % 16 === 0) {
                        ctx.fillStyle = colors.brown;
                        ctx.fillRect(x + 6, y + 8, 4, 8);
                    }
                    break;
                    
                default:
                    ctx.fillStyle = colors.gray;
                    ctx.fillRect(x, y, size, size);
            }
        }
        
        // Draw player sprite
        function drawPlayer() {
            const x = game.player.x - game.camera.x;
            const y = game.player.y - game.camera.y;
            
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(x + 2, y + 14, 12, 4);
            
            // Legs
            ctx.fillStyle = colors.blue;
            if (game.player.moving) {
                const offset = Math.floor(game.player.moveTimer / 5) % 2;
                ctx.fillRect(x + 4 + offset, y + 10, 3, 6);
                ctx.fillRect(x + 9 - offset, y + 10, 3, 6);
            } else {
                ctx.fillRect(x + 4, y + 10, 3, 6);
                ctx.fillRect(x + 9, y + 10, 3, 6);
            }
            
            // Body
            ctx.fillStyle = colors.red;
            ctx.fillRect(x + 3, y + 6, 10, 6);
            
            // Arms
            ctx.fillStyle = '#f8c8a8';
            ctx.fillRect(x + 1, y + 7, 2, 4);
            ctx.fillRect(x + 13, y + 7, 2, 4);
            
            // Head
            ctx.fillStyle = '#f8c8a8';
            ctx.fillRect(x + 4, y + 2, 8, 6);
            
            // Hair/Hat
            ctx.fillStyle = colors.black;
            ctx.fillRect(x + 3, y, 10, 4);
            ctx.fillStyle = colors.red;
            ctx.fillRect(x + 3, y + 1, 10, 2);
            
            // Face direction
            ctx.fillStyle = colors.black;
            switch(game.player.facing) {
                case 'down':
                    ctx.fillRect(x + 5, y + 4, 2, 2);
                    ctx.fillRect(x + 9, y + 4, 2, 2);
                    break;
                case 'left':
                    ctx.fillRect(x + 4, y + 4, 2, 2);
                    break;
                case 'right':
                    ctx.fillRect(x + 10, y + 4, 2, 2);
                    break;
            }
        }
        
        // Update game logic
        function update() {
            if (!game.menuOpen) {
                let dx = 0, dy = 0;
                
                if (game.keys['ArrowUp'] || game.keys['w']) {
                    dy = -1;
                    game.player.facing = 'up';
                    game.player.moving = true;
                } else if (game.keys['ArrowDown'] || game.keys['s']) {
                    dy = 1;
                    game.player.facing = 'down';
                    game.player.moving = true;
                } else if (game.keys['ArrowLeft'] || game.keys['a']) {
                    dx = -1;
                    game.player.facing = 'left';
                    game.player.moving = true;
                } else if (game.keys['ArrowRight'] || game.keys['d']) {
                    dx = 1;
                    game.player.facing = 'right';
                    game.player.moving = true;
                } else {
                    game.player.moving = false;
                    game.player.moveTimer = 0;
                }
                
                if (game.player.moving) {
                    game.player.moveTimer++;
                    
                    const newX = game.player.x + dx * 2;
                    const newY = game.player.y + dy * 2;
                    
                    const tileX = Math.floor(newX / game.map.tileSize);
                    const tileY = Math.floor(newY / game.map.tileSize);
                    
                    if (tileX >= 0 && tileX < game.map.width &&
                        tileY >= 0 && tileY < game.map.height) {
                        const tile = game.map.tiles[tileY][tileX];
                        
                        if (tile !== 'tree' && tile !== 'water' && tile !== 'house') {
                            game.player.x = newX;
                            game.player.y = newY;
                        }
                    }
                }
            }
            
            // Update camera
            game.camera.x = game.player.x - GBA_WIDTH / 2;
            game.camera.y = game.player.y - GBA_HEIGHT / 2;
            game.camera.x = Math.max(0, Math.min(game.camera.x, 
                game.map.width * game.map.tileSize - GBA_WIDTH));
            game.camera.y = Math.max(0, Math.min(game.camera.y, 
                game.map.height * game.map.tileSize - GBA_HEIGHT));
        }
        
        // Main render function
        function render() {
            // Clear screen
            ctx.fillStyle = colors.lightGreen;
            ctx.fillRect(0, 0, GBA_WIDTH, GBA_HEIGHT);
            
            // Draw map
            const startX = Math.floor(game.camera.x / game.map.tileSize);
            const startY = Math.floor(game.camera.y / game.map.tileSize);
            const endX = Math.ceil((game.camera.x + GBA_WIDTH) / game.map.tileSize);
            const endY = Math.ceil((game.camera.y + GBA_HEIGHT) / game.map.tileSize);
            
            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    if (y >= 0 && y < game.map.height && 
                        x >= 0 && x < game.map.width) {
                        const screenX = x * game.map.tileSize - game.camera.x;
                        const screenY = y * game.map.tileSize - game.camera.y;
                        drawTile(game.map.tiles[y][x], screenX, screenY);
                    }
                }
            }
            
            // Draw player
            drawPlayer();
            
            // Draw UI
            if (game.menuOpen) {
                ctx.fillStyle = colors.white;
                ctx.fillRect(140, 10, 90, 140);
                ctx.strokeStyle = colors.black;
                ctx.lineWidth = 2;
                ctx.strokeRect(140, 10, 90, 140);
                
                ctx.fillStyle = colors.black;
                ctx.font = '8px monospace';
                ctx.fillText('POKEMON', 150, 30);
                ctx.fillText('BAG', 150, 50);
                ctx.fillText('PLAYER', 150, 70);
                ctx.fillText('SAVE', 150, 90);
                ctx.fillText('OPTION', 150, 110);
                ctx.fillText('EXIT', 150, 130);
            }
            
            // Location banner
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(5, 5, 80, 20);
            ctx.fillStyle = colors.white;
            ctx.font = 'bold 8px monospace';
            ctx.fillText('ROUTE 101', 10, 18);
        }
        
        // Game loop
        function gameLoop() {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }
        
        // Input handling
        document.addEventListener('keydown', (e) => {
            game.keys[e.key] = true;
            if (e.key === 'Escape') {
                game.menuOpen = !game.menuOpen;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            game.keys[e.key] = false;
        });
        
        // D-Pad controls
        document.querySelectorAll('.dpad-button').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                const dir = e.target.dataset.dir;
                if (dir === 'up') game.keys['ArrowUp'] = true;
                if (dir === 'down') game.keys['ArrowDown'] = true;
                if (dir === 'left') game.keys['ArrowLeft'] = true;
                if (dir === 'right') game.keys['ArrowRight'] = true;
            });
            
            btn.addEventListener('mouseup', (e) => {
                const dir = e.target.dataset.dir;
                if (dir === 'up') game.keys['ArrowUp'] = false;
                if (dir === 'down') game.keys['ArrowDown'] = false;
                if (dir === 'left') game.keys['ArrowLeft'] = false;
                if (dir === 'right') game.keys['ArrowRight'] = false;
            });
        });
        
        // Button controls
        document.querySelector('.btn-start').addEventListener('click', () => {
            game.menuOpen = !game.menuOpen;
        });
        
        document.querySelector('.btn-b').addEventListener('click', () => {
            game.menuOpen = false;
        });
        
        // Initialize and start
        initMap();
        gameLoop();
    </script>
</body>
</html>
"""

def main():
    st.title("🎮 Nintendo Game Boy Advance SP")
    st.markdown("<h3 style='text-align: center; color: rgba(255,255,255,0.8);'>Pokemon Ruby/Sapphire/Emerald Experience</h3>", unsafe_allow_html=True)
    
    # Create tabs
    tab1, tab2 = st.tabs(["🎮 Play Game", "📖 Game Guide"])
    
    with tab1:
        # Center the game
        col1, col2, col3 = st.columns([1, 3, 1])
        with col2:
            # Display the GBA game
            components.html(GBA_GAME_HTML, height=750, scrolling=False)
    
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
            
            **Keyboard Controls:**
            - **Arrow Keys / WASD**: Movement
            - **Enter / Space**: A button
            - **Escape**: Start button (menu)
            """)
        
        with col2:
            st.markdown("""
            ### 🗺️ Game World
            
            **Terrain Types:**
            - 🌿 **Grass**: Normal walking area
            - 🌾 **Tall Grass**: Wild Pokemon appear
            - 🛤️ **Path**: Safe from Pokemon
            - 🌳 **Trees**: Cannot pass through
            - 💧 **Water**: Need Surf to cross
            - 🏠 **Buildings**: Enter for services
            
            **Features:**
            - Authentic GBA 240x160 resolution
            - Pokemon-style sprite graphics
            - Smooth character movement
            - Menu system
            """)
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: rgba(255,255,255,0.8);'>
        <p>🎮 A faithful recreation of the Nintendo Game Boy Advance SP experience</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()