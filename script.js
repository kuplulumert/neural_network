/* Tiny Web RPG (vanilla JS, Canvas)
   - 16px tiles, simple tilemap, collision, camera follow
   - Arrow/WASD to move, P to pause, R to reset save
   - Auto-saves player position via localStorage
*/

(() => {
  const TILE = 16;
  const VIEW_W = 20; // tiles
  const VIEW_H = 15; // tiles

  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  // Demo tile IDs:
  // 0=void, 1=wall, 2=grass, 3=path, 4=water
  const W = 40, H = 30; // world size in tiles
  const map = new Array(H).fill(0).map((_, y) =>
    new Array(W).fill(2).map((t, x) => {
      // Frame walls
      if (x === 0 || y === 0 || x === W-1 || y === H-1) return 1;
      // A little river
      if (x === 12 && y > 3 && y < H-4) return 4;
      // A path
      if (y === 10 && x > 3 && x < W-3) return 3;
      return 2; // grass
    })
  );

  // Additional walls sprinkled in
  [[6,6],[7,6],[8,6],[22,12],[23,12],[24,12],[25,12]].forEach(([x,y]) => map[y][x]=1);

  const solid = new Set([1,4]); // walls & water are solid (for now)

  // Player
  const DEFAULT_POS = { x: 5*TILE, y: 5*TILE };
  const saveKey = 'tiny-rpg-save-v1';
  const saved = JSON.parse(localStorage.getItem(saveKey) || 'null');
  const player = {
    x: (saved?.x ?? DEFAULT_POS.x),
    y: (saved?.y ?? DEFAULT_POS.y),
    w: 14,
    h: 14,
    speed: 1.5,
  };

  const keys = new Set();
  let paused = false;

  // Camera (in pixels)
  const camera = { x: 0, y: 0 };
  function focusCamera() {
    const vw = VIEW_W * TILE;
    const vh = VIEW_H * TILE;
    camera.x = Math.floor(player.x + player.w/2 - vw/2);
    camera.y = Math.floor(player.y + player.h/2 - vh/2);
    // clamp to world bounds
    camera.x = Math.max(0, Math.min(camera.x, W*TILE - vw));
    camera.y = Math.max(0, Math.min(camera.y, H*TILE - vh));
  }

  // Input
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)) {
      e.preventDefault();
      keys.add(k);
    } else if (k === 'p') {
      paused = !paused;
    } else if (k === 'r') {
      localStorage.removeItem(saveKey);
      player.x = DEFAULT_POS.x;
      player.y = DEFAULT_POS.y;
    }
  });
  addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    keys.delete(k);
  });

  // Collision helpers
  function isSolidAt(px, py) {
    if (px < 0 || py < 0) return true;
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
    return solid.has(map[ty][tx]);
  }
  function tryMove(dx, dy) {
    let nx = player.x + dx, ny = player.y + dy;
    // AABB corners for collision
    const corners = [
      [nx, ny],
      [nx + player.w, ny],
      [nx, ny + player.h],
      [nx + player.w, ny + player.h]
    ];
    // Separate axis collision resolution
    // X
    let nxX = player.x + dx, nyX = player.y;
    const cornersX = [
      [nxX, nyX],
      [nxX + player.w, nyX],
      [nxX, nyX + player.h],
      [nxX + player.w, nyX + player.h]
    ];
    if (!cornersX.some(([cx,cy]) => isSolidAt(cx, cy))) player.x = nxX;

    // Y
    let nxY = player.x, nyY = player.y + dy;
    const cornersY = [
      [nxY, nyY],
      [nxY + player.w, nyY],
      [nxY, nyY + player.h],
      [nxY + player.w, nyY + player.h]
    ];
    if (!cornersY.some(([cx,cy]) => isSolidAt(cx, cy))) player.y = nyY;
  }

  // Rendering utils
  function clear() {
    ctx.fillStyle = '#0a0b0e';
    ctx.fillRect(0,0,canvas.width, canvas.height);
  }
  function drawTile(t, sx, sy) {
    // Simple palette per tile type
    switch (t) {
      case 0: ctx.fillStyle = '#000000'; break; // void
      case 1: ctx.fillStyle = '#3b4252'; break; // wall
      case 2: ctx.fillStyle = '#3a6e39'; break; // grass
      case 3: ctx.fillStyle = '#6b5b4d'; break; // path
      case 4: ctx.fillStyle = '#1b4b6b'; break; // water
      default: ctx.fillStyle = '#8a8a8a';
    }
    ctx.fillRect(sx, sy, TILE, TILE);
    // Tiny highlight for depth
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx, sy, TILE, 3);
    ctx.globalAlpha = 1;
  }
  function drawMap() {
    const startTx = Math.floor(camera.x / TILE);
    const startTy = Math.floor(camera.y / TILE);
    for (let ty = 0; ty < VIEW_H; ty++) {
      for (let tx = 0; tx < VIEW_W; tx++) {
        const mx = startTx + tx;
        const my = startTy + ty;
        const t = (mx >=0 && my >=0 && mx < W && my < H) ? map[my][mx] : 0;
        const sx = tx*TILE - (camera.x % TILE);
        const sy = ty*TILE - (camera.y % TILE);
        drawTile(t, sx, sy);
      }
    }
  }
  function drawPlayer() {
    const sx = Math.floor(player.x - camera.x);
    const sy = Math.floor(player.y - camera.y);
    // body
    ctx.fillStyle = '#e7e8ea';
    ctx.fillRect(sx, sy, player.w, player.h);
    // face pixel
    ctx.fillStyle = '#2d3140';
    ctx.fillRect(sx + 9, sy + 4, 2, 2);
  }

  // Main loop
  let last = performance.now();
  function loop(ts) {
    requestAnimationFrame(loop);
    const dt = Math.min(32, ts - last); // clamp
    last = ts;
    if (paused) {
      clear();
      drawMap();
      drawPlayer();
      // Pause overlay
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText('PAUSED (Press P)', 10, 20);
      return;
    }

    // Input → velocity
    let vx = 0, vy = 0;
    if (keys.has('arrowleft') || keys.has('a')) vx -= 1;
    if (keys.has('arrowright') || keys.has('d')) vx += 1;
    if (keys.has('arrowup') || keys.has('w')) vy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) vy += 1;
    if (vx && vy) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; } // diag normalise

    tryMove(vx * player.speed, vy * player.speed);
    focusCamera();

    clear();
    drawMap();
    drawPlayer();
  }
  requestAnimationFrame(loop);

  // Persist position
  function save() {
    localStorage.setItem(saveKey, JSON.stringify({ x: player.x, y: player.y }));
  }
  addEventListener('beforeunload', save);
  // Save occasionally while moving
  setInterval(() => save(), 2000);
})();