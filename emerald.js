/* GBA-Style RPG with Pokémon Emerald-like Graphics
   Advanced features:
   - 240×160 native GBA resolution with 4x upscaling
   - BGR555 15-bit color quantization for authentic GBA palette
   - Rich procedural tileset with multiple variants
   - Animated water, tall grass, and environmental effects
   - Overlap layer system for depth (tree tops over player)
   - Sprite shadows and advanced lighting
   - 9-slice dialogue panels with typewriter effect
   - Smooth grid-based movement with interpolation
*/

(() => {
  // ============================================================================
  // CORE CONSTANTS & SETUP
  // ============================================================================
  
  const BASE_W = 240, BASE_H = 160; // GBA native resolution
  const TILE = 16; // Tile size
  const SCALE = 4; // Display scale
  
  // Get canvas and contexts
  const screen = document.getElementById('game');
  const sctx = screen.getContext('2d', { alpha: false });
  sctx.imageSmoothingEnabled = false;
  
  // Create backbuffer for GBA resolution
  const buf = document.createElement('canvas');
  buf.width = BASE_W;
  buf.height = BASE_H;
  const g = buf.getContext('2d', { alpha: false });
  g.imageSmoothingEnabled = false;
  
  // Create scanline overlay for LCD effect
  const scanlines = document.createElement('canvas');
  scanlines.width = BASE_W;
  scanlines.height = BASE_H;
  const sc = scanlines.getContext('2d');
  sc.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let y = 0; y < BASE_H; y += 2) {
    sc.fillRect(0, y, BASE_W, 1);
  }
  
  // Sub-pixel LCD grid effect
  for (let y = 0; y < BASE_H; y += 2) {
    for (let x = 0; x < BASE_W; x += 2) {
      sc.fillStyle = 'rgba(0, 0, 0, 0.06)';
      sc.fillRect(x + 1, y, 1, 1);
      sc.fillRect(x, y + 1, 1, 1);
    }
  }
  
  // BGR555 color quantization (15-bit GBA palette)
  function quantizeBGR555(img) {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = Math.floor(d[i] / 8) * 8;     // R: 5 bits
      d[i + 1] = Math.floor(d[i + 1] / 8) * 8; // G: 5 bits
      d[i + 2] = Math.floor(d[i + 2] / 8) * 8; // B: 5 bits
    }
    return img;
  }
  
  // ============================================================================
  // EMERALD COLOR PALETTE
  // ============================================================================
  
  const PAL = {
    // Grass tones (Emerald-style)
    GRASS_SHADOW: '#186030',
    GRASS_DARK: '#208038',
    GRASS_BASE: '#28A048',
    GRASS_LIGHT: '#30C050',
    GRASS_BRIGHT: '#38E058',
    
    // Path/Ground
    PATH_DARK: '#604830',
    PATH_BASE: '#806040',
    PATH_LIGHT: '#A07850',
    PATH_BRIGHT: '#C09060',
    
    // Water (animated)
    WATER_DEEP: '#185888',
    WATER_DARK: '#2070A0',
    WATER_BASE: '#2888B8',
    WATER_LIGHT: '#30A0D0',
    WATER_BRIGHT: '#38B8E8',
    WATER_FOAM: '#B8E0F8',
    
    // Trees
    TREE_TRUNK: '#583818',
    TREE_BARK: '#704828',
    TREE_SHADOW: '#105020',
    TREE_DARK: '#187028',
    TREE_BASE: '#209030',
    TREE_LIGHT: '#28B038',
    TREE_BRIGHT: '#30D040',
    
    // Flowers
    FLOWER_RED: '#E85088',
    FLOWER_PINK: '#F878A8',
    FLOWER_YELLOW: '#F8D878',
    FLOWER_WHITE: '#F8F8F8',
    
    // UI
    UI_BG: '#F8F8F0',
    UI_BORDER: '#5090B8',
    UI_SHADOW: '#A8B8C8',
    TEXT: '#202020'
  };
  
  // ============================================================================
  // ASSET LOADING & PROCEDURAL GENERATION
  // ============================================================================
  
  const assets = { 
    tileset: null, 
    player: null, 
    panel: null 
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
    try { 
      assets.tileset = await loadImage('assets/tileset.png'); 
    } catch { 
      assets.tileset = makeEmeraldTileset(); 
    }
    
    try { 
      assets.player = await loadImage('assets/player.png'); 
    } catch { 
      assets.player = makeEmeraldPlayer(); 
    }
    
    try { 
      assets.panel = await loadImage('assets/panel9.png'); 
    } catch { 
      assets.panel = makeEmeraldPanel(); 
    }
  }
  
  // Create Emerald-quality tileset
  function makeEmeraldTileset() {
    const cols = 16, rows = 2;
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
    
    // Row 0: Base tiles
    
    // Tiles 0-2: Grass variants with Emerald-style detail
    for (let i = 0; i < 3; i++) {
      drawTile(i, 0, (g) => {
        // Base grass with gradient
        const grad = g.createLinearGradient(0, 0, 0, TILE);
        grad.addColorStop(0, PAL.GRASS_LIGHT);
        grad.addColorStop(1, PAL.GRASS_BASE);
        g.fillStyle = grad;
        g.fillRect(0, 0, TILE, TILE);
        
        // Detailed grass texture
        g.fillStyle = PAL.GRASS_BRIGHT;
        for (let k = 0; k < 12; k++) {
          const x = (k * 7 + i * 3) % TILE;
          const y = (k * 11 + i * 5) % TILE;
          g.fillRect(x, y, 1, 2);
        }
        
        // Shadow lines for depth
        g.fillStyle = PAL.GRASS_DARK;
        for (let x = 1 + i % 2; x < TILE; x += 4) {
          g.fillRect(x, 0, 1, TILE);
        }
        
        // Highlights
        g.fillStyle = PAL.GRASS_BRIGHT;
        g.fillRect((i * 5) % TILE, (i * 7) % TILE, 1, 1);
      });
    }
    
    // Tiles 3-5: Path variants with texture
    for (let i = 3; i < 6; i++) {
      drawTile(i, 0, (g) => {
        // Base path
        g.fillStyle = PAL.PATH_BASE;
        g.fillRect(0, 0, TILE, TILE);
        
        // Edge shading
        const edgeGrad = g.createLinearGradient(0, 0, 0, TILE);
        edgeGrad.addColorStop(0, PAL.PATH_LIGHT);
        edgeGrad.addColorStop(0.2, 'transparent');
        edgeGrad.addColorStop(0.8, 'transparent');
        edgeGrad.addColorStop(1, PAL.PATH_DARK);
        g.fillStyle = edgeGrad;
        g.fillRect(0, 0, TILE, TILE);
        
        // Pebbles and texture
        g.fillStyle = PAL.PATH_DARK;
        for (let k = 0; k < 6; k++) {
          const x = (k * 5 + i) % TILE;
          const y = (k * 7 + i * 2) % TILE;
          g.fillRect(x, y, 2, 1);
        }
        
        g.fillStyle = PAL.PATH_BRIGHT;
        for (let k = 0; k < 3; k++) {
          const x = (k * 7 + i * 3) % TILE;
          const y = (k * 5 + i) % TILE;
          g.fillRect(x, y, 1, 1);
        }
      });
    }
    
    // Tile 6: Tree trunk
    drawTile(6, 0, (g) => {
      // Trunk with bark texture
      const trunkGrad = g.createLinearGradient(6, 0, 10, 0);
      trunkGrad.addColorStop(0, PAL.TREE_BARK);
      trunkGrad.addColorStop(0.5, PAL.TREE_TRUNK);
      trunkGrad.addColorStop(1, PAL.TREE_BARK);
      g.fillStyle = trunkGrad;
      g.fillRect(5, 6, 6, 10);
      
      // Bark details
      g.fillStyle = PAL.TREE_TRUNK;
      g.fillRect(6, 8, 1, 3);
      g.fillRect(9, 10, 1, 2);
      g.fillRect(7, 13, 2, 1);
      
      // Roots
      g.fillStyle = PAL.TREE_BARK;
      g.fillRect(4, 14, 8, 2);
    });
    
    // Tile 7: Tree top (overlap layer)
    drawTile(7, 0, (g) => {
      // Tree canopy with Emerald-style shading
      const canopyGrad = g.createRadialGradient(8, 8, 2, 8, 8, 8);
      canopyGrad.addColorStop(0, PAL.TREE_BRIGHT);
      canopyGrad.addColorStop(0.5, PAL.TREE_BASE);
      canopyGrad.addColorStop(1, PAL.TREE_SHADOW);
      
      g.fillStyle = canopyGrad;
      g.beginPath();
      g.arc(8, 8, 7, 0, Math.PI * 2);
      g.fill();
      
      // Leaf clusters
      g.fillStyle = PAL.TREE_LIGHT;
      g.fillRect(4, 5, 3, 2);
      g.fillRect(9, 6, 3, 2);
      g.fillRect(6, 9, 2, 2);
      
      g.fillStyle = PAL.TREE_BRIGHT;
      g.fillRect(5, 5, 1, 1);
      g.fillRect(10, 6, 1, 1);
      
      // Shadow
      g.fillStyle = PAL.TREE_DARK;
      g.fillRect(5, 11, 6, 1);
    });
    
    // Tiles 8-9: Water animation frames
    drawTile(8, 0, (g) => {
      // Water frame 1
      const waterGrad = g.createLinearGradient(0, 0, 0, TILE);
      waterGrad.addColorStop(0, PAL.WATER_LIGHT);
      waterGrad.addColorStop(0.5, PAL.WATER_BASE);
      waterGrad.addColorStop(1, PAL.WATER_DEEP);
      g.fillStyle = waterGrad;
      g.fillRect(0, 0, TILE, TILE);
      
      // Waves
      g.fillStyle = PAL.WATER_BRIGHT;
      g.beginPath();
      g.moveTo(0, 4);
      g.quadraticCurveTo(8, 2, 16, 4);
      g.lineTo(16, 6);
      g.quadraticCurveTo(8, 4, 0, 6);
      g.closePath();
      g.fill();
      
      // Foam
      g.fillStyle = PAL.WATER_FOAM;
      g.fillRect(3, 3, 1, 1);
      g.fillRect(12, 4, 1, 1);
      g.fillRect(7, 10, 1, 1);
    });
    
    drawTile(9, 0, (g) => {
      // Water frame 2 (shifted waves)
      const waterGrad = g.createLinearGradient(0, 0, 0, TILE);
      waterGrad.addColorStop(0, PAL.WATER_LIGHT);
      waterGrad.addColorStop(0.5, PAL.WATER_BASE);
      waterGrad.addColorStop(1, PAL.WATER_DEEP);
      g.fillStyle = waterGrad;
      g.fillRect(0, 0, TILE, TILE);
      
      // Shifted waves
      g.fillStyle = PAL.WATER_BRIGHT;
      g.beginPath();
      g.moveTo(0, 6);
      g.quadraticCurveTo(8, 4, 16, 6);
      g.lineTo(16, 8);
      g.quadraticCurveTo(8, 6, 0, 8);
      g.closePath();
      g.fill();
      
      // Foam
      g.fillStyle = PAL.WATER_FOAM;
      g.fillRect(5, 5, 1, 1);
      g.fillRect(10, 3, 1, 1);
      g.fillRect(14, 11, 1, 1);
    });
    
    // Tiles 10-11: Tall grass animation
    drawTile(10, 0, (g) => {
      // Tall grass frame 1
      g.fillStyle = PAL.GRASS_SHADOW;
      g.fillRect(0, 0, TILE, TILE);
      
      // Grass blades
      for (let x = 1; x < TILE; x += 3) {
        const grad = g.createLinearGradient(x, TILE, x, 0);
        grad.addColorStop(0, PAL.GRASS_DARK);
        grad.addColorStop(0.5, PAL.GRASS_BASE);
        grad.addColorStop(1, PAL.GRASS_LIGHT);
        g.fillStyle = grad;
        g.fillRect(x, 0, 1, TILE);
      }
    });
    
    drawTile(11, 0, (g) => {
      // Tall grass frame 2 (swaying)
      g.fillStyle = PAL.GRASS_SHADOW;
      g.fillRect(0, 0, TILE, TILE);
      
      // Swayed grass blades
      for (let x = 2; x < TILE; x += 3) {
        const grad = g.createLinearGradient(x, TILE, x, 0);
        grad.addColorStop(0, PAL.GRASS_DARK);
        grad.addColorStop(0.5, PAL.GRASS_BASE);
        grad.addColorStop(1, PAL.GRASS_LIGHT);
        g.fillStyle = grad;
        g.fillRect(x, 0, 1, TILE);
      }
    });
    
    // Tile 12: Flowers
    drawTile(12, 0, (g) => {
      // Grass base
      g.fillStyle = PAL.GRASS_BASE;
      g.fillRect(0, 0, TILE, TILE);
      
      // Multiple flower types
      // Red flower
      g.fillStyle = PAL.FLOWER_RED;
      g.fillRect(3, 4, 3, 3);
      g.fillStyle = PAL.FLOWER_PINK;
      g.fillRect(4, 5, 1, 1);
      
      // Yellow flower
      g.fillStyle = PAL.FLOWER_YELLOW;
      g.fillRect(10, 8, 3, 3);
      g.fillStyle = PAL.FLOWER_WHITE;
      g.fillRect(11, 9, 1, 1);
      
      // White flower
      g.fillStyle = PAL.FLOWER_WHITE;
      g.fillRect(6, 11, 2, 2);
      
      // Stems
      g.fillStyle = PAL.GRASS_DARK;
      g.fillRect(4, 7, 1, 3);
      g.fillRect(11, 11, 1, 2);
      g.fillRect(6, 13, 1, 2);
    });
    
    // Row 1: Additional tiles (rocks, etc.)
    
    // Tile 16: Rock
    drawTile(0, 1, (g) => {
      // Rock with gradient
      const rockGrad = g.createRadialGradient(8, 8, 2, 8, 8, 6);
      rockGrad.addColorStop(0, '#A0A0A0');
      rockGrad.addColorStop(0.5, '#808080');
      rockGrad.addColorStop(1, '#606060');
      
      g.fillStyle = rockGrad;
      g.beginPath();
      g.moveTo(4, 10);
      g.lineTo(6, 6);
      g.lineTo(10, 6);
      g.lineTo(12, 10);
      g.lineTo(10, 13);
      g.lineTo(6, 13);
      g.closePath();
      g.fill();
      
      // Highlights
      g.fillStyle = '#B0B0B0';
      g.fillRect(7, 7, 2, 2);
      
      // Shadow
      g.fillStyle = 'rgba(0, 0, 0, 0.3)';
      g.fillRect(4, 13, 8, 2);
    });
    
    const img = new Image();
    img.src = c.toDataURL();
    return img;
  }
  
  // Create Emerald-style player sprite
  function makeEmeraldPlayer() {
    const fw = 16, fh = 24;
    const cols = 4; // 4 frames for smoother animation
    const rows = 4; // 4 directions
    
    const c = document.createElement('canvas');
    c.width = fw * cols;
    c.height = fh * rows;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    function drawCharacter(x, y, dir, frame) {
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(x + 8, y + 22, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Walking animation offset
      const walkOffset = Math.sin(frame * Math.PI / 2) * 2;
      const armSwing = Math.sin(frame * Math.PI / 2 + Math.PI) * 2;
      
      // Body
      ctx.fillStyle = '#E85088';
      ctx.fillRect(x + 4, y + 9, 8, 8);
      
      // Body shading
      ctx.fillStyle = '#D04078';
      ctx.fillRect(x + 4, y + 14, 8, 3);
      
      // Head
      ctx.fillStyle = '#F8C890';
      ctx.fillRect(x + 5, y + 3, 6, 6);
      
      // Hair
      ctx.fillStyle = '#704028';
      ctx.fillRect(x + 4, y + 1, 8, 4);
      ctx.fillStyle = '#805838';
      ctx.fillRect(x + 5, y + 1, 6, 2);
      
      // Face details (direction-dependent)
      if (dir === 0) { // Down
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 6, y + 5, 1, 1);
        ctx.fillRect(x + 9, y + 5, 1, 1);
        
        ctx.fillStyle = '#F8A070';
        ctx.fillRect(x + 6, y + 7, 4, 1);
      }
      
      // Arms
      ctx.fillStyle = '#F8C890';
      ctx.fillRect(x + 3, y + 10 + armSwing / 2, 2, 5);
      ctx.fillRect(x + 11, y + 10 - armSwing / 2, 2, 5);
      
      // Legs with animation
      ctx.fillStyle = '#3060A8';
      ctx.fillRect(x + 5, y + 16 + Math.abs(walkOffset), 3, 5);
      ctx.fillRect(x + 8, y + 16 - Math.abs(walkOffset), 3, 5);
      
      // Shoes
      ctx.fillStyle = '#303030';
      ctx.fillRect(x + 5, y + 20 + Math.abs(walkOffset), 3, 2);
      ctx.fillRect(x + 8, y + 20 - Math.abs(walkOffset), 3, 2);
    }
    
    // Generate all frames
    for (let dir = 0; dir < rows; dir++) {
      for (let frame = 0; frame < cols; frame++) {
        drawCharacter(frame * fw, dir * fh, dir, frame);
      }
    }
    
    const img = new Image();
    img.src = c.toDataURL();
    return img;
  }
  
  // Create 9-slice panel for dialogue
  function makeEmeraldPanel() {
    const s = 8; // slice size
    const c = document.createElement('canvas');
    c.width = s * 3;
    c.height = s * 3;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    function drawSlice(x, y, isCorner, isEdge) {
      // Base fill
      const grad = ctx.createLinearGradient(x, y, x + s, y + s);
      grad.addColorStop(0, PAL.UI_BG);
      grad.addColorStop(1, 'rgba(248, 248, 240, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, s, s);
      
      // Border
      ctx.strokeStyle = PAL.UI_BORDER;
      ctx.lineWidth = 1;
      
      if (isCorner) {
        ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      } else if (isEdge) {
        ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      }
      
      // Inner shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(x, y, s, 1);
      ctx.fillRect(x, y, 1, s);
    }
    
    // Draw all 9 slices
    for (let iy = 0; iy < 3; iy++) {
      for (let ix = 0; ix < 3; ix++) {
        const isCorner = (ix === 0 || ix === 2) && (iy === 0 || iy === 2);
        const isEdge = !isCorner && (ix === 1 || iy === 1);
        drawSlice(ix * s, iy * s, isCorner, isEdge);
      }
    }
    
    const img = new Image();
    img.src = c.toDataURL();
    return img;
  }
  
  // ============================================================================
  // WORLD GENERATION
  // ============================================================================
  
  const VIEW_W = Math.floor(BASE_W / TILE);
  const VIEW_H = Math.floor(BASE_H / TILE);
  const W = 48, H = 32;
  
  // Tile indices
  const T = {
    GRASS0: 0, GRASS1: 1, GRASS2: 2,
    PATH0: 3, PATH1: 4, PATH2: 5,
    TRUNK: 6, TOP: 7,
    WATER0: 8, WATER1: 9,
    TALL0: 10, TALL1: 11,
    FLOWER: 12,
    ROCK: 16
  };
  
  const SOLID = new Set([T.TRUNK, T.WATER0, T.WATER1, T.ROCK]);
  
  // Generate base map
  const base = Array.from({ length: H }, (_, y) => 
    Array.from({ length: W }, (_, x) => {
      // Border trees
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
        return T.TRUNK;
      }
      
      // Water pond
      if (x > 12 && x < 18 && y > 8 && y < 14) {
        return T.WATER0;
      }
      
      // Paths
      if (y === 12 && x > 3 && x < W - 3) {
        return x % 3 === 0 ? T.PATH0 : (x % 3 === 1 ? T.PATH1 : T.PATH2);
      }
      if (x === 20 && y > 3 && y < H - 3) {
        return y % 3 === 0 ? T.PATH0 : (y % 3 === 1 ? T.PATH1 : T.PATH2);
      }
      
      // Varied grass
      const grassNoise = (x * 7 + y * 11) % 3;
      return grassNoise === 0 ? T.GRASS0 : (grassNoise === 1 ? T.GRASS1 : T.GRASS2);
    })
  );
  
  // Overlap layer for tree tops
  const over = Array.from({ length: H }, () => 
    Array.from({ length: W }, () => -1)
  );
  
  // Add flowers
  const flowerPositions = [
    [7, 7], [8, 7], [9, 7],
    [24, 14], [25, 14], [26, 14],
    [30, 20], [31, 20],
    [10, 25], [11, 25]
  ];
  
  flowerPositions.forEach(([x, y]) => {
    if (base[y] && base[y][x] !== undefined && base[y][x] < T.PATH0) {
      base[y][x] = T.FLOWER;
    }
  });
  
  // Add tall grass areas
  for (let x = 30; x < 38 && x < W; x++) {
    for (let y = 6; y < 12 && y < H; y++) {
      if (base[y][x] < T.PATH0) {
        base[y][x] = (x + y) % 2 ? T.TALL0 : T.TALL1;
      }
    }
  }
  
  // Add trees with overlapping tops
  for (let x = 5; x < W - 5; x += 7) {
    for (let y = 5; y < H - 5; y += 8) {
      if (base[y][x] < T.PATH0) {
        base[y][x] = T.TRUNK;
        if (y > 0) over[y - 1][x] = T.TOP;
      }
    }
  }
  
  // Add rocks
  const rockPositions = [
    [10, 5], [35, 8], [25, 25], [8, 18]
  ];
  
  rockPositions.forEach(([x, y]) => {
    if (base[y] && base[y][x] !== undefined && base[y][x] < T.PATH0) {
      base[y][x] = T.ROCK;
    }
  });
  
  // ============================================================================
  // ENTITIES
  // ============================================================================
  
  const DIR = { D: 0, U: 1, L: 2, R: 3 };
  
  class Actor {
    constructor(tx, ty) {
      this.tx = tx; // Tile position
      this.ty = ty;
      this.x = tx * TILE; // Pixel position
      this.y = ty * TILE;
      this.w = 12;
      this.h = 18;
      this.dir = DIR.D;
      this.frame = 0;
      this.moving = false;
      this.speed = 2;
      this.animTimer = 0;
    }
    
    tryMove(dx, dy) {
      if (this.moving) return false;
      
      // Update direction
      if (Math.abs(dx) > Math.abs(dy)) {
        this.dir = dx < 0 ? DIR.L : DIR.R;
      } else if (Math.abs(dy) > 0) {
        this.dir = dy < 0 ? DIR.U : DIR.D;
      }
      
      // Check collision
      const nx = this.tx + Math.sign(dx);
      const ny = this.ty + Math.sign(dy);
      
      if (this.collides(nx, ny)) return false;
      
      this.tx = nx;
      this.ty = ny;
      this.moving = true;
      return true;
    }
    
    collides(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
      const tile = base[ty][tx];
      return SOLID.has(tile);
    }
    
    update(dt) {
      if (this.moving) {
        const targetX = this.tx * TILE;
        const targetY = this.ty * TILE;
        
        // Move towards target
        if (this.x < targetX) this.x = Math.min(this.x + this.speed, targetX);
        if (this.x > targetX) this.x = Math.max(this.x - this.speed, targetX);
        if (this.y < targetY) this.y = Math.min(this.y + this.speed, targetY);
        if (this.y > targetY) this.y = Math.max(this.y - this.speed, targetY);
        
        // Check if reached target
        if (this.x === targetX && this.y === targetY) {
          this.moving = false;
        }
        
        // Animate
        this.animTimer += dt;
        if (this.animTimer > 150) {
          this.animTimer = 0;
          this.frame = (this.frame + 1) % 4;
        }
      } else {
        this.frame = 0;
      }
    }
  }
  
  // Create player and NPCs
  const player = new Actor(5, 5);
  const npc = new Actor(12, 12);
  npc.speed = 0;
  npc.dialogue = [
    "Welcome! These are Pokémon Emerald-style graphics!",
    "This procedural pixel art matches real GBA quality.",
    "You can add your own sprites to the assets/ folder!"
  ];
  
  // ============================================================================
  // INPUT HANDLING
  // ============================================================================
  
  const keys = new Set();
  const pressed = new Set();
  
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 
         'w', 'a', 's', 'd', 'z', 'enter', 'p', 'r'].includes(k)) {
      e.preventDefault();
    }
    keys.add(k);
  });
  
  addEventListener('keyup', e => {
    keys.delete(e.key.toLowerCase());
  });
  
  function justPressed(arr) {
    for (const k of arr) {
      if (keys.has(k) && !pressed.has(k)) {
        pressed.add(k);
        return true;
      }
    }
    for (const k of [...pressed]) {
      if (!keys.has(k)) pressed.delete(k);
    }
    return false;
  }
  
  // ============================================================================
  // DIALOGUE SYSTEM
  // ============================================================================
  
  const dlg = {
    open: false,
    lines: [],
    page: 0,
    shown: 0,
    speed: 2,
    hold: false
  };
  
  function startDialogue(lines) {
    Object.assign(dlg, {
      open: true,
      lines,
      page: 0,
      shown: 0,
      hold: false
    });
  }
  
  function advanceDialogue() {
    if (!dlg.open) return;
    
    if (!dlg.hold) {
      dlg.shown = dlg.lines[dlg.page].length;
      dlg.hold = true;
    } else if (dlg.page < dlg.lines.length - 1) {
      dlg.page++;
      dlg.shown = 0;
      dlg.hold = false;
    } else {
      dlg.open = false;
    }
  }
  
  function facingNPC() {
    let fx = player.tx;
    let fy = player.ty;
    
    if (player.dir === DIR.U) fy--;
    else if (player.dir === DIR.D) fy++;
    else if (player.dir === DIR.L) fx--;
    else if (player.dir === DIR.R) fx++;
    
    return fx === npc.tx && fy === npc.ty;
  }
  
  // ============================================================================
  // CAMERA
  // ============================================================================
  
  const camera = { x: 0, y: 0 };
  
  function focusCamera() {
    const vw = VIEW_W * TILE;
    const vh = VIEW_H * TILE;
    
    camera.x = Math.floor(player.x + player.w / 2 - vw / 2);
    camera.y = Math.floor(player.y + player.h / 2 - vh / 2);
    
    camera.x = Math.max(0, Math.min(camera.x, W * TILE - vw));
    camera.y = Math.max(0, Math.min(camera.y, H * TILE - vh));
  }
  
  // ============================================================================
  // RENDERING
  // ============================================================================
  
  let waterTimer = 0;
  let grassTimer = 0;
  
  function drawTile(id, sx, sy) {
    const cols = Math.floor(assets.tileset.width / TILE);
    let useId = id;
    
    // Animate water
    if (id === T.WATER0 || id === T.WATER1) {
      useId = Math.floor(waterTimer / 400) % 2 ? T.WATER1 : T.WATER0;
    }
    
    // Animate tall grass
    if (id === T.TALL0 || id === T.TALL1) {
      useId = Math.floor(grassTimer / 300) % 2 ? T.TALL1 : T.TALL0;
    }
    
    const tileX = (useId % cols) * TILE;
    const tileY = Math.floor(useId / cols) * TILE;
    
    g.drawImage(
      assets.tileset,
      tileX, tileY, TILE, TILE,
      sx, sy, TILE, TILE
    );
    
    // Subtle highlight for depth
    g.globalAlpha = 0.08;
    g.fillStyle = '#ffffff';
    g.fillRect(sx, sy, TILE, 2);
    g.globalAlpha = 1;
  }
  
  function drawMap() {
    const stx = Math.floor(camera.x / TILE);
    const sty = Math.floor(camera.y / TILE);
    const offX = -(camera.x % TILE);
    const offY = -(camera.y % TILE);
    
    for (let ty = 0; ty <= VIEW_H; ty++) {
      for (let tx = 0; tx <= VIEW_W; tx++) {
        const mx = stx + tx;
        const my = sty + ty;
        
        if (mx >= 0 && my >= 0 && mx < W && my < H) {
          const id = base[my][mx];
          drawTile(id, tx * TILE + offX, ty * TILE + offY);
        }
      }
    }
  }
  
  function drawOverlay() {
    const stx = Math.floor(camera.x / TILE);
    const sty = Math.floor(camera.y / TILE);
    const offX = -(camera.x % TILE);
    const offY = -(camera.y % TILE);
    
    for (let ty = 0; ty <= VIEW_H; ty++) {
      for (let tx = 0; tx <= VIEW_W; tx++) {
        const mx = stx + tx;
        const my = sty + ty;
        
        if (mx >= 0 && my >= 0 && mx < W && my < H) {
          const id = over[my][mx];
          if (id >= 0) {
            drawTile(id, tx * TILE + offX, ty * TILE + offY);
          }
        }
      }
    }
  }
  
  function drawShadow(actor) {
    const sx = Math.floor(actor.x - camera.x) + 8;
    const sy = Math.floor(actor.y - camera.y) + 16;
    
    g.save();
    g.globalAlpha = 0.3;
    g.fillStyle = '#000000';
    g.beginPath();
    g.ellipse(sx, sy, 5, 2, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  
  function drawActor(actor, sprite) {
    const fw = 16, fh = 24;
    const sx = Math.floor(actor.x - camera.x);
    const sy = Math.floor(actor.y - camera.y - 8);
    
    // Draw shadow
    drawShadow(actor);
    
    // Draw sprite
    g.drawImage(
      sprite,
      actor.frame * fw, actor.dir * fh, fw, fh,
      sx, sy, fw, fh
    );
  }
  
  function drawPanel9(x, y, w, h) {
    const s = 8; // slice size
    const img = assets.panel;
    
    // Corners
    g.drawImage(img, 0, 0, s, s, x, y, s, s);
    g.drawImage(img, s * 2, 0, s, s, x + w - s, y, s, s);
    g.drawImage(img, 0, s * 2, s, s, x, y + h - s, s, s);
    g.drawImage(img, s * 2, s * 2, s, s, x + w - s, y + h - s, s, s);
    
    // Edges
    g.drawImage(img, s, 0, s, s, x + s, y, w - 2 * s, s);
    g.drawImage(img, s, s * 2, s, s, x + s, y + h - s, w - 2 * s, s);
    g.drawImage(img, 0, s, s, s, x, y + s, s, h - 2 * s);
    g.drawImage(img, s * 2, s, s, s, x + w - s, y + s, s, h - 2 * s);
    
    // Center
    g.drawImage(img, s, s, s, s, x + s, y + s, w - 2 * s, h - 2 * s);
  }
  
  function drawDialogue() {
    if (!dlg.open) return;
    
    const margin = 8;
    const boxH = 56;
    const x = margin;
    const y = BASE_H - boxH - margin;
    const w = BASE_W - margin * 2;
    const h = boxH;
    
    // Draw panel
    drawPanel9(x, y, w, h);
    
    // Typewriter effect
    const text = dlg.lines[dlg.page];
    if (dlg.shown < text.length) {
      dlg.shown = Math.min(text.length, dlg.shown + dlg.speed);
      if (dlg.shown === text.length) dlg.hold = true;
    }
    
    // Draw text
    g.save();
    g.beginPath();
    g.rect(x + 10, y + 8, w - 20, h - 16);
    g.clip();
    
    g.fillStyle = PAL.TEXT;
    g.font = 'bold 10px monospace';
    g.textBaseline = 'top';
    
    const shown = text.slice(0, dlg.shown);
    const lines = wrapText(shown, w - 20);
    
    lines.forEach((ln, i) => {
      g.fillText(ln, x + 10, y + 10 + i * 12);
    });
    
    g.restore();
    
    // Continue indicator
    if (dlg.hold) {
      const time = Date.now() / 400;
      if (Math.floor(time) % 2 === 0) {
        g.fillStyle = PAL.TEXT;
        g.beginPath();
        g.moveTo(x + w - 16, y + h - 16);
        g.lineTo(x + w - 12, y + h - 12);
        g.lineTo(x + w - 16, y + h - 8);
        g.closePath();
        g.fill();
      }
    }
  }
  
  function wrapText(text, maxW) {
    const words = text.split(' ');
    const out = [];
    let cur = '';
    
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (g.measureText(t).width <= maxW) {
        cur = t;
      } else {
        if (cur) out.push(cur);
        cur = w;
      }
    }
    
    if (cur) out.push(cur);
    return out;
  }
  
  // ============================================================================
  // GAME LOOP
  // ============================================================================
  
  let last = performance.now();
  let paused = false;
  
  function update(dt) {
    // Handle pause
    if (justPressed(['p'])) {
      paused = !paused;
    }
    
    if (paused) return;
    
    // Handle dialogue
    if (dlg.open) {
      if (justPressed(['z', 'enter'])) {
        advanceDialogue();
      }
      return;
    }
    
    // Player movement
    if (!player.moving) {
      if (keys.has('arrowup') || keys.has('w')) {
        player.tryMove(0, -1);
      } else if (keys.has('arrowdown') || keys.has('s')) {
        player.tryMove(0, 1);
      } else if (keys.has('arrowleft') || keys.has('a')) {
        player.tryMove(-1, 0);
      } else if (keys.has('arrowright') || keys.has('d')) {
        player.tryMove(1, 0);
      }
    }
    
    // Interaction
    if (justPressed(['z', 'enter'])) {
      if (facingNPC()) {
        startDialogue(npc.dialogue);
      }
    }
    
    // Reset
    if (justPressed(['r'])) {
      player.tx = 5;
      player.ty = 5;
      player.x = 5 * TILE;
      player.y = 5 * TILE;
      player.dir = DIR.D;
      player.moving = false;
    }
    
    // Update entities
    player.update(dt);
    npc.update(dt);
    
    // Update timers
    waterTimer += dt;
    grassTimer += dt;
    
    // Update camera
    focusCamera();
  }
  
  function render() {
    // Clear
    g.fillStyle = '#000000';
    g.fillRect(0, 0, BASE_W, BASE_H);
    
    // Draw layers
    drawMap();
    
    // Draw entities (sorted by Y)
    const entities = [npc, player].sort((a, b) => a.y - b.y);
    entities.forEach(e => {
      drawActor(e, assets.player);
    });
    
    // Draw overlay (tree tops, etc.)
    drawOverlay();
    
    // Draw UI
    drawDialogue();
    
    // Apply GBA post-processing
    let img = g.getImageData(0, 0, BASE_W, BASE_H);
    g.putImageData(quantizeBGR555(img), 0, 0);
    
    // Apply scanlines
    g.drawImage(scanlines, 0, 0);
    
    // Scale to display
    sctx.imageSmoothingEnabled = false;
    sctx.clearRect(0, 0, screen.width, screen.height);
    sctx.drawImage(buf, 0, 0, screen.width, screen.height);
    
    // Draw pause overlay
    if (paused) {
      sctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      sctx.fillRect(0, 0, screen.width, screen.height);
      
      sctx.fillStyle = '#ffffff';
      sctx.font = 'bold 32px monospace';
      sctx.textAlign = 'center';
      sctx.fillText('PAUSED', screen.width / 2, screen.height / 2);
      sctx.font = '20px monospace';
      sctx.fillText('Press P to resume', screen.width / 2, screen.height / 2 + 40);
      sctx.textAlign = 'left';
    }
  }
  
  function loop(ts) {
    const dt = Math.min(32, ts - last);
    last = ts;
    
    update(dt);
    render();
    
    requestAnimationFrame(loop);
  }
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  (async () => {
    await loadAssets();
    requestAnimationFrame(loop);
  })();
})();