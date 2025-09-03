/* 
   AUTHENTIC GBA SP RENDERING PIPELINE
   - Native 240×160 resolution with integer scaling
   - BGR555 15-bit color quantization
   - LCD scanline and sub-pixel effects
   - Bitmap font rendering
   - Integer-only movement and camera
*/

(() => {
  // ============================================================================
  // GBA SP RENDERING PIPELINE
  // ============================================================================
  
  const BASE_W = 240;
  const BASE_H = 160;
  const SCALE = 3; // 3x scaling = 720×480
  
  // Visible canvas (in DOM)
  const screen = document.getElementById('game');
  screen.width = BASE_W * SCALE;
  screen.height = BASE_H * SCALE;
  const sctx = screen.getContext('2d', { alpha: false });
  sctx.imageSmoothingEnabled = false;
  
  // Off-screen backbuffer (240×160)
  const backbuf = document.createElement('canvas');
  backbuf.width = BASE_W;
  backbuf.height = BASE_H;
  const bctx = backbuf.getContext('2d', { alpha: false });
  bctx.imageSmoothingEnabled = false;
  
  // Scanline overlay
  const scanlines = document.createElement('canvas');
  scanlines.width = BASE_W;
  scanlines.height = BASE_H;
  const scanCtx = scanlines.getContext('2d', { alpha: true });
  
  // Create LCD effect pattern
  (function createLCDEffect() {
    scanCtx.clearRect(0, 0, BASE_W, BASE_H);
    
    // Horizontal scanlines
    scanCtx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < BASE_H; y += 2) {
      scanCtx.fillRect(0, y, BASE_W, 1);
    }
    
    // Sub-pixel grid (2x2 pattern)
    for (let y = 0; y < BASE_H; y += 2) {
      for (let x = 0; x < BASE_W; x += 2) {
        scanCtx.fillStyle = 'rgba(0,0,0,0.05)';
        scanCtx.fillRect(x + 1, y, 1, 1);
        scanCtx.fillRect(x, y + 1, 1, 1);
      }
    }
  })();
  
  // BGR555 Quantization (15-bit color)
  function quantizeToBGR555(imgData) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // Quantize to 5 bits per channel (0-31 range, then scale back to 0-255)
      d[i]     = Math.floor(d[i] / 8) * 8;     // R
      d[i + 1] = Math.floor(d[i + 1] / 8) * 8; // G
      d[i + 2] = Math.floor(d[i + 2] / 8) * 8; // B
      
      // Apply slight gamma correction for SP backlight
      const gamma = 1.05;
      d[i]     = Math.min(255, Math.pow(d[i] / 255, gamma) * 255);
      d[i + 1] = Math.min(255, Math.pow(d[i + 1] / 255, gamma) * 255);
      d[i + 2] = Math.min(255, Math.pow(d[i + 2] / 255, gamma) * 255);
    }
    return imgData;
  }

  // ============================================================================
  // GBA COLOR PALETTE (5-bit steps)
  // ============================================================================
  
  const GBA_COLORS = {
    // Core palette (5-bit aligned)
    BLACK: '#000000',
    WHITE: '#F8F8F8',
    
    // Grass/Nature (Pokemon Emerald style)
    GRASS_DARK: '#186818',
    GRASS_MID: '#289028',
    GRASS_LIGHT: '#48B848',
    GRASS_PALE: '#68D868',
    
    // Earth/Path
    EARTH_DARK: '#583820',
    EARTH_MID: '#886040',
    EARTH_LIGHT: '#B88860',
    EARTH_PALE: '#D8B088',
    
    // Water (animated)
    WATER_DARK: '#2058A8',
    WATER_MID: '#3878C8',
    WATER_LIGHT: '#5898E8',
    WATER_SHINE: '#78B8F8',
    
    // Trees/Foliage
    TREE_SHADOW: '#104010',
    TREE_DARK: '#186018',
    TREE_MID: '#208020',
    TREE_LIGHT: '#30A030',
    
    // UI/Text
    UI_BG: '#F0F0E8',
    UI_BORDER: '#586878',
    UI_SHADOW: '#A8B0B8',
    TEXT_BLACK: '#181818',
    
    // Character palette
    SKIN: '#F8C890',
    SKIN_SHADOW: '#D8A070',
    CLOTHES_RED: '#C83030',
    CLOTHES_BLUE: '#3060C8',
    HAIR_BROWN: '#704028',
    HAIR_BLACK: '#303030'
  };

  // ============================================================================
  // BITMAP FONT SYSTEM
  // ============================================================================
  
  class BitmapFont {
    constructor() {
      this.charWidth = 8;
      this.charHeight = 8;
      this.chars = {};
      this.generateFont();
    }
    
    generateFont() {
      // Create a canvas for the font atlas
      const atlas = document.createElement('canvas');
      atlas.width = 256;
      atlas.height = 128;
      const ctx = atlas.getContext('2d');
      
      // Generate basic ASCII characters (32-126)
      ctx.fillStyle = '#000000';
      ctx.font = '8px monospace';
      ctx.textBaseline = 'top';
      
      for (let i = 32; i < 127; i++) {
        const char = String.fromCharCode(i);
        const x = ((i - 32) % 16) * 8;
        const y = Math.floor((i - 32) / 16) * 8;
        
        // Store character position
        this.chars[char] = { x, y };
        
        // Draw character (we'll use procedural pixel font)
        this.drawChar(ctx, char, x, y);
      }
      
      this.atlas = atlas;
    }
    
    drawChar(ctx, char, x, y) {
      // Procedural pixel font (simplified)
      const pixels = this.getCharPixels(char);
      if (pixels) {
        ctx.fillStyle = '#000000';
        for (let py = 0; py < 8; py++) {
          for (let px = 0; px < 8; px++) {
            if (pixels[py] && pixels[py][px]) {
              ctx.fillRect(x + px, y + py, 1, 1);
            }
          }
        }
      } else {
        // Fallback to canvas text
        ctx.fillText(char, x, y);
      }
    }
    
    getCharPixels(char) {
      // Define pixel patterns for common characters
      const patterns = {
        'A': [
          [0,1,1,1,1,1,0,0],
          [1,0,0,0,0,0,1,0],
          [1,0,0,0,0,0,1,0],
          [1,1,1,1,1,1,1,0],
          [1,0,0,0,0,0,1,0],
          [1,0,0,0,0,0,1,0],
          [1,0,0,0,0,0,1,0],
          [0,0,0,0,0,0,0,0]
        ],
        'B': [
          [1,1,1,1,1,1,0,0],
          [1,0,0,0,0,0,1,0],
          [1,0,0,0,0,0,1,0],
          [1,1,1,1,1,1,0,0],
          [1,0,0,0,0,0,1,0],
          [1,0,0,0,0,0,1,0],
          [1,1,1,1,1,1,0,0],
          [0,0,0,0,0,0,0,0]
        ],
        // Add more characters as needed
      };
      
      return patterns[char.toUpperCase()];
    }
    
    drawText(ctx, text, x, y, color = '#000000') {
      ctx.save();
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charData = this.chars[char];
        
        if (charData && this.atlas) {
          // Draw from atlas
          ctx.drawImage(
            this.atlas,
            charData.x, charData.y, 8, 8,
            x + i * 8, y, 8, 8
          );
        } else {
          // Fallback
          ctx.fillStyle = color;
          ctx.fillText(char, x + i * 8, y);
        }
      }
      
      ctx.restore();
    }
  }

  // ============================================================================
  // TILESET GENERATION (GBA-STYLE)
  // ============================================================================
  
  function createGBATileset() {
    const tileSize = 16;
    const atlasWidth = 256;
    const atlasHeight = 256;
    
    const atlas = document.createElement('canvas');
    atlas.width = atlasWidth;
    atlas.height = atlasHeight;
    const ctx = atlas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Helper to draw a 16x16 tile
    function drawTile(tileX, tileY, drawFunc) {
      ctx.save();
      ctx.translate(tileX * tileSize, tileY * tileSize);
      drawFunc(ctx);
      ctx.restore();
    }
    
    // Tile 0: Grass (with dithering)
    drawTile(0, 0, (c) => {
      c.fillStyle = GBA_COLORS.GRASS_MID;
      c.fillRect(0, 0, 16, 16);
      
      // Dithered pattern
      c.fillStyle = GBA_COLORS.GRASS_LIGHT;
      for (let y = 0; y < 16; y += 2) {
        for (let x = (y/2) % 2; x < 16; x += 2) {
          c.fillRect(x, y, 1, 1);
        }
      }
      
      // Random grass blades
      c.fillStyle = GBA_COLORS.GRASS_DARK;
      c.fillRect(3, 5, 1, 2);
      c.fillRect(10, 8, 1, 2);
      c.fillRect(6, 12, 1, 2);
    });
    
    // Tile 1: Path
    drawTile(1, 0, (c) => {
      c.fillStyle = GBA_COLORS.EARTH_MID;
      c.fillRect(0, 0, 16, 16);
      
      // Path texture
      c.fillStyle = GBA_COLORS.EARTH_LIGHT;
      c.fillRect(0, 0, 16, 2);
      c.fillRect(0, 14, 16, 2);
      
      c.fillStyle = GBA_COLORS.EARTH_DARK;
      for (let i = 0; i < 5; i++) {
        const x = (i * 7) % 16;
        const y = (i * 5) % 14 + 1;
        c.fillRect(x, y, 2, 1);
      }
    });
    
    // Tile 2-5: Tree (2x2 tiles)
    // Top-left
    drawTile(2, 0, (c) => {
      c.fillStyle = GBA_COLORS.TREE_SHADOW;
      c.fillRect(2, 2, 14, 14);
      
      c.fillStyle = GBA_COLORS.TREE_DARK;
      c.fillRect(3, 3, 12, 12);
      
      c.fillStyle = GBA_COLORS.TREE_MID;
      c.fillRect(4, 4, 10, 10);
      
      c.fillStyle = GBA_COLORS.TREE_LIGHT;
      c.fillRect(5, 5, 4, 4);
      c.fillRect(10, 6, 3, 3);
    });
    
    // Top-right
    drawTile(3, 0, (c) => {
      c.fillStyle = GBA_COLORS.TREE_SHADOW;
      c.fillRect(0, 2, 14, 14);
      
      c.fillStyle = GBA_COLORS.TREE_DARK;
      c.fillRect(1, 3, 12, 12);
      
      c.fillStyle = GBA_COLORS.TREE_MID;
      c.fillRect(2, 4, 10, 10);
      
      c.fillStyle = GBA_COLORS.TREE_LIGHT;
      c.fillRect(3, 5, 3, 3);
      c.fillRect(7, 5, 4, 4);
    });
    
    // Bottom-left
    drawTile(2, 1, (c) => {
      c.fillStyle = GBA_COLORS.TREE_SHADOW;
      c.fillRect(2, 0, 14, 14);
      
      c.fillStyle = GBA_COLORS.TREE_DARK;
      c.fillRect(3, 1, 12, 12);
      
      c.fillStyle = GBA_COLORS.TREE_MID;
      c.fillRect(4, 2, 10, 10);
      
      // Trunk
      c.fillStyle = GBA_COLORS.EARTH_DARK;
      c.fillRect(7, 8, 2, 8);
    });
    
    // Bottom-right
    drawTile(3, 1, (c) => {
      c.fillStyle = GBA_COLORS.TREE_SHADOW;
      c.fillRect(0, 0, 14, 14);
      
      c.fillStyle = GBA_COLORS.TREE_DARK;
      c.fillRect(1, 1, 12, 12);
      
      c.fillStyle = GBA_COLORS.TREE_MID;
      c.fillRect(2, 2, 10, 10);
      
      // Trunk
      c.fillStyle = GBA_COLORS.EARTH_DARK;
      c.fillRect(7, 8, 2, 8);
    });
    
    // Tile 6-7: Water (2 frames for animation)
    drawTile(6, 0, (c) => {
      c.fillStyle = GBA_COLORS.WATER_MID;
      c.fillRect(0, 0, 16, 16);
      
      // Wave pattern frame 1
      c.fillStyle = GBA_COLORS.WATER_DARK;
      for (let y = 0; y < 16; y += 4) {
        c.fillRect(0, y, 16, 2);
      }
      
      c.fillStyle = GBA_COLORS.WATER_LIGHT;
      c.fillRect(2, 2, 3, 1);
      c.fillRect(8, 6, 3, 1);
      c.fillRect(5, 10, 3, 1);
    });
    
    drawTile(7, 0, (c) => {
      c.fillStyle = GBA_COLORS.WATER_MID;
      c.fillRect(0, 0, 16, 16);
      
      // Wave pattern frame 2
      c.fillStyle = GBA_COLORS.WATER_DARK;
      for (let y = 2; y < 16; y += 4) {
        c.fillRect(0, y, 16, 2);
      }
      
      c.fillStyle = GBA_COLORS.WATER_LIGHT;
      c.fillRect(5, 3, 3, 1);
      c.fillRect(11, 7, 3, 1);
      c.fillRect(3, 11, 3, 1);
    });
    
    // Tile 8: Tall grass
    drawTile(8, 0, (c) => {
      c.fillStyle = GBA_COLORS.GRASS_DARK;
      c.fillRect(0, 0, 16, 16);
      
      // Tall grass pattern
      c.fillStyle = GBA_COLORS.TREE_SHADOW;
      for (let x = 0; x < 16; x += 2) {
        const h = 8 + Math.floor((x * 3) % 4);
        c.fillRect(x, 16 - h, 1, h);
      }
      
      c.fillStyle = GBA_COLORS.TREE_DARK;
      for (let x = 1; x < 16; x += 3) {
        const h = 6 + Math.floor((x * 5) % 4);
        c.fillRect(x, 16 - h, 1, h);
      }
    });
    
    return atlas;
  }

  // ============================================================================
  // SPRITE GENERATION (GBA-STYLE)
  // ============================================================================
  
  function createGBASprite(colors) {
    const frameWidth = 16;
    const frameHeight = 24;
    const framesPerRow = 4; // idle, walk1, walk2, walk3
    const directions = 4; // down, up, left, right
    
    const atlas = document.createElement('canvas');
    atlas.width = frameWidth * framesPerRow;
    atlas.height = frameHeight * directions;
    const ctx = atlas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    function drawSprite(frameX, frameY, dir, frame) {
      const x = frameX * frameWidth;
      const y = frameY * frameHeight;
      
      // Clear frame
      ctx.clearRect(x, y, frameWidth, frameHeight);
      
      // Walking animation
      let legOffset = 0;
      if (frame === 1) legOffset = -1;
      if (frame === 2) legOffset = 0;
      if (frame === 3) legOffset = 1;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 5, y + 21, 6, 2);
      
      // Draw based on direction
      if (dir === 0) { // Down
        // Outline
        ctx.fillStyle = GBA_COLORS.BLACK;
        ctx.fillRect(x + 4, y + 4, 8, 8);
        ctx.fillRect(x + 3, y + 11, 10, 8);
        
        // Body
        ctx.fillStyle = colors.shirt || GBA_COLORS.CLOTHES_RED;
        ctx.fillRect(x + 4, y + 11, 8, 7);
        
        // Head
        ctx.fillStyle = GBA_COLORS.SKIN;
        ctx.fillRect(x + 5, y + 5, 6, 6);
        
        // Hair
        ctx.fillStyle = colors.hair || GBA_COLORS.HAIR_BROWN;
        ctx.fillRect(x + 4, y + 3, 8, 3);
        ctx.fillRect(x + 5, y + 2, 6, 2);
        
        // Face
        ctx.fillStyle = GBA_COLORS.BLACK;
        ctx.fillRect(x + 6, y + 7, 1, 1);
        ctx.fillRect(x + 9, y + 7, 1, 1);
        
        // Arms
        ctx.fillStyle = GBA_COLORS.SKIN;
        ctx.fillRect(x + 3, y + 12, 2, 4);
        ctx.fillRect(x + 11, y + 12, 2, 4);
        
        // Legs
        ctx.fillStyle = colors.pants || GBA_COLORS.CLOTHES_BLUE;
        ctx.fillRect(x + 5, y + 17 + (frame === 1 ? legOffset : 0), 2, 4);
        ctx.fillRect(x + 9, y + 17 + (frame === 3 ? legOffset : 0), 2, 4);
        
        // Shoes
        ctx.fillStyle = GBA_COLORS.BLACK;
        ctx.fillRect(x + 5, y + 20 + (frame === 1 ? legOffset : 0), 2, 2);
        ctx.fillRect(x + 9, y + 20 + (frame === 3 ? legOffset : 0), 2, 2);
      }
      // Add other directions (up, left, right) similarly...
    }
    
    // Generate all frames
    for (let dir = 0; dir < directions; dir++) {
      for (let frame = 0; frame < framesPerRow; frame++) {
        drawSprite(frame, dir, dir, frame);
      }
    }
    
    return atlas;
  }

  // ============================================================================
  // MAP GENERATION
  // ============================================================================
  
  const MAP_WIDTH = 32;
  const MAP_HEIGHT = 32;
  const TILE_SIZE = 16;
  
  const TILES = {
    GRASS: 0,
    PATH: 1,
    TREE_TL: 2, TREE_TR: 3, TREE_BL: 18, TREE_BR: 19, // 2x2 tree
    WATER1: 6, WATER2: 7, // Animated water
    TALL_GRASS: 8
  };
  
  const SOLID_TILES = new Set([
    TILES.TREE_TL, TILES.TREE_TR, TILES.TREE_BL, TILES.TREE_BR,
    TILES.WATER1, TILES.WATER2
  ]);
  
  // Generate map
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      map[y][x] = TILES.GRASS;
      
      // Paths
      if ((y === 10 || y === 20) && x > 4 && x < MAP_WIDTH - 4) {
        map[y][x] = TILES.PATH;
      }
      if ((x === 10 || x === 20) && y > 4 && y < MAP_HEIGHT - 4) {
        map[y][x] = TILES.PATH;
      }
    }
  }
  
  // Add trees (2x2)
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(Math.random() * (MAP_WIDTH - 2));
    const y = Math.floor(Math.random() * (MAP_HEIGHT - 2));
    if (map[y][x] === TILES.GRASS && map[y+1][x] === TILES.GRASS) {
      map[y][x] = TILES.TREE_TL;
      map[y][x+1] = TILES.TREE_TR;
      map[y+1][x] = TILES.TREE_BL;
      map[y+1][x+1] = TILES.TREE_BR;
    }
  }
  
  // Add water pond
  for (let y = 15; y < 19; y++) {
    for (let x = 15; x < 19; x++) {
      map[y][x] = TILES.WATER1;
    }
  }

  // ============================================================================
  // GAME ENTITIES
  // ============================================================================
  
  class Entity {
    constructor(x, y) {
      // Integer positions only
      this.x = Math.floor(x);
      this.y = Math.floor(y);
      this.width = 12;
      this.height = 12;
      this.direction = 0; // 0=down, 1=up, 2=left, 3=right
      this.frame = 0;
      this.animTimer = 0;
      this.moveSpeed = 2; // Pixels per frame (integer)
      this.isMoving = false;
      
      // Sub-tile movement (8px steps)
      this.moveTarget = null;
      this.moveProgress = 0;
    }
    
    startMove(dx, dy) {
      if (this.moveTarget) return false; // Already moving
      
      // Check collision at target
      const targetX = this.x + dx * 8;
      const targetY = this.y + dy * 8;
      
      if (!this.checkCollision(targetX, targetY)) {
        this.moveTarget = { x: targetX, y: targetY };
        this.moveProgress = 0;
        this.isMoving = true;
        
        // Update direction
        if (dx < 0) this.direction = 2;
        else if (dx > 0) this.direction = 3;
        else if (dy < 0) this.direction = 1;
        else if (dy > 0) this.direction = 0;
        
        return true;
      }
      return false;
    }
    
    checkCollision(x, y) {
      const points = [
        [x + 2, y + 2],
        [x + this.width - 2, y + 2],
        [x + 2, y + this.height - 2],
        [x + this.width - 2, y + this.height - 2]
      ];
      
      for (const [px, py] of points) {
        const tx = Math.floor(px / TILE_SIZE);
        const ty = Math.floor(py / TILE_SIZE);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
        if (SOLID_TILES.has(map[ty][tx])) return true;
      }
      return false;
    }
    
    update(dt) {
      // Integer step movement
      if (this.moveTarget) {
        this.moveProgress += this.moveSpeed;
        
        if (this.moveProgress >= 8) {
          // Reached target
          this.x = this.moveTarget.x;
          this.y = this.moveTarget.y;
          this.moveTarget = null;
          this.moveProgress = 0;
        } else {
          // Interpolate (integer steps)
          const t = this.moveProgress / 8;
          const oldX = this.moveTarget.x - (this.moveTarget.x - this.x) / (1 - t + 0.01);
          const oldY = this.moveTarget.y - (this.moveTarget.y - this.y) / (1 - t + 0.01);
          this.x = Math.floor(oldX + (this.moveTarget.x - oldX) * t);
          this.y = Math.floor(oldY + (this.moveTarget.y - oldY) * t);
        }
        
        // Animate
        this.animTimer += dt;
        if (this.animTimer > 200) {
          this.animTimer = 0;
          this.frame = (this.frame + 1) % 3;
        }
      } else {
        this.isMoving = false;
        this.frame = 0;
      }
    }
    
    draw(ctx, sprite, camX, camY) {
      const screenX = Math.floor(this.x - camX);
      const screenY = Math.floor(this.y - camY - 8);
      
      ctx.drawImage(
        sprite,
        (this.frame + 1) * 16, this.direction * 24,
        16, 24,
        screenX, screenY,
        16, 24
      );
    }
  }

  // ============================================================================
  // DIALOGUE SYSTEM (9-SLICE PANEL)
  // ============================================================================
  
  class DialogueBox {
    constructor() {
      this.active = false;
      this.lines = [];
      this.currentLine = 0;
      this.currentChar = 0;
      this.displayText = '';
      this.charTimer = 0;
      this.waiting = false;
      this.font = new BitmapFont();
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
      while (this.charTimer >= 50 && this.currentChar < this.lines[this.currentLine].length) {
        this.displayText += this.lines[this.currentLine][this.currentChar];
        this.currentChar++;
        this.charTimer -= 50;
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
      
      const boxX = 8;
      const boxY = BASE_H - 48;
      const boxW = BASE_W - 16;
      const boxH = 40;
      
      // Draw 9-slice panel
      this.draw9Slice(ctx, boxX, boxY, boxW, boxH);
      
      // Draw text with bitmap font
      ctx.fillStyle = GBA_COLORS.TEXT_BLACK;
      ctx.font = '8px monospace'; // Fallback
      
      // Simple word wrap
      const words = this.displayText.split(' ');
      let line = '';
      let yPos = boxY + 8;
      const maxWidth = boxW - 16;
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = testLine.length * 6; // Approximate
        
        if (testWidth > maxWidth && line) {
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
      
      // Continue arrow
      if (this.waiting && Math.floor(Date.now() / 400) % 2 === 0) {
        ctx.fillStyle = GBA_COLORS.TEXT_BLACK;
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - 10, boxY + boxH - 10);
        ctx.lineTo(boxX + boxW - 6, boxY + boxH - 6);
        ctx.lineTo(boxX + boxW - 10, boxY + boxH - 2);
        ctx.closePath();
        ctx.fill();
      }
    }
    
    draw9Slice(ctx, x, y, w, h) {
      // Draw panel background
      ctx.fillStyle = GBA_COLORS.UI_BG;
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      
      // Draw borders
      ctx.fillStyle = GBA_COLORS.UI_BORDER;
      
      // Top/Bottom
      ctx.fillRect(x + 2, y, w - 4, 2);
      ctx.fillRect(x + 2, y + h - 2, w - 4, 2);
      
      // Left/Right
      ctx.fillRect(x, y + 2, 2, h - 4);
      ctx.fillRect(x + w - 2, y + 2, 2, h - 4);
      
      // Corners
      ctx.fillRect(x + 1, y + 1, 2, 2);
      ctx.fillRect(x + w - 3, y + 1, 2, 2);
      ctx.fillRect(x + 1, y + h - 3, 2, 2);
      ctx.fillRect(x + w - 3, y + h - 3, 2, 2);
      
      // Inner shadow
      ctx.fillStyle = GBA_COLORS.UI_SHADOW;
      ctx.fillRect(x + 2, y + 2, w - 4, 1);
      ctx.fillRect(x + 2, y + 2, 1, h - 4);
    }
  }

  // ============================================================================
  // CAMERA (INTEGER ONLY)
  // ============================================================================
  
  class Camera {
    constructor() {
      this.x = 0;
      this.y = 0;
    }
    
    follow(target) {
      // Integer camera position
      const targetX = Math.floor(target.x + target.width / 2 - BASE_W / 2);
      const targetY = Math.floor(target.y + target.height / 2 - BASE_H / 2);
      
      // Clamp to map bounds
      this.x = Math.max(0, Math.min(targetX, MAP_WIDTH * TILE_SIZE - BASE_W));
      this.y = Math.max(0, Math.min(targetY, MAP_HEIGHT * TILE_SIZE - BASE_H));
    }
  }

  // ============================================================================
  // GAME STATE
  // ============================================================================
  
  const assets = {
    tileset: createGBATileset(),
    playerSprite: createGBASprite({
      shirt: GBA_COLORS.CLOTHES_RED,
      hair: GBA_COLORS.HAIR_BROWN,
      pants: GBA_COLORS.CLOTHES_BLUE
    }),
    npcSprite: createGBASprite({
      shirt: GBA_COLORS.CLOTHES_BLUE,
      hair: GBA_COLORS.HAIR_BLACK,
      pants: GBA_COLORS.EARTH_DARK
    })
  };
  
  const player = new Entity(10 * TILE_SIZE, 10 * TILE_SIZE);
  const npcs = [
    Object.assign(new Entity(12 * TILE_SIZE, 10 * TILE_SIZE), {
      dialogue: [
        "Welcome to the world",
        "of POKéMON!",
        "Press A to continue..."
      ]
    })
  ];
  
  const camera = new Camera();
  const dialogue = new DialogueBox();
  const keys = new Set();
  const lastKeys = new Set();
  let waterFrame = 0;
  let waterTimer = 0;

  // Input
  window.addEventListener('keydown', e => {
    keys.add(e.key.toLowerCase());
    if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','z','x'].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  });
  
  window.addEventListener('keyup', e => {
    keys.delete(e.key.toLowerCase());
  });
  
  function isKeyPressed(key) {
    return keys.has(key) && !lastKeys.has(key);
  }

  // ============================================================================
  // GAME LOOP
  // ============================================================================
  
  let lastTime = performance.now();
  
  function update(dt) {
    // Water animation
    waterTimer += dt;
    if (waterTimer > 500) {
      waterTimer = 0;
      waterFrame = 1 - waterFrame;
    }
    
    // Dialogue
    if (dialogue.active) {
      dialogue.update(dt);
      if (isKeyPressed('z') || isKeyPressed(' ') || isKeyPressed('enter')) {
        dialogue.advance();
      }
      return;
    }
    
    // Player movement (8px grid)
    if (!player.moveTarget) {
      let dx = 0, dy = 0;
      if (keys.has('arrowleft') || keys.has('a')) dx = -1;
      if (keys.has('arrowright') || keys.has('d')) dx = 1;
      if (keys.has('arrowup') || keys.has('w')) dy = -1;
      if (keys.has('arrowdown') || keys.has('s')) dy = 1;
      
      if (dx || dy) {
        // Only allow one axis at a time for authentic GBA feel
        if (dx && dy) {
          dy = 0; // Prioritize horizontal
        }
        player.startMove(dx, dy);
      }
    }
    
    // Interaction
    if (isKeyPressed('z') || isKeyPressed(' ') || isKeyPressed('enter')) {
      // Check NPC in front
      const checkX = player.x + (player.direction === 2 ? -16 : player.direction === 3 ? 16 : 0);
      const checkY = player.y + (player.direction === 1 ? -16 : player.direction === 0 ? 16 : 0);
      
      for (const npc of npcs) {
        if (Math.abs(npc.x - checkX) < 16 && Math.abs(npc.y - checkY) < 16) {
          dialogue.start(npc.dialogue);
          break;
        }
      }
    }
    
    player.update(dt);
    camera.follow(player);
  }
  
  function drawWorld() {
    // Clear
    bctx.fillStyle = GBA_COLORS.BLACK;
    bctx.fillRect(0, 0, BASE_W, BASE_H);
    
    // Draw tiles
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.min(startX + Math.ceil(BASE_W / TILE_SIZE) + 1, MAP_WIDTH);
    const endY = Math.min(startY + Math.ceil(BASE_H / TILE_SIZE) + 1, MAP_HEIGHT);
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        let tile = map[y][x];
        
        // Animate water
        if (tile === TILES.WATER1 || tile === TILES.WATER2) {
          tile = waterFrame === 0 ? TILES.WATER1 : TILES.WATER2;
        }
        
        const screenX = Math.floor(x * TILE_SIZE - camera.x);
        const screenY = Math.floor(y * TILE_SIZE - camera.y);
        
        const tileX = (tile % 16) * TILE_SIZE;
        const tileY = Math.floor(tile / 16) * TILE_SIZE;
        
        bctx.drawImage(
          assets.tileset,
          tileX, tileY, TILE_SIZE, TILE_SIZE,
          screenX, screenY, TILE_SIZE, TILE_SIZE
        );
      }
    }
    
    // Draw entities (sorted by Y)
    const entities = [...npcs, player].sort((a, b) => a.y - b.y);
    for (const entity of entities) {
      const sprite = entity === player ? assets.playerSprite : assets.npcSprite;
      entity.draw(bctx, sprite, camera.x, camera.y);
    }
    
    // Draw dialogue
    dialogue.draw(bctx);
  }
  
  function gameLoop(currentTime) {
    const dt = Math.min(32, currentTime - lastTime);
    lastTime = currentTime;
    
    // Update game
    update(dt);
    
    // Render to backbuffer
    bctx.clearRect(0, 0, BASE_W, BASE_H);
    drawWorld();
    
    // Post-process: BGR555 quantization
    let frame = bctx.getImageData(0, 0, BASE_W, BASE_H);
    frame = quantizeToBGR555(frame);
    bctx.putImageData(frame, 0, 0);
    
    // Apply LCD effect
    bctx.drawImage(scanlines, 0, 0);
    
    // Scale to display canvas
    sctx.clearRect(0, 0, screen.width, screen.height);
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(backbuf, 0, 0, screen.width, screen.height);
    
    // Update input state
    lastKeys = new Set(keys);
    
    requestAnimationFrame(gameLoop);
  }
  
  // Start
  requestAnimationFrame(gameLoop);
})();