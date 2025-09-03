/* Tiny GBA-style RPG (vanilla JS, Canvas)
   - Renders at 240×160 (GBA native) to an offscreen backbuffer
   - Upscales to visible canvas with nearest neighbor
   - BGR555 15-bit color quantization + LCD scanlines
   - Tileset + sprite sheet (uses procedural fallbacks if PNGs missing)
   - Player/NPC, collision, camera, interact & dialogue with typewriter
*/

(() => {
  // ========== GBA SP RENDER PIPELINE ==========
  const BASE_W = 240, BASE_H = 160; // GBA native resolution
  const SCALE = 3; // Integer scaling factor
  
  // Visible canvas
  const screen = document.getElementById('game');
  const sctx = screen.getContext('2d', { alpha: false });
  sctx.imageSmoothingEnabled = false;

  // Offscreen backbuffer (240×160)
  const backbuf = document.createElement('canvas');
  backbuf.width = BASE_W; 
  backbuf.height = BASE_H;
  const g = backbuf.getContext('2d', { alpha: false });
  g.imageSmoothingEnabled = false;

  // LCD scanline overlay
  const scanlines = document.createElement('canvas');
  scanlines.width = BASE_W; 
  scanlines.height = BASE_H;
  const scanCtx = scanlines.getContext('2d', { alpha: true });
  
  // Create LCD effect
  (function createLCDEffect() {
    scanCtx.clearRect(0, 0, BASE_W, BASE_H);
    // Horizontal scanlines
    scanCtx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < BASE_H; y += 2) {
      scanCtx.fillRect(0, y, BASE_W, 1);
    }
    // Sub-pixel grid
    for (let y = 0; y < BASE_H; y += 2) {
      for (let x = 0; x < BASE_W; x += 2) {
        scanCtx.fillStyle = 'rgba(0,0,0,0.05)';
        scanCtx.fillRect(x + 1, y, 1, 1);
        scanCtx.fillRect(x, y + 1, 1, 1);
      }
    }
  })();

  // BGR555 color quantization (15-bit GBA palette)
  function quantizeBGR555(imgData) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // Quantize to 5 bits per channel
      d[i]     = Math.floor(d[i] / 8) * 8;     // R
      d[i + 1] = Math.floor(d[i + 1] / 8) * 8; // G
      d[i + 2] = Math.floor(d[i + 2] / 8) * 8; // B
      
      // Slight gamma for backlight simulation
      const gamma = 1.05;
      d[i]     = Math.min(255, Math.pow(d[i] / 255, gamma) * 255);
      d[i + 1] = Math.min(255, Math.pow(d[i + 1] / 255, gamma) * 255);
      d[i + 2] = Math.min(255, Math.pow(d[i + 2] / 255, gamma) * 255);
    }
    return imgData;
  }

  // ========== ASSETS ==========
  const TILE = 16;
  const assets = { tileset: null, player: null };
  
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  
  async function loadAssets() {
    try { 
      assets.tileset = await loadImage('assets/tileset.png'); 
    } catch { 
      assets.tileset = makeProceduralTileset(); 
    }
    try { 
      assets.player = await loadImage('assets/player.png'); 
    } catch { 
      assets.player = makeProceduralPlayer(); 
    }
  }

  // Procedural tileset fallback
  function makeProceduralTileset() {
    const cols = 8, rows = 4;
    const w = cols * TILE, h = rows * TILE;
    const c = document.createElement('canvas');
    c.width = w; 
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    function drawTile(ix, iy, draw) {
      ctx.save();
      ctx.translate(ix * TILE, iy * TILE);
      draw(ctx);
      ctx.restore();
    }

    // Tile 0: Grass
    drawTile(0, 0, (g) => {
      g.fillStyle = '#48B848';
      g.fillRect(0, 0, TILE, TILE);
      // Dithering
      g.fillStyle = '#68D868';
      for (let y = 0; y < TILE; y += 2) {
        for (let x = (y/2) % 2; x < TILE; x += 2) {
          g.fillRect(x, y, 1, 1);
        }
      }
      g.fillStyle = '#289028';
      g.fillRect(3, 5, 1, 2);
      g.fillRect(10, 8, 1, 2);
    });

    // Tile 1: Path
    drawTile(1, 0, (g) => {
      g.fillStyle = '#B88860';
      g.fillRect(0, 0, TILE, TILE);
      g.fillStyle = '#D8B088';
      g.fillRect(0, 0, TILE, 2);
      g.fillStyle = '#886040';
      g.fillRect(0, TILE - 2, TILE, 2);
    });

    // Tile 2: Tree
    drawTile(2, 0, (g) => {
      g.fillStyle = '#186018';
      g.fillRect(2, 2, 12, 12);
      g.fillStyle = '#208020';
      g.fillRect(3, 3, 10, 10);
      g.fillStyle = '#30A030';
      g.fillRect(4, 4, 8, 8);
      g.fillStyle = '#48C048';
      g.fillRect(5, 5, 3, 3);
    });

    // Tile 3: Flowers
    drawTile(3, 0, (g) => {
      g.fillStyle = '#48B848';
      g.fillRect(0, 0, TILE, TILE);
      g.fillStyle = '#F878F8';
      g.fillRect(3, 4, 3, 3);
      g.fillRect(10, 8, 3, 3);
      g.fillStyle = '#F83800';
      g.fillRect(7, 11, 2, 2);
    });

    // Tile 4: Water
    drawTile(4, 0, (g) => {
      g.fillStyle = '#3878C8';
      g.fillRect(0, 0, TILE, TILE);
      g.fillStyle = '#2058A8';
      for (let y = 0; y < TILE; y += 4) {
        g.fillRect(0, y, TILE, 2);
      }
      g.fillStyle = '#5898E8';
      g.fillRect(2, 2, 3, 1);
      g.fillRect(8, 6, 3, 1);
    });

    // Tile 5: Tall grass
    drawTile(5, 0, (g) => {
      g.fillStyle = '#186818';
      g.fillRect(0, 0, TILE, TILE);
      g.fillStyle = '#104010';
      for (let x = 0; x < TILE; x += 2) {
        const h = 8 + (x * 3) % 4;
        g.fillRect(x, TILE - h, 1, h);
      }
    });

    const img = new Image();
    img.src = c.toDataURL();
    return img;
  }

  // Procedural player sprite fallback
  function makeProceduralPlayer() {
    const fw = 16, fh = 24, cols = 3, rows = 4;
    const c = document.createElement('canvas');
    c.width = fw * cols;
    c.height = fh * rows;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    function drawChar(x, y, dir, frame) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 5, y + 21, 6, 2);

      // Walking animation
      let legOffset = 0;
      if (frame === 1) legOffset = -1;
      if (frame === 2) legOffset = 1;

      // Body
      ctx.fillStyle = '#C83030';
      ctx.fillRect(x + 4, y + 10, 8, 7);

      // Head
      ctx.fillStyle = '#F8C890';
      ctx.fillRect(x + 5, y + 4, 6, 6);

      // Hair
      ctx.fillStyle = '#704028';
      ctx.fillRect(x + 4, y + 2, 8, 3);

      // Face (direction-dependent)
      if (dir === 0) { // Down
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 6, y + 6, 1, 1);
        ctx.fillRect(x + 9, y + 6, 1, 1);
      }

      // Arms
      ctx.fillStyle = '#F8C890';
      ctx.fillRect(x + 3, y + 11, 2, 4);
      ctx.fillRect(x + 11, y + 11, 2, 4);

      // Legs
      ctx.fillStyle = '#3060C8';
      ctx.fillRect(x + 5, y + 17 + (frame === 1 ? legOffset : 0), 2, 4);
      ctx.fillRect(x + 9, y + 17 + (frame === 2 ? legOffset : 0), 2, 4);

      // Shoes
      ctx.fillStyle = '#303030';
      ctx.fillRect(x + 5, y + 20 + (frame === 1 ? legOffset : 0), 2, 2);
      ctx.fillRect(x + 9, y + 20 + (frame === 2 ? legOffset : 0), 2, 2);
    }

    // Generate all frames
    for (let dir = 0; dir < rows; dir++) {
      for (let frame = 0; frame < cols; frame++) {
        drawChar(frame * fw, dir * fh, dir, frame);
      }
    }

    const img = new Image();
    img.src = c.toDataURL();
    return img;
  }

  // ========== WORLD ==========
  const VIEW_W = Math.floor(BASE_W / TILE);
  const VIEW_H = Math.floor(BASE_H / TILE);
  const W = 40, H = 30; // World size in tiles

  const TILES = { 
    GRASS: 0, PATH: 1, TREE: 2, 
    FLOWERS: 3, WATER: 4, TALL: 5 
  };
  const SOLID = new Set([TILES.TREE, TILES.WATER]);

  // Generate map
  const map = new Array(H).fill(0).map((_, y) =>
    new Array(W).fill(TILES.GRASS).map((t, x) => {
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) return TILES.TREE;
      if (x === 12 && y > 3 && y < H - 4) return TILES.WATER;
      if (y === 10 && x > 3 && x < W - 3) return TILES.PATH;
      if (x === 20 && y > 3 && y < H - 3) return TILES.PATH;
      return t;
    })
  );

  // Add decorations
  [[6,6],[7,6],[8,6],[22,12],[23,12]].forEach(([x,y]) => {
    if (map[y] && map[y][x] !== undefined) map[y][x] = TILES.FLOWERS;
  });
  
  for (let x = 28; x < 36 && x < W; x++) {
    for (let y = 5; y < 10 && y < H; y++) {
      if (map[y] && map[y][x] !== undefined) map[y][x] = TILES.TALL;
    }
  }

  // ========== ENTITIES ==========
  const DIRS = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 };
  
  function makeActor(x, y) {
    return {
      x: Math.floor(x),
      y: Math.floor(y),
      w: 12,
      h: 18,
      speed: 1.5,
      dir: DIRS.DOWN,
      frame: 1,
      animTimer: 0,
      isMoving: false
    };
  }

  // Player
  const saveKey = 'gba-rpg-save-v3';
  const saved = JSON.parse(localStorage.getItem(saveKey) || 'null');
  const player = makeActor(
    saved?.x ?? 5 * TILE,
    saved?.y ?? 5 * TILE
  );
  if (saved?.dir !== undefined) player.dir = saved.dir;

  // NPC
  const npc = makeActor(12 * TILE, 9 * TILE);
  npc.speed = 0;
  npc.dialogue = [
    "Welcome to the world of POKéMON!",
    "This is a tiny GBA-style demo.",
    "Drop your own art into assets/ for a custom look!"
  ];

  // Camera
  const camera = { x: 0, y: 0 };
  
  function focusCamera() {
    const vw = VIEW_W * TILE;
    const vh = VIEW_H * TILE;
    camera.x = Math.floor(player.x + player.w / 2 - vw / 2);
    camera.y = Math.floor(player.y + player.h / 2 - vh / 2);
    camera.x = Math.max(0, Math.min(camera.x, W * TILE - vw));
    camera.y = Math.max(0, Math.min(camera.y, H * TILE - vh));
  }

  // ========== INPUT ==========
  const keys = new Set();
  const lastKeys = new Set();
  
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','z','enter','p','r'].includes(k)) {
      e.preventDefault();
    }
    keys.add(k);
  });
  
  addEventListener('keyup', (e) => {
    keys.delete(e.key.toLowerCase());
  });
  
  function isKeyPressed(key) {
    return keys.has(key) && !lastKeys.has(key);
  }

  // ========== COLLISION ==========
  function isSolidAt(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
    return SOLID.has(map[ty][tx]);
  }
  
  function moveActor(actor, dx, dy) {
    // Update direction
    if (Math.abs(dx) > Math.abs(dy)) {
      actor.dir = dx < 0 ? DIRS.LEFT : DIRS.RIGHT;
    } else if (Math.abs(dy) > 0) {
      actor.dir = dy < 0 ? DIRS.UP : DIRS.DOWN;
    }

    // Check X axis
    let nx = actor.x + dx;
    let ny = actor.y;
    const cornersX = [
      [nx, ny],
      [nx + actor.w, ny],
      [nx, ny + actor.h],
      [nx + actor.w, ny + actor.h]
    ];
    if (!cornersX.some(([cx, cy]) => isSolidAt(cx, cy))) {
      actor.x = nx;
    }

    // Check Y axis
    nx = actor.x;
    ny = actor.y + dy;
    const cornersY = [
      [nx, ny],
      [nx + actor.w, ny],
      [nx, ny + actor.h],
      [nx + actor.w, ny + actor.h]
    ];
    if (!cornersY.some(([cx, cy]) => isSolidAt(cx, cy))) {
      actor.y = ny;
    }
  }

  // ========== DIALOGUE ==========
  const dialogue = {
    open: false,
    lines: [],
    currentLine: 0,
    currentChar: 0,
    displayText: '',
    charTimer: 0,
    charSpeed: 40,
    waiting: false
  };
  
  function startDialogue(lines) {
    dialogue.open = true;
    dialogue.lines = lines;
    dialogue.currentLine = 0;
    dialogue.currentChar = 0;
    dialogue.displayText = '';
    dialogue.waiting = false;
  }
  
  function updateDialogue(dt) {
    if (!dialogue.open || dialogue.waiting) return;
    
    dialogue.charTimer += dt;
    while (dialogue.charTimer >= dialogue.charSpeed && 
           dialogue.currentChar < dialogue.lines[dialogue.currentLine].length) {
      dialogue.displayText += dialogue.lines[dialogue.currentLine][dialogue.currentChar];
      dialogue.currentChar++;
      dialogue.charTimer -= dialogue.charSpeed;
    }
    
    if (dialogue.currentChar >= dialogue.lines[dialogue.currentLine].length) {
      dialogue.waiting = true;
    }
  }
  
  function advanceDialogue() {
    if (!dialogue.open) return;
    
    if (!dialogue.waiting) {
      // Skip to end of current line
      dialogue.displayText = dialogue.lines[dialogue.currentLine];
      dialogue.currentChar = dialogue.lines[dialogue.currentLine].length;
      dialogue.waiting = true;
    } else {
      // Next line or close
      dialogue.currentLine++;
      if (dialogue.currentLine >= dialogue.lines.length) {
        dialogue.open = false;
      } else {
        dialogue.currentChar = 0;
        dialogue.displayText = '';
        dialogue.waiting = false;
      }
    }
  }
  
  function isFacingNPC() {
    const px = Math.floor((player.x + player.w / 2) / TILE);
    const py = Math.floor((player.y + player.h / 2) / TILE);
    let fx = px, fy = py;
    
    if (player.dir === DIRS.UP) fy--;
    else if (player.dir === DIRS.DOWN) fy++;
    else if (player.dir === DIRS.LEFT) fx--;
    else if (player.dir === DIRS.RIGHT) fx++;
    
    const nx = Math.floor((npc.x + npc.w / 2) / TILE);
    const ny = Math.floor((npc.y + npc.h / 2) / TILE);
    
    return fx === nx && fy === ny;
  }

  // ========== RENDERING ==========
  function drawTile(id, sx, sy) {
    const cols = Math.max(1, Math.floor(assets.tileset.width / TILE));
    const tileX = (id % cols) * TILE;
    const tileY = Math.floor(id / cols) * TILE;
    
    g.drawImage(
      assets.tileset,
      tileX, tileY, TILE, TILE,
      sx, sy, TILE, TILE
    );
    
    // Subtle highlight
    g.globalAlpha = 0.1;
    g.fillStyle = '#ffffff';
    g.fillRect(sx, sy, TILE, 2);
    g.globalAlpha = 1;
  }
  
  function drawMap() {
    const startTx = Math.floor(camera.x / TILE);
    const startTy = Math.floor(camera.y / TILE);
    
    for (let ty = 0; ty <= VIEW_H; ty++) {
      for (let tx = 0; tx <= VIEW_W; tx++) {
        const mx = startTx + tx;
        const my = startTy + ty;
        const id = (mx >= 0 && my >= 0 && mx < W && my < H) 
          ? map[my][mx] 
          : TILES.GRASS;
        
        const sx = tx * TILE - (camera.x % TILE);
        const sy = ty * TILE - (camera.y % TILE);
        drawTile(id, sx, sy);
      }
    }
  }
  
  function drawActor(actor, sprite) {
    const fw = 16, fh = 24;
    const sx = Math.floor(actor.x - camera.x);
    const sy = Math.floor(actor.y - camera.y - 8);
    
    g.drawImage(
      sprite,
      actor.frame * fw, actor.dir * fh, fw, fh,
      sx, sy, fw, fh
    );
  }
  
  function drawDialogue() {
    if (!dialogue.open) return;
    
    const margin = 8;
    const boxH = 56;
    const x = margin;
    const y = BASE_H - boxH - margin;
    const w = BASE_W - margin * 2;
    const h = boxH;
    
    // Draw box background
    g.fillStyle = '#F0F0E8';
    g.fillRect(x, y, w, h);
    
    // Draw border
    g.strokeStyle = '#586878';
    g.lineWidth = 2;
    g.strokeRect(x, y, w, h);
    
    // Inner shadow
    g.strokeStyle = '#A8B0B8';
    g.lineWidth = 1;
    g.strokeRect(x + 2, y + 2, w - 4, h - 4);
    
    // Draw text
    g.fillStyle = '#181818';
    g.font = '10px monospace';
    g.textBaseline = 'top';
    
    // Simple word wrap
    const words = dialogue.displayText.split(' ');
    const lines = [];
    let currentLine = '';
    const maxWidth = w - 16;
    
    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const metrics = g.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    // Draw lines
    lines.forEach((line, i) => {
      g.fillText(line, x + 8, y + 8 + i * 12);
    });
    
    // Continue indicator
    if (dialogue.waiting && Math.floor(Date.now() / 400) % 2 === 0) {
      g.fillStyle = '#181818';
      g.beginPath();
      g.moveTo(x + w - 12, y + h - 12);
      g.lineTo(x + w - 8, y + h - 8);
      g.lineTo(x + w - 12, y + h - 4);
      g.closePath();
      g.fill();
    }
  }

  // ========== GAME LOOP ==========
  let lastTime = performance.now();
  let saveTimer = 0;
  let paused = false;
  
  function update(dt) {
    // Handle pause
    if (isKeyPressed('p')) {
      paused = !paused;
    }
    if (paused) return;
    
    // Handle dialogue
    if (dialogue.open) {
      updateDialogue(dt);
      if (isKeyPressed('z') || isKeyPressed('enter')) {
        advanceDialogue();
      }
      return;
    }
    
    // Player movement
    let vx = 0, vy = 0;
    if (keys.has('arrowleft') || keys.has('a')) vx -= 1;
    if (keys.has('arrowright') || keys.has('d')) vx += 1;
    if (keys.has('arrowup') || keys.has('w')) vy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) vy += 1;
    
    if (vx && vy) {
      // Normalize diagonal movement
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }
    
    if (vx || vy) {
      moveActor(player, vx * player.speed, vy * player.speed);
      player.isMoving = true;
      
      // Animate walking
      player.animTimer += dt;
      if (player.animTimer > 150) {
        player.animTimer = 0;
        player.frame = (player.frame % 2) + 1; // Cycle between frame 1 and 2
      }
    } else {
      player.isMoving = false;
      player.frame = 0;
      player.animTimer = 0;
    }
    
    // Interaction
    if (isKeyPressed('z') || isKeyPressed('enter')) {
      if (isFacingNPC()) {
        startDialogue(npc.dialogue);
      }
    }
    
    // Reset
    if (isKeyPressed('r')) {
      localStorage.removeItem(saveKey);
      player.x = 5 * TILE;
      player.y = 5 * TILE;
      player.dir = DIRS.DOWN;
    }
    
    // Auto-save
    saveTimer += dt;
    if (saveTimer > 2000) {
      saveTimer = 0;
      localStorage.setItem(saveKey, JSON.stringify({
        x: player.x,
        y: player.y,
        dir: player.dir
      }));
    }
    
    focusCamera();
  }
  
  function render() {
    // Clear backbuffer
    g.fillStyle = '#000000';
    g.fillRect(0, 0, BASE_W, BASE_H);
    
    // Draw world
    drawMap();
    
    // Draw entities (sorted by Y for depth)
    const entities = [npc, player].sort((a, b) => a.y - b.y);
    entities.forEach(entity => {
      drawActor(entity, assets.player);
    });
    
    // Draw UI
    drawDialogue();
    
    // Post-process: BGR555 quantization
    let frame = g.getImageData(0, 0, BASE_W, BASE_H);
    frame = quantizeBGR555(frame);
    g.putImageData(frame, 0, 0);
    
    // Apply LCD scanlines
    g.drawImage(scanlines, 0, 0);
    
    // Scale to display canvas
    sctx.clearRect(0, 0, screen.width, screen.height);
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(backbuf, 0, 0, screen.width, screen.height);
    
    // Draw pause overlay
    if (paused) {
      sctx.fillStyle = 'rgba(0,0,0,0.5)';
      sctx.fillRect(0, 0, screen.width, screen.height);
      sctx.fillStyle = '#ffffff';
      sctx.font = 'bold 24px monospace';
      sctx.textAlign = 'center';
      sctx.fillText('PAUSED', screen.width / 2, screen.height / 2);
      sctx.font = '16px monospace';
      sctx.fillText('Press P to resume', screen.width / 2, screen.height / 2 + 30);
      sctx.textAlign = 'left';
    }
  }
  
  function gameLoop(currentTime) {
    const dt = Math.min(32, currentTime - lastTime);
    lastTime = currentTime;
    
    update(dt);
    render();
    
    // Update input state
    lastKeys.clear();
    keys.forEach(k => lastKeys.add(k));
    
    requestAnimationFrame(gameLoop);
  }

  // ========== INITIALIZATION ==========
  (async () => {
    await loadAssets();
    requestAnimationFrame(gameLoop);
    
    // Save on page unload
    addEventListener('beforeunload', () => {
      localStorage.setItem(saveKey, JSON.stringify({
        x: player.x,
        y: player.y,
        dir: player.dir
      }));
    });
  })();
})();
