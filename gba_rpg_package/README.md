# Tiny GBA-style RPG (Vanilla JS)

A miniature tile-based RPG scaffold with authentic **Game Boy Advance SP** rendering:

## Features

- **Native GBA Resolution**: Renders at 240×160 and upscales 3× with nearest-neighbor
- **BGR555 Color Quantization**: Authentic 15-bit color depth (5 bits per channel)
- **LCD Effects**: Subtle scanlines and sub-pixel grid for that authentic LCD feel
- **Procedural Assets**: Auto-generates tileset and sprites if PNGs are missing
- **Core RPG Mechanics**:
  - 16×16 tile-based world
  - Animated player sprite (4 directions, 3 frames)
  - NPC interaction
  - Collision detection
  - Smooth camera following
  - Dialogue system with typewriter effect
  - Auto-save via localStorage

## Controls

- **Move**: Arrow keys or WASD
- **Interact**: Z or Enter
- **Pause**: P
- **Reset**: R

## Quick Start

### Run Locally
Simply open `index.html` in a modern browser.

### Deploy on GitHub Pages
1. Push these files to a GitHub repository
2. Go to **Settings → Pages**
3. Under **Build and deployment**:
   - Source: **Deploy from branch**
   - Branch: `main` → `/ (root)`
4. Visit `https://<username>.github.io/<repo-name>/`

## Custom Art (Optional)

Place your own pixel art in the `assets/` folder:

- **tileset.png**: Grid of 16×16 tiles
  - Tile 0: Grass
  - Tile 1: Path
  - Tile 2: Tree (solid)
  - Tile 3: Flowers
  - Tile 4: Water (solid)
  - Tile 5: Tall grass

- **player.png**: Character sprite sheet
  - 4 rows (Down, Left, Right, Up)
  - 3 columns (idle, walk1, walk2)
  - Each frame: 16×24 pixels

If these files are missing, the game uses procedural fallbacks.

## Technical Details

- Pure vanilla JavaScript (no dependencies)
- HTML5 Canvas with dual-buffer rendering
- Integer-only scaling to prevent shimmer
- Authentic GBA color palette and effects
- Mobile-responsive (maintains integer scaling)

## License

This is a scaffold/template. Use it freely for your own projects.

> **Note**: Use original or properly licensed assets. Do not use Nintendo/Pokémon copyrighted art.
