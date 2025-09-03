/* Game Boy Advance SP Authentic RPG Engine
   - Native GBA SP resolution: 240x160 pixels
   - Authentic GBA color palette and rendering
   - Mode 0 tile-based graphics with proper layers
   - GBA SP-style sprites and animations
*/

(() => {
  // GBA SP Native Constants
  const GBA_WIDTH = 240;
  const GBA_HEIGHT = 160;
  const TILE_SIZE = 8; // GBA uses 8x8 tiles
  const SPRITE_TILE = 16; // Sprites use 16x16 or 16x32
  const BG_TILES_X = 32; // Background is 32x32 tiles
  const BG_TILES_Y = 32;
  const SCREEN_TILES_X = 30; // 240/8 = 30 visible tiles
  const SCREEN_TILES_Y = 20; // 160/8 = 20 visible tiles

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  // ============================================================================
  // GBA COLOR PALETTE
  // ============================================================================
  
  const GBA_PALETTE = {
    // Pokemon Ruby/Sapphire/Emerald palette
    BLACK: '#000000',
    WHITE: '#F8F8F8',
    
    // Greens (grass, trees)
    DARK_GREEN: '#004A00',
    MID_GREEN: '#00A800',
    LIGHT_GREEN: '#58D858',
    PALE_GREEN: '#A8E8A8',
    
    // Browns (ground, paths)
    DARK_BROWN: '#503000',
    MID_BROWN: '#A06850',
    LIGHT_BROWN: '#D0B090',
    
    // Blues (water, sky)
    DARK_BLUE: '#003060',
    MID_BLUE: '#0078F8',
    LIGHT_BLUE: '#58B8F8',
    WATER_BLUE: '#6888F8',
    
    // Reds/Pinks (flowers, UI)
    DARK_RED: '#A80020',
    MID_RED: '#F83800',
    PINK: '#F878F8',
    
    // Grays (rocks, buildings)
    DARK_GRAY: '#404040',
    MID_GRAY: '#787878',
    LIGHT_GRAY: '#B8B8B8',
    
    // Character colors
    SKIN: '#F8B888',
    SKIN_SHADOW: '#D08850',
    
    // UI colors
    UI_BG: '#F8F0E8',
    UI_BORDER: '#000000',
    UI_TEXT: '#000000',
    UI_SHADOW: '#B8B0A8'
  };

  // ============================================================================
  // GBA TILESET GENERATION
  // ============================================================================
  
  function createGBATileset() {
    const tilesetWidth = 128; // 16 tiles wide
    const tilesetHeight = 256; // 32 tiles tall
    const cvs = document.createElement('canvas');
    cvs.width = tilesetWidth;
    cvs.height = tilesetHeight;
    const g = cvs.getContext('2d');
    g.imageSmoothingEnabled = false;

    // Helper to draw 8x8 tile
    function drawTile8(x, y, pixels) {
      for (let py = 0; py < 8; py++) {
        for (let px = 0; px < 8; px++) {
          if (pixels[py] && pixels[py][px]) {
            g.fillStyle = pixels[py][px];
            g.fillRect(x + px, y + py, 1, 1);
          }
        }
      }
    }

    // Grass tiles (multiple variations for GBA-style variety)
    const grassPattern1 = [
      [0,0,0,0,0,0,0,0],
      [0,1,0,0,0,0,1,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,1,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,1,0,0,0,1,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,1,0,0,0]
    ].map(row => row.map(v => v ? GBA_PALETTE.MID_GREEN : GBA_PALETTE.LIGHT_GREEN));
    
    drawTile8(0, 0, grassPattern1);
    
    // Path tile
    const pathPattern = [
      [1,1,0,1,1,1,0,1],
      [1,0,1,1,0,1,1,0],
      [0,1,1,0,1,0,1,1],
      [1,1,0,1,1,1,0,1],
      [1,0,1,1,0,1,1,0],
      [0,1,1,0,1,1,0,1],
      [1,1,0,1,0,1,1,0],
      [1,0,1,1,1,0,1,1]
    ].map(row => row.map(v => v ? GBA_PALETTE.LIGHT_BROWN : GBA_PALETTE.MID_BROWN));
    
    drawTile8(8, 0, pathPattern);

    // Tree tiles (4 tiles make a tree in GBA style)
    // Top-left
    const treeTopLeft = [
      [0,0,0,1,1,1,1,1],
      [0,0,1,2,2,2,2,2],
      [0,1,2,2,3,3,3,2],
      [1,2,2,3,3,3,3,3],
      [1,2,3,3,3,3,3,3],
      [1,2,3,3,3,3,3,3],
      [1,2,3,3,3,3,3,3],
      [1,2,2,3,3,3,3,3]
    ].map(row => row.map(v => {
      if (v === 0) return null;
      if (v === 1) return GBA_PALETTE.DARK_GREEN;
      if (v === 2) return GBA_PALETTE.MID_GREEN;
      return GBA_PALETTE.LIGHT_GREEN;
    }));
    
    drawTile8(16, 0, treeTopLeft);

    // Top-right
    const treeTopRight = [
      [1,1,1,1,1,0,0,0],
      [2,2,2,2,2,1,0,0],
      [2,3,3,3,2,2,1,0],
      [3,3,3,3,3,2,2,1],
      [3,3,3,3,3,3,2,1],
      [3,3,3,3,3,3,2,1],
      [3,3,3,3,3,3,2,1],
      [3,3,3,3,3,2,2,1]
    ].map(row => row.map(v => {
      if (v === 0) return null;
      if (v === 1) return GBA_PALETTE.DARK_GREEN;
      if (v === 2) return GBA_PALETTE.MID_GREEN;
      return GBA_PALETTE.LIGHT_GREEN;
    }));
    
    drawTile8(24, 0, treeTopRight);

    // Water tile with animation frames
    const waterFrame1 = [
      [1,1,2,2,1,1,2,2],
      [1,2,3,3,2,1,2,3],
      [2,3,3,3,3,2,3,3],
      [2,3,3,3,3,2,3,3],
      [1,2,3,3,2,1,2,3],
      [1,1,2,2,1,1,2,2],
      [2,1,1,2,2,1,1,2],
      [3,2,1,2,3,2,1,2]
    ].map(row => row.map(v => {
      if (v === 1) return GBA_PALETTE.DARK_BLUE;
      if (v === 2) return GBA_PALETTE.MID_BLUE;
      return GBA_PALETTE.WATER_BLUE;
    }));
    
    drawTile8(32, 0, waterFrame1);

    // Flower tile
    const flowerTile = [
      [0,0,0,0,0,0,0,0],
      [0,0,1,1,1,0,0,0],
      [0,1,2,2,2,1,0,0],
      [0,1,2,3,2,1,0,0],
      [0,0,1,1,1,0,0,0],
      [0,0,0,4,0,0,0,0],
      [0,0,4,4,4,0,0,0],
      [0,0,0,4,0,0,0,0]
    ].map(row => row.map(v => {
      if (v === 0) return GBA_PALETTE.LIGHT_GREEN;
      if (v === 1) return GBA_PALETTE.DARK_RED;
      if (v === 2) return GBA_PALETTE.MID_RED;
      if (v === 3) return GBA_PALETTE.PINK;
      return GBA_PALETTE.MID_GREEN;
    }));
    
    drawTile8(40, 0, flowerTile);

    // Tall grass for encounters
    const tallGrass = [
      [0,1,0,0,1,0,1,0],
      [1,1,1,0,1,1,1,1],
      [1,2,1,1,1,2,1,1],
      [1,2,2,1,2,2,2,1],
      [2,2,2,2,2,2,2,2],
      [2,3,2,2,2,3,2,2],
      [3,3,3,2,3,3,3,3],
      [3,3,3,3,3,3,3,3]
    ].map(row => row.map(v => {
      if (v === 0) return GBA_PALETTE.LIGHT_GREEN;
      if (v === 1) return GBA_PALETTE.MID_GREEN;
      if (v === 2) return GBA_PALETTE.DARK_GREEN;
      return GBA_PALETTE.DARK_GREEN;
    }));
    
    drawTile8(48, 0, tallGrass);

    const img = new Image();
    img.src = cvs.toDataURL();
    return img;
  }

  // ============================================================================
  // GBA SPRITE GENERATION
  // ============================================================================
  
  function createGBASprite(colors) {
    const spriteWidth = 16;
    const spriteHeight = 32; // GBA uses 16x32 for character sprites
    const frames = 3; // Idle, step1, step2
    const directions = 4; // Down, Up, Left, Right
    
    const cvs = document.createElement('canvas');
    cvs.width = spriteWidth * frames;
    cvs.height = spriteHeight * directions;
    const g = cvs.getContext('2d');
    g.imageSmoothingEnabled = false;

    function drawSprite(x, y, dir, frame) {
      // GBA-style character with more detail
      const outfit = colors.outfit || GBA_PALETTE.MID_RED;
      const hair = colors.hair || GBA_PALETTE.DARK_BROWN;
      
      // Clear area
      g.clearRect(x, y, spriteWidth, spriteHeight);
      
      // Shadow
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(x + 4, y + 29, 8, 2);

      // Walking animation
      let leftLegY = 0, rightLegY = 0;
      if (frame === 1) leftLegY = -1;
      if (frame === 2) rightLegY = -1;

      if (dir === 0) { // Down
        // Hair back
        g.fillStyle = hair;
        g.fillRect(x + 4, y + 4, 8, 2);
        
        // Head
        g.fillStyle = GBA_PALETTE.SKIN;
        g.fillRect(x + 5, y + 5, 6, 6);
        
        // Hair front
        g.fillStyle = hair;
        g.fillRect(x + 4, y + 3, 8, 3);
        g.fillRect(x + 3, y + 4, 1, 2);
        g.fillRect(x + 12, y + 4, 1, 2);
        
        // Eyes
        g.fillStyle = GBA_PALETTE.BLACK;
        g.fillRect(x + 6, y + 7, 1, 1);
        g.fillRect(x + 9, y + 7, 1, 1);
        
        // Body
        g.fillStyle = outfit;
        g.fillRect(x + 5, y + 11, 6, 8);
        g.fillRect(x + 4, y + 12, 8, 6);
        
        // Arms
        g.fillStyle = GBA_PALETTE.SKIN;
        g.fillRect(x + 3, y + 12, 2, 5);
        g.fillRect(x + 11, y + 12, 2, 5);
        
        // Legs
        g.fillStyle = GBA_PALETTE.DARK_BLUE;
        g.fillRect(x + 5, y + 19 + leftLegY, 3, 6 - leftLegY);
        g.fillRect(x + 8, y + 19 + rightLegY, 3, 6 - rightLegY);
        
        // Shoes
        g.fillStyle = GBA_PALETTE.DARK_BROWN;
        g.fillRect(x + 5, y + 25 + leftLegY, 3, 3);
        g.fillRect(x + 8, y + 25 + rightLegY, 3, 3);
        
      } else if (dir === 1) { // Up
        // Head (back)
        g.fillStyle = GBA_PALETTE.SKIN;
        g.fillRect(x + 5, y + 5, 6, 6);
        
        // Hair (back view)
        g.fillStyle = hair;
        g.fillRect(x + 3, y + 3, 10, 6);
        
        // Body
        g.fillStyle = outfit;
        g.fillRect(x + 5, y + 11, 6, 8);
        g.fillRect(x + 4, y + 12, 8, 6);
        
        // Arms
        g.fillStyle = GBA_PALETTE.SKIN;
        g.fillRect(x + 3, y + 12, 2, 5);
        g.fillRect(x + 11, y + 12, 2, 5);
        
        // Legs
        g.fillStyle = GBA_PALETTE.DARK_BLUE;
        g.fillRect(x + 5, y + 19 + leftLegY, 3, 6 - leftLegY);
        g.fillRect(x + 8, y + 19 + rightLegY, 3, 6 - rightLegY);
        
        // Shoes
        g.fillStyle = GBA_PALETTE.DARK_BROWN;
        g.fillRect(x + 5, y + 25 + leftLegY, 3, 3);
        g.fillRect(x + 8, y + 25 + rightLegY, 3, 3);
        
      } else if (dir === 2) { // Left
        // Head
        g.fillStyle = GBA_PALETTE.SKIN;
        g.fillRect(x + 5, y + 5, 6, 6);
        
        // Hair
        g.fillStyle = hair;
        g.fillRect(x + 4, y + 3, 8, 3);
        g.fillRect(x + 3, y + 4, 2, 3);
        
        // Eye
        g.fillStyle = GBA_PALETTE.BLACK;
        g.fillRect(x + 6, y + 7, 1, 1);
        
        // Body
        g.fillStyle = outfit;
        g.fillRect(x + 5, y + 11, 6, 8);
        
        // Arm
        g.fillStyle = GBA_PALETTE.SKIN;
        g.fillRect(x + 4, y + 12, 2, 5);
        
        // Legs
        g.fillStyle = GBA_PALETTE.DARK_BLUE;
        g.fillRect(x + 5, y + 19 + leftLegY, 3, 6 - leftLegY);
        g.fillRect(x + 8, y + 19 + rightLegY, 3, 6 - rightLegY);
        
        // Shoes
        g.fillStyle = GBA_PALETTE.DARK_BROWN;
        g.fillRect(x + 5, y + 25 + leftLegY, 3, 3);
        g.fillRect(x + 8, y + 25 + rightLegY, 3, 3);
        
      } else { // Right
        // Head
        g.fillStyle = GBA_PALETTE.SKIN;
        g.fillRect(x + 5, y + 5, 6, 6);
        
        // Hair
        g.fillStyle = hair;
        g.fillRect(x + 4, y + 3, 8, 3);
        g.fillRect(x + 11, y + 4, 2, 3);
        
        // Eye
        g.fillStyle = GBA_PALETTE.BLACK;
        g.fillRect(x + 9, y + 7, 1, 1);
        
        // Body
        g.fillStyle = outfit;
        g.fillRect(x + 5, y + 11, 6, 8);
        
        // Arm
        g.fillStyle = GBA_PALETTE.SKIN;
        g.fillRect(x + 10, y + 12, 2, 5);
        
        // Legs
        g.fillStyle = GBA_PALETTE.DARK_BLUE;
        g.fillRect(x + 5, y + 19 + leftLegY, 3, 6 - leftLegY);
        g.fillRect(x + 8, y + 19 + rightLegY, 3, 6 - rightLegY);
        
        // Shoes
        g.fillStyle = GBA_PALETTE.DARK_BROWN;
        g.fillRect(x + 5, y + 25 + leftLegY, 3, 3);
        g.fillRect(x + 8, y + 25 + rightLegY, 3, 3);
      }
    }

    // Generate all animation frames
    for (let d = 0; d < directions; d++) {
      for (let f = 0; f < frames; f++) {
        drawSprite(f * spriteWidth, d * spriteHeight, d, f);
      }
    }

    const img = new Image();
    img.src = cvs.toDataURL();
    return img;
  }

  // ============================================================================
  // MAP GENERATION (GBA-STYLE)
  // ============================================================================
  
  const MAP_WIDTH = 64;
  const MAP_HEIGHT = 64;
  
  // GBA tile indices
  const TILES = {
    GRASS: 0,
    PATH: 1,
    TREE_TL: 2,
    TREE_TR: 3,
    WATER: 4,
    FLOWER: 5,
    TALL_GRASS: 6
  };
  
  const SOLID_TILES = new Set([TILES.TREE_TL, TILES.TREE_TR, TILES.WATER]);
  
  // Generate GBA-style map
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      // Default grass
      map[y][x] = TILES.GRASS;
      
      // Add paths
      if ((y === 16 || y === 32 || y === 48) && x > 8 && x < MAP_WIDTH - 8) {
        map[y][x] = TILES.PATH;
      }
      if ((x === 16 || x === 32 || x === 48) && y > 8 && y < MAP_HEIGHT - 8) {
        map[y][x] = TILES.PATH;
      }
      
      // Add random flowers
      if (Math.random() < 0.03 && map[y][x] === TILES.GRASS) {
        map[y][x] = TILES.FLOWER;
      }
      
      // Add tall grass areas
      if (x > 20 && x < 30 && y > 20 && y < 30) {
        map[y][x] = TILES.TALL_GRASS;
      }
      
      // Add water pond
      if (x > 40 && x < 50 && y > 40 && y < 50) {
        const dx = x - 45;
        const dy = y - 45;
        if (dx * dx + dy * dy < 25) {
          map[y][x] = TILES.WATER;
        }
      }
    }
  }
  
  // Add trees (2x2 tiles each)
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(Math.random() * (MAP_WIDTH - 2));
    const y = Math.floor(Math.random() * (MAP_HEIGHT - 2));
    if (map[y][x] === TILES.GRASS && map[y][x+1] === TILES.GRASS) {
      map[y][x] = TILES.TREE_TL;
      map[y][x+1] = TILES.TREE_TR;
    }
  }

  // ============================================================================
  // GAME ENTITIES
  // ============================================================================
  
  class Entity {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 12;
      this.height = 12;
      this.direction = 0; // 0=down, 1=up, 2=left, 3=right
      this.frame = 0;
      this.animTimer = 0;
      this.isMoving = false;
      this.speed = 1.5; // GBA movement speed
    }
    
    checkCollision(x, y) {
      // Check map boundaries
      if (x < 0 || y < 0 || x + this.width > MAP_WIDTH * TILE_SIZE || y + this.height > MAP_HEIGHT * TILE_SIZE) {
        return true;
      }
      
      // Check tile collisions
      const checkPoints = [
        [x + 2, y + 2],
        [x + this.width - 2, y + 2],
        [x + 2, y + this.height - 2],
        [x + this.width - 2, y + this.height - 2]
      ];
      
      for (const [px, py] of checkPoints) {
        const tx = Math.floor(px / TILE_SIZE);
        const ty = Math.floor(py / TILE_SIZE);
        if (SOLID_TILES.has(map[ty]?.[tx])) {
          return true;
        }
      }
      return false;
    }
    
    move(dx, dy) {
      // Update direction
      if (dx < 0) this.direction = 2;
      else if (dx > 0) this.direction = 3;
      else if (dy < 0) this.direction = 1;
      else if (dy > 0) this.direction = 0;
      
      // Try to move
      if (!this.checkCollision(this.x + dx, this.y + dy)) {
        this.x += dx;
        this.y += dy;
        this.isMoving = true;
        return true;
      }
      this.isMoving = false;
      return false;
    }
    
    update(dt) {
      if (this.isMoving) {
        this.animTimer += dt;
        if (this.animTimer > 200) { // GBA animation speed
          this.animTimer = 0;
          this.frame = (this.frame + 1) % 3;
        }
      } else {
        this.frame = 0;
        this.animTimer = 0;
      }
    }
    
    draw(ctx, camX, camY, sprite) {
      const screenX = Math.floor(this.x - camX);
      const screenY = Math.floor(this.y - camY - 16); // Sprite offset
      
      ctx.drawImage(
        sprite,
        this.frame * 16, this.direction * 32,
        16, 32,
        screenX, screenY,
        16, 32
      );
    }
  }

  // ============================================================================
  // GBA DIALOGUE SYSTEM
  // ============================================================================
  
  class GBADialogue {
    constructor() {
      this.active = false;
      this.lines = [];
      this.currentLine = 0;
      this.currentChar = 0;
      this.displayText = '';
      this.charTimer = 0;
      this.waiting = false;
    }
    
    start(lines) {
      this.active = true;
      this.lines = lines;
      this.currentLine = 0;
      this.currentChar = 0;
      this.displayText = '';
      this.waiting = false;
    }
    
    update(dt) {
      if (!this.active || this.waiting) return;
      
      this.charTimer += dt;
      while (this.charTimer >= 40 && this.currentChar < this.lines[this.currentLine].length) {
        this.displayText += this.lines[this.currentLine][this.currentChar];
        this.currentChar++;
        this.charTimer -= 40;
        
        // GBA sound effect would play here
      }
      
      if (this.currentChar >= this.lines[this.currentLine].length) {
        this.waiting = true;
      }
    }
    
    advance() {
      if (!this.waiting) {
        this.displayText = this.lines[this.currentLine];
        this.currentChar = this.lines[this.currentLine].length;
        this.waiting = true;
      } else {
        this.currentLine++;
        if (this.currentLine >= this.lines.length) {
          this.active = false;
        } else {
          this.currentChar = 0;
          this.displayText = '';
          this.waiting = false;
        }
      }
    }
    
    draw(ctx) {
      if (!this.active) return;
      
      // GBA-style dialogue box
      const boxHeight = 48;
      const boxY = GBA_HEIGHT - boxHeight - 4;
      const boxX = 4;
      const boxWidth = GBA_WIDTH - 8;
      
      // Draw dialogue window (GBA style with border)
      ctx.fillStyle = GBA_PALETTE.UI_BG;
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      
      // Border
      ctx.strokeStyle = GBA_PALETTE.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      // Inner border
      ctx.strokeStyle = GBA_PALETTE.UI_SHADOW;
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX + 2, boxY + 2, boxWidth - 4, boxHeight - 4);
      
      // Draw text (GBA font style)
      ctx.fillStyle = GBA_PALETTE.UI_TEXT;
      ctx.font = '8px monospace';
      
      // Word wrap for GBA screen
      const words = this.displayText.split(' ');
      const maxWidth = boxWidth - 16;
      let line = '';
      let yPos = boxY + 12;
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          ctx.fillText(line, boxX + 8, yPos);
          line = word;
          yPos += 10;
        } else {
          line = testLine;
        }
      }
      if (line) {
        ctx.fillText(line, boxX + 8, yPos);
      }
      
      // Draw continue arrow (GBA style)
      if (this.waiting && Math.floor(Date.now() / 400) % 2 === 0) {
        ctx.fillStyle = GBA_PALETTE.UI_TEXT;
        // Draw small triangle
        ctx.beginPath();
        ctx.moveTo(boxX + boxWidth - 12, boxY + boxHeight - 12);
        ctx.lineTo(boxX + boxWidth - 8, boxY + boxHeight - 8);
        ctx.lineTo(boxX + boxWidth - 12, boxY + boxHeight - 4);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // ============================================================================
  // GAME STATE
  // ============================================================================
  
  const assets = {
    tileset: createGBATileset(),
    playerSprite: createGBASprite({ outfit: GBA_PALETTE.MID_RED, hair: GBA_PALETTE.DARK_BROWN }),
    npcSprite: createGBASprite({ outfit: GBA_PALETTE.MID_BLUE, hair: GBA_PALETTE.MID_BROWN })
  };
  
  const player = new Entity(16 * TILE_SIZE, 16 * TILE_SIZE);
  const npcs = [
    Object.assign(new Entity(20 * TILE_SIZE, 15 * TILE_SIZE), {
      dialogue: [
        "Welcome to the world of POKéMON!",
        "My name is PROF. OAK!",
        "This world is inhabited by creatures called POKéMON!"
      ]
    }),
    Object.assign(new Entity(32 * TILE_SIZE, 32 * TILE_SIZE), {
      dialogue: [
        "Hi! I like shorts!",
        "They're comfy and easy to wear!"
      ]
    })
  ];
  
  const dialogue = new GBADialogue();
  const camera = { x: 0, y: 0 };
  const keys = new Set();
  const lastKeys = new Set();
  let lastTime = 0;

  // GBA-style button mapping
  const BUTTON_MAP = {
    'z': 'A', 'Z': 'A',
    'x': 'B', 'X': 'B',
    'Enter': 'START',
    'Shift': 'SELECT',
    'ArrowUp': 'UP', 'w': 'UP', 'W': 'UP',
    'ArrowDown': 'DOWN', 's': 'DOWN', 'S': 'DOWN',
    'ArrowLeft': 'LEFT', 'a': 'LEFT', 'A': 'LEFT',
    'ArrowRight': 'RIGHT', 'd': 'RIGHT', 'D': 'RIGHT'
  };

  // Input handling
  window.addEventListener('keydown', e => {
    const button = BUTTON_MAP[e.key];
    if (button) {
      keys.add(button);
      e.preventDefault();
    }
  });
  
  window.addEventListener('keyup', e => {
    const button = BUTTON_MAP[e.key];
    if (button) {
      keys.delete(button);
    }
  });

  function isButtonPressed(button) {
    return keys.has(button) && !lastKeys.has(button);
  }

  // ============================================================================
  // GAME LOOP
  // ============================================================================
  
  function gameLoop(time) {
    const dt = time - lastTime;
    lastTime = time;
    
    // Update
    if (dialogue.active) {
      dialogue.update(dt);
      if (isButtonPressed('A') || isButtonPressed('START')) {
        dialogue.advance();
      }
    } else {
      // D-pad movement
      let dx = 0, dy = 0;
      if (keys.has('LEFT')) dx = -player.speed;
      if (keys.has('RIGHT')) dx = player.speed;
      if (keys.has('UP')) dy = -player.speed;
      if (keys.has('DOWN')) dy = player.speed;
      
      if (dx || dy) {
        // GBA-style 8-directional movement normalization
        if (dx && dy) {
          dx *= 0.707;
          dy *= 0.707;
        }
        player.move(dx, dy);
      } else {
        player.isMoving = false;
      }
      
      // A button interaction
      if (isButtonPressed('A')) {
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        let checkX = px, checkY = py;
        
        if (player.direction === 0) checkY += TILE_SIZE;
        else if (player.direction === 1) checkY -= TILE_SIZE;
        else if (player.direction === 2) checkX -= TILE_SIZE;
        else if (player.direction === 3) checkX += TILE_SIZE;
        
        // Check NPC interaction
        for (const npc of npcs) {
          const nx = npc.x + npc.width / 2;
          const ny = npc.y + npc.height / 2;
          const dist = Math.abs(checkX - nx) + Math.abs(checkY - ny);
          if (dist < TILE_SIZE * 1.5) {
            dialogue.start(npc.dialogue);
            break;
          }
        }
      }
      
      player.update(dt);
    }
    
    // Update camera (GBA-style smooth follow)
    const targetCamX = player.x + player.width / 2 - GBA_WIDTH / 2;
    const targetCamY = player.y + player.height / 2 - GBA_HEIGHT / 2;
    
    camera.x = Math.max(0, Math.min(targetCamX, MAP_WIDTH * TILE_SIZE - GBA_WIDTH));
    camera.y = Math.max(0, Math.min(targetCamY, MAP_HEIGHT * TILE_SIZE - GBA_HEIGHT));
    
    // Render
    // Clear with GBA green background
    ctx.fillStyle = GBA_PALETTE.LIGHT_GREEN;
    ctx.fillRect(0, 0, GBA_WIDTH, GBA_HEIGHT);
    
    // Calculate visible tile range
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.min(startX + SCREEN_TILES_X + 1, MAP_WIDTH);
    const endY = Math.min(startY + SCREEN_TILES_Y + 1, MAP_HEIGHT);
    
    // Draw map tiles
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = map[y][x];
        const screenX = x * TILE_SIZE - camera.x;
        const screenY = y * TILE_SIZE - camera.y;
        
        // Draw tile from tileset
        const tileX = (tile % 8) * TILE_SIZE;
        const tileY = Math.floor(tile / 8) * TILE_SIZE;
        
        ctx.drawImage(
          assets.tileset,
          tileX, tileY, TILE_SIZE, TILE_SIZE,
          screenX, screenY, TILE_SIZE, TILE_SIZE
        );
      }
    }
    
    // Draw entities (sorted by Y for depth)
    const entities = [...npcs, player];
    entities.sort((a, b) => a.y - b.y);
    
    for (const entity of entities) {
      const sprite = entity === player ? assets.playerSprite : assets.npcSprite;
      entity.draw(ctx, camera.x, camera.y, sprite);
    }
    
    // Draw dialogue
    dialogue.draw(ctx);
    
    // Update input state
    lastKeys = new Set(keys);
    
    requestAnimationFrame(gameLoop);
  }
  
  // Save system
  const saveData = localStorage.getItem('gbasp-save');
  if (saveData) {
    const data = JSON.parse(saveData);
    player.x = data.x || player.x;
    player.y = data.y || player.y;
    player.direction = data.direction || player.direction;
  }
  
  // Auto-save
  setInterval(() => {
    localStorage.setItem('gbasp-save', JSON.stringify({
      x: player.x,
      y: player.y,
      direction: player.direction
    }));
  }, 5000);
  
  // Start game
  requestAnimationFrame(gameLoop);
})();