# Tiny Web RPG (Vanilla JS)

A minimal tile-based RPG scaffold built with HTML, CSS, and JavaScript (Canvas).  
Move with **Arrows/WASD**, **P** to pause, **R** to reset saved position.

## Local Run
Simply open `index.html` in a modern browser.

## Deploy to GitHub Pages
1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**:  
   - Source: **Deploy from branch**  
   - Branch: `main` → `/ (root)`
4. Visit: `https://<your-username>.github.io/<repo-name>/`

## Extend
- Edit `script.js` to replace the demo map with your own.
- Add NPCs, encounters, and a battle state machine.
- Save more game state in `localStorage` or migrate to IndexedDB.