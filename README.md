# Tiny GBA-style RPG (Vanilla JS)

A miniature tile-based RPG scaffold with:
- 16×16 tileset, animated sprites, camera follow
- Interactable NPC and dialogue box with typewriter effect
- Collision and autosave (localStorage)

## Run Locally
Open `index.html` in a modern browser.

## Deploy on GitHub Pages
1. Push to GitHub.
2. **Settings → Pages → Build and deployment**
   - Source: **Deploy from branch**
   - Branch: `main` → `/ (root)`
3. Visit `https://<username>.github.io/<repo>/`.

## Art / Assets
Place your own pixel art in `assets/`:
- `tileset.png`: grid of 16×16 tiles (any cols/rows).
- `player.png`: 4 rows (Down, Left, Right, Up) × 3 columns (walk frames), each frame **16×24**.

If missing, the game auto-generates a procedural tileset and sprite so it still works.

> Use original artwork or properly licensed assets. Do not use Nintendo/Pokémon copyrighted art.