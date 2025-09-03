/* Tiny GBA-style RPG (vanilla JS, Canvas)
   - 16px tiles from tileset.png (fallback: procedural tiles)
   - Player & NPC sprite sheets (fallback: procedural sprites)
   - Overworld collision, facing, camera follow
   - Interact (Z/Enter) to open dialogue box with typewriter text and paging
   - Auto-save via localStorage
*/

(() => {
  const TILE = 16;
  const VIEW_W = 20;  // tiles across (320px / 16)
  const VIEW_H = 15;  // tiles down  (240px / 16)

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  // ---- Assets (with graceful fallbacks) ------------------------------------
  const assets = {
    tileset: null,       // HTMLImageElement
    player: null,        // HTMLImageElement
  };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function loadAssets() {
    // Try external PNGs, else generate.
    try { assets.tileset = await loadImage('assets/tileset.png'); }
    catch { assets.tileset = makeProceduralTileset(); }
    try { assets.player  = await loadImage('assets/player.png'); }
    catch { assets.player = makeProceduralPlayer(); }
  }

  // Procedural tileset: build a small atlas that roughly evokes GBA vibes
  function makeProceduralTileset() {
    const cols = 8, rows = 4, size = TILE;
    const w = cols * size, h = rows * size;
    const cvs = document.createElement('canvas');
    cvs.width = w; cvs.height = h;
    const g = cvs.getContext('2d');
    g.imageSmoothingEnabled = false;

    // helper
    function tileAt(ix, iy, draw) {
      g.save();
      g.translate(ix*size, iy*size);
      draw(g);
      g.restore();
    }

    // 0 grass (speckled)
    tileAt(0,0,(g)=>{
      g.fillStyle = '#3a6e39'; g.fillRect(0,0,size,size);
      g.fillStyle = '#4b8748';
      for (let i=0;i<20;i++) g.fillRect((i*7)%size, (i*11)%size, 1, 1);
    });

    // 1 path
    tileAt(1,0,(g)=>{
      g.fillStyle='#6b5b4d'; g.fillRect(0,0,size,size);
      g.fillStyle='#806c5c'; g.fillRect(0,0,size,3);
      g.fillStyle='#584b40'; g.fillRect(0,size-3,size,3);
    });

    // 2 tree top (solid)
    tileAt(2,0,(g)=>{
      g.fillStyle='#78b159'; g.beginPath();
      g.arc(8,8,7,0,Math.PI*2); g.fill();
      g.fillStyle='#659b4b'; g.fillRect(4,3,8,2);
      g.fillStyle='#507e3b'; g.fillRect(3,6,10,2);
      g.fillStyle='#3b5e2b'; g.fillRect(5,10,6,2);
    });

    // 3 flowers
    tileAt(3,0,(g)=>{
      g.fillStyle='#3a6e39'; g.fillRect(0,0,size,size);
      g.fillStyle='#e2617a'; g.fillRect(4,6,2,2);
      g.fillStyle='#e2617a'; g.fillRect(10,9,2,2);
      g.fillStyle='#ffb6c1'; g.fillRect(6,8,2,2);
    });

    // 4 water
    tileAt(4,0,(g)=>{
      g.fillStyle='#1b4b6b'; g.fillRect(0,0,size,size);
      g.fillStyle='#276f9b'; g.fillRect(0,2,size,2);
      g.fillStyle='#123a54'; g.fillRect(0,size-3,size,3);
    });

    // 5 tall grass (encounter area look)
    tileAt(5,0,(g)=>{
      g.fillStyle='#2f5e2f'; g.fillRect(0,0,size,size);
      g.fillStyle='#3f7a3f';
      for(let x=1;x<size;x+=3) g.fillRect(x,0,1,size);
    });

    // Fill remaining with grass
    for (let ix=0; ix<cols; ix++)
      for (let iy=0; iy<rows; iy++)
        if (ix+iy && g.getImageData(ix*size,iy*size,1,1).data[3]===0)
          tileAt(ix,iy,(gg)=>{ gg.fillStyle='#3a6e39'; gg.fillRect(0,0,size,size); });

    const img = new Image();
    img.src = cvs.toDataURL();
    return img;
  }

  // Procedural player: 4 directions × 3 frames, 16×24 per frame
  function makeProceduralPlayer() {
    const fw=16, fh=24, cols=3, rows=4;
    const cvs = document.createElement('canvas');
    cvs.width = fw*cols; cvs.height = fh*rows;
    const g = cvs.getContext('2d');
    g.imageSmoothingEnabled = false;

    function drawBody(x,y,shade) {
      g.fillStyle = shade; g.fillRect(x+3,y+6,10,10); // torso
      g.fillStyle = '#e7e8ea'; g.fillRect(x+5,y+2,6,5); // head
      g.fillStyle = '#2d3140'; g.fillRect(x+8,y+4,2,2); // eye
      g.fillStyle = '#7a2f2f'; g.fillRect(x+4,y+17,3,6); // leg L
      g.fillStyle = '#7a2f2f'; g.fillRect(x+9,y+17,3,6); // leg R
    }
    const shades = ['#5fa8d3','#5fa8d3','#5fa8d3','#5fa8d3']; // per row
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        drawBody(c*fw, r*fh, shades[r]);
        // tiny frame offsets
        if (c===1) { g.fillStyle='#2d3140'; g.fillRect(c*fw+6,r*fh+19,3,1); }
        if (c===2) { g.fillStyle='#2d3140'; g.fillRect(c*fw+7,r*fh+19,3,1); }
      }
    }
    const img = new Image();
    img.src = cvs.toDataURL();
    return img;
  }

  // ---- Map, tiles, and collision ------------------------------------------
  // Tile indices (matching our procedural atlas above):
  const TILES = {
    GRASS: 0,
    PATH: 1,
    TREE: 2,
    FLOWERS: 3,
    WATER: 4,
    TALL: 5
  };
  const SOLID = new Set([TILES.TREE, TILES.WATER]);

  // Build a small world
  const W = 40, H = 30; // tiles
  const map = new Array(H).fill(0).map((_, y) =>
    new Array(W).fill(TILES.GRASS).map((t, x) => {
      if (x===0||y===0||x===W-1||y===H-1) return TILES.TREE;
      if (x===12 && y>3 && y<H-4) return TILES.WATER;
      if (y===10 && x>3 && x<W-3) return TILES.PATH;
      return t;
    })
  );
  // Flowers and tall grass areas
  [[6,6],[7,6],[8,6],[22,12],[23,12],[24,12],[25,12]].forEach(([x,y]) => map[y][x]=TILES.FLOWERS);
  for (let x=28;x<36;x++) for (let y=5;y<10;y++) map[y][x] = TILES.TALL;

  // ---- Entities ------------------------------------------------------------
  const DIRS = { DOWN:0, LEFT:1, RIGHT:2, UP:3 };
  function makeActor(x,y) {
    return {
      x, y, w: 12, h: 18, speed: 1.5,
      dir: DIRS.DOWN, anim: 0, animTime: 0, frame: 1, // middle frame idle
    };
  }

  // Load/save
  const saveKey = 'gba-like-rpg-v1';
  const saved = JSON.parse(localStorage.getItem(saveKey) || 'null');
  const player = makeActor(
    (saved?.x ?? 5*TILE),
    (saved?.y ?? 5*TILE)
  );
  if (saved?.dir !== undefined) player.dir = saved.dir;

  // One NPC to talk to
  const npc = makeActor(12*TILE, 9*TILE);
  npc.speed = 0; // stationary

  // Camera in pixels
  const camera = { x:0, y:0 };

  function focusCamera() {
    const vw = VIEW_W*TILE, vh = VIEW_H*TILE;
    camera.x = Math.floor(player.x + player.w/2 - vw/2);
    camera.y = Math.floor(player.y + player.h/2 - vh/2);
    camera.x = Math.max(0, Math.min(camera.x, W*TILE - vw));
    camera.y = Math.max(0, Math.min(camera.y, H*TILE - vh));
  }

  // ---- Input ---------------------------------------------------------------
  const keys = new Set();
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','z','enter','p','r'].includes(k)) {
      e.preventDefault();
    }
    keys.add(k);
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  // ---- Collision helpers ---------------------------------------------------
  function isSolidAt(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx<0||ty<0||tx>=W||ty>=H) return true;
    return SOLID.has(map[ty][tx]);
  }
  function moveActor(a, dx, dy) {
    // Determine facing
    if (Math.abs(dx) > Math.abs(dy)) a.dir = dx<0 ? DIRS.LEFT : DIRS.RIGHT;
    else if (Math.abs(dy) > 0) a.dir = dy<0 ? DIRS.UP : DIRS.DOWN;

    // X axis
    let nx = a.x + dx, ny = a.y;
    const cornersX = [[nx,ny],[nx+a.w,ny],[nx,ny+a.h],[nx+a.w,ny+a.h]];
    if (!cornersX.some(([cx,cy]) => isSolidAt(cx, cy))) a.x = nx;

    // Y axis
    nx = a.x; ny = a.y + dy;
    const cornersY = [[nx,ny],[nx+a.w,ny],[nx,ny+a.h],[nx+a.w,ny+a.h]];
    if (!cornersY.some(([cx,cy]) => isSolidAt(cx, cy))) a.y = ny;
  }

  // ---- Dialogue System -----------------------------------------------------
  const dialogue = {
    open: false,
    lines: [],      // array of strings (pages)
    page: 0,
    shown: 0,       // chars shown in current page (typewriter)
    speed: 2,       // chars/frame
    hold: false,    // finished page, awaiting key
  };

  function startDialogue(lines) {
    dialogue.open = true;
    dialogue.lines = lines;
    dialogue.page = 0;
    dialogue.shown = 0;
    dialogue.hold = false;
  }
  function advanceDialogue() {
    if (!dialogue.open) return;
    if (!dialogue.hold) {
      // finish current page instantly
      dialogue.shown = dialogue.lines[dialogue.page].length;
      dialogue.hold = true;
    } else {
      // next page or close
      if (dialogue.page < dialogue.lines.length-1) {
        dialogue.page++;
        dialogue.shown = 0;
        dialogue.hold = false;
      } else {
        dialogue.open = false;
      }
    }
  }

  // Check if player is facing NPC
  function isFacingNPC() {
    const px = Math.floor((player.x + player.w/2) / TILE);
    const py = Math.floor((player.y + player.h/2) / TILE);
    let fx = px, fy = py;
    if (player.dir === DIRS.UP) fy--;
    if (player.dir === DIRS.DOWN) fy++;
    if (player.dir === DIRS.LEFT) fx--;
    if (player.dir === DIRS.RIGHT) fx++;
    const nx = Math.floor((npc.x + npc.w/2) / TILE);
    const ny = Math.floor((npc.y + npc.h/2) / TILE);
    return fx === nx && fy === ny;
  }

  // ---- Rendering -----------------------------------------------------------
  function drawTile(ix, iy, sx, sy) {
    // tileset atlas assumed 8 cols (procedural). If user supplies different,
    // we still only use the first row indices (0..7).
    const cols = Math.floor(assets.tileset.width / TILE);
    const sx0 = (ix % cols) * TILE;
    const sy0 = Math.floor(iy) * TILE;
    ctx.drawImage(assets.tileset, sx0, sy0, TILE, TILE, sx, sy, TILE, TILE);
    // Simple highlight line for depth
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
        const id = (mx>=0 && my>=0 && mx<W && my<H) ? map[my][mx] : TILES.GRASS;
        const sx = tx*TILE - (camera.x % TILE);
        const sy = ty*TILE - (camera.y % TILE);
        drawTile(id, 0, sx, sy);
      }
    }
  }

  function drawActor(a, img) {
    const fw = 16, fh = 24;
    const dirRow = a.dir; // 0:down,1:left,2:right,3:up
    const sx = Math.floor(a.x - camera.x);
    const sy = Math.floor(a.y - camera.y) - 8; // anchor feet to tile

    ctx.drawImage(img, a.frame*fw, dirRow*fh, fw, fh, sx, sy, fw, fh);
  }

  function drawDialogue() {
    if (!dialogue.open) return;
    const margin = 8;
    const boxH = 70;
    const x = margin, y = canvas.height - boxH - margin, w = canvas.width - margin*2, h = boxH;

    // Rounded box (GBA-ish)
    roundRect(ctx, x, y, w, h, 8, '#f8f9fb', '#96a0b4');

    // Text
    const text = dialogue.lines[dialogue.page];
    if (dialogue.shown < text.length) {
      dialogue.shown = Math.min(text.length, dialogue.shown + dialogue.speed);
      if (dialogue.shown === text.length) dialogue.hold = true;
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(x+14, y+12, w-28, h-24); ctx.clip();
    ctx.fillStyle = '#1d2430';
    ctx.font = '12px monospace';
    ctx.textBaseline = 'top';

    // word wrap
    const shownText = text.slice(0, dialogue.shown);
    const lines = wrapText(shownText, w-28, ctx);
    lines.forEach((ln, i) => ctx.fillText(ln, x+14, y+12 + i*14));
    ctx.restore();

    // Continue marker
    if (dialogue.hold) {
      ctx.fillStyle = '#1d2430';
      ctx.fillRect(x + w - 22, y + h - 16, 6, 6);
    }
  }

  function roundRect(g, x, y, w, h, r, fill, stroke) {
    g.save();
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x+r,y);
    g.arcTo(x+w,y,x+w,y+h,r);
    g.arcTo(x+w,y+h,x,y+h,r);
    g.arcTo(x,y+h,x,y,r);
    g.arcTo(x,y,x+w,y,r);
    g.closePath();
    g.fillStyle = fill; g.fill();
    g.strokeStyle = stroke; g.stroke();
    g.restore();
  }

  function wrapText(text, maxWidth, g) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? (line + ' ' + w) : w;
      if (g.measureText(test).width <= maxWidth) line = test;
      else { lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    return lines;
  }

  // ---- Game Loop -----------------------------------------------------------
  let last = performance.now();

  function update(dt) {
    // Input → movement unless dialogue open
    if (!dialogue.open && !keys.has('p')) {
      let vx = 0, vy = 0;
      if (keys.has('arrowleft') || keys.has('a'))  vx -= 1;
      if (keys.has('arrowright')|| keys.has('d'))  vx += 1;
      if (keys.has('arrowup')   || keys.has('w'))  vy -= 1;
      if (keys.has('arrowdown') || keys.has('s'))  vy += 1;
      if (vx && vy) { vx*=Math.SQRT1_2; vy*=Math.SQRT1_2; }
      moveActor(player, vx*player.speed, vy*player.speed);

      // Animation
      if (vx || vy) {
        player.animTime += dt;
        if (player.animTime > 120) {
          player.animTime = 0;
          player.frame = (player.frame + 1) % 3; // 0,1,2
        }
      } else {
        player.frame = 1; // idle middle
      }
    }

    // Interact key
    if (justPressed(['z','enter'])) {
      if (dialogue.open) {
        advanceDialogue();
      } else if (isFacingNPC()) {
        startDialogue([
          "MAGE put the POTION away in the BAG's ITEMS pocket.",
          "Press Z/Enter again to close this dialogue."
        ]);
      }
    }

    // Reset
    if (justPressed(['r'])) {
      localStorage.removeItem(saveKey);
      player.x = 5*TILE; player.y = 5*TILE; player.dir = DIRS.DOWN;
    }

    // Save periodically
    saveTimer += dt;
    if (saveTimer > 1500) {
      saveTimer = 0;
      localStorage.setItem(saveKey, JSON.stringify({ x: player.x, y: player.y, dir: player.dir }));
    }

    focusCamera();
  }

  function render() {
    // clear
    ctx.fillStyle = '#0a0b0e'; ctx.fillRect(0,0,canvas.width, canvas.height);

    drawMap();
    drawActor(npc, assets.player);     // reuse player sheet as placeholder
    drawActor(player, assets.player);
    drawDialogue();
  }

  let pressed = new Set();
  function justPressed(arr) {
    for (const k of arr) {
      if (keys.has(k) && !pressed.has(k)) { pressed.add(k); return true; }
    }
    // clear released
    for (const k of [...pressed]) if (!keys.has(k)) pressed.delete(k);
    return false;
  }

  let saveTimer = 0;

  function loop(ts) {
    const dt = Math.min(32, ts - last);
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  // ---- Boot ----------------------------------------------------------------
  (async () => {
    await loadAssets();
    requestAnimationFrame(loop);
    // Save on close
    addEventListener('beforeunload', () => {
      localStorage.setItem(saveKey, JSON.stringify({ x: player.x, y: player.y, dir: player.dir }));
    });
  })();
})();