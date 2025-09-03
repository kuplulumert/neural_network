/* Enhanced GBA-style RPG with proper pixel art rendering
   - Detailed tileset-based map rendering  
   - Animated sprite sheets with 4-directional facing
   - Polished dialogue system with typewriter effect
   - Solid tile collision detection
*/

(() => {
  const TILE_SIZE = 16;
  const CANVAS_WIDTH = 320;
  const CANVAS_HEIGHT = 240;
  const VIEW_TILES_X = Math.floor(CANVAS_WIDTH / TILE_SIZE);
  const VIEW_TILES_Y = Math.floor(CANVAS_HEIGHT / TILE_SIZE);

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  // ============================================================================
  // TILESET GENERATION
  // ============================================================================
  
  function createDetailedTileset() {
    const atlasSize = 128;
    const cvs = document.createElement('canvas');
    cvs.width = atlasSize;
    cvs.height = atlasSize;
    const g = cvs.getContext('2d');
    g.imageSmoothingEnabled = false;

    function drawTile(tileX, tileY, drawFunc) {
      g.save();
      g.translate(tileX * TILE_SIZE, tileY * TILE_SIZE);
      drawFunc(g);
      g.restore();
    }

    // Tile 0: Detailed grass
    drawTile(0, 0, (g) => {
      g.fillStyle = '#4a7c4e';
      g.fillRect(0, 0, 16, 16);
      
      // Grass texture with multiple shades
      const grassColors = ['#5a8c5e', '#3a6c3e', '#6a9c6e'];
      for(let i = 0; i < 12; i++) {
        g.fillStyle = grassColors[i % 3];
        const x = (i * 7) % 16;
        const y = (i * 5) % 16;
        g.fillRect(x, y, 1, Math.random() > 0.5 ? 2 : 1);
      }
    });

    // Tile 1: Path with texture
    drawTile(1, 0, (g) => {
      g.fillStyle = '#8b7355';
      g.fillRect(0, 0, 16, 16);
      
      g.fillStyle = '#7a6244';
      g.fillRect(0, 0, 16, 2);
      g.fillRect(0, 14, 16, 2);
      
      // Pebbles
      g.fillStyle = '#9b8365';
      for(let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * 14) + 1;
        const y = Math.floor(Math.random() * 12) + 2;
        g.fillRect(x, y, 2, 1);
      }
    });

    // Tile 2: Detailed tree
    drawTile(2, 0, (g) => {
      // Tree foliage layers
      g.fillStyle = '#1d4a1d';
      g.fillRect(1, 1, 14, 14);
      
      g.fillStyle = '#2d5a2d';
      g.fillRect(2, 2, 12, 12);
      
      g.fillStyle = '#3d6a3d';
      g.fillRect(3, 3, 10, 10);
      
      g.fillStyle = '#4d7a4d';
      g.fillRect(4, 4, 8, 8);
      
      // Highlights
      g.fillStyle = '#5d8a5d';
      g.fillRect(5, 5, 3, 3);
      g.fillRect(9, 6, 2, 2);
      
      // Trunk hint
      g.fillStyle = '#4a3c28';
      g.fillRect(7, 12, 2, 3);
    });

    // Tile 3: Flower field
    drawTile(3, 0, (g) => {
      g.fillStyle = '#4a7c4e';
      g.fillRect(0, 0, 16, 16);
      
      // Multiple flowers
      const flowers = [
        { x: 3, y: 4, color: '#e85d75' },
        { x: 10, y: 8, color: '#ffd700' },
        { x: 7, y: 11, color: '#ff69b4' },
        { x: 5, y: 7, color: '#ff1493' }
      ];
      
      flowers.forEach(f => {
        g.fillStyle = f.color;
        g.fillRect(f.x, f.y, 2, 2);
        g.fillStyle = '#90ee90';
        g.fillRect(f.x, f.y + 2, 1, 2);
      });
    });

    // Tile 4: Animated water
    drawTile(4, 0, (g) => {
      g.fillStyle = '#1e5f8e';
      g.fillRect(0, 0, 16, 16);
      
      // Wave layers
      g.fillStyle = '#2b6d9f';
      for(let y = 0; y < 16; y += 4) {
        g.fillRect(0, y, 16, 2);
      }
      
      g.fillStyle = '#4b8dbf';
      for(let i = 0; i < 4; i++) {
        const x = (i * 4) + 1;
        const y = (i * 3) % 16;
        g.fillRect(x, y, 3, 1);
      }
    });

    // Tile 5: Tall grass
    drawTile(5, 0, (g) => {
      g.fillStyle = '#2a5c2e';
      g.fillRect(0, 0, 16, 16);
      
      // Grass blades
      g.fillStyle = '#1a4c1e';
      for(let x = 0; x < 16; x += 2) {
        const h = 12 + Math.floor(Math.random() * 4);
        g.fillRect(x, 16 - h, 1, h);
      }
      
      g.fillStyle = '#3a6c3e';
      for(let x = 1; x < 16; x += 3) {
        const h = 10 + Math.floor(Math.random() * 4);
        g.fillRect(x, 16 - h, 1, h);
      }
    });

    // Tile 6: Rock
    drawTile(6, 0, (g) => {
      // Rock shape
      g.fillStyle = '#555555';
      g.fillRect(2, 3, 12, 11);
      
      g.fillStyle = '#666666';
      g.fillRect(3, 4, 10, 9);
      
      g.fillStyle = '#777777';
      g.fillRect(4, 5, 8, 7);
      
      g.fillStyle = '#888888';
      g.fillRect(5, 6, 6, 5);
      
      // Highlight
      g.fillStyle = '#999999';
      g.fillRect(6, 7, 2, 2);
      
      // Shadow
      g.fillStyle = '#333333';
      g.fillRect(2, 13, 12, 1);
    });

    // Tile 7: Brick wall
    drawTile(7, 0, (g) => {
      g.fillStyle = '#8b6f47';
      g.fillRect(0, 0, 16, 16);
      
      // Brick pattern
      g.fillStyle = '#6b4f27';
      for(let y = 0; y < 16; y += 4) {
        g.fillRect(0, y, 16, 1);
      }
      for(let y = 0; y < 16; y += 4) {
        const offset = (y / 4) % 2 === 0 ? 0 : 8;
        g.fillRect(offset, y, 1, 4);
        g.fillRect(offset + 8, y, 1, 4);
      }
    });

    const img = new Image();
    img.src = cvs.toDataURL();
    return img;
  }

  // ============================================================================
  // SPRITE GENERATION
  // ============================================================================
  
  function createCharacterSprite(colors) {
    const fw = 16, fh = 24;
    const frames = 4, dirs = 4;
    
    const cvs = document.createElement('canvas');
    cvs.width = fw * frames;
    cvs.height = fh * dirs;
    const g = cvs.getContext('2d');
    g.imageSmoothingEnabled = false;

    function drawChar(x, y, dir, frame) {
      const skin = '#f8c8a0';
      const hair = colors.hair || '#4a3c28';
      const shirt = colors.shirt || '#e85d75';
      const pants = colors.pants || '#4a5d8e';
      const shoes = '#2a2a2a';

      // Shadow
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.fillRect(x + 4, y + 21, 8, 2);

      // Walking animation offsets
      let legOffset = 0;
      if (frame === 1) legOffset = -1;
      if (frame === 2) legOffset = 0;
      if (frame === 3) legOffset = 1;

      // Draw based on direction
      if (dir === 0) { // Down
        // Body
        g.fillStyle = shirt;
        g.fillRect(x + 5, y + 8, 6, 7);
        
        // Arms
        g.fillStyle = skin;
        g.fillRect(x + 3, y + 9, 2, 5);
        g.fillRect(x + 11, y + 9, 2, 5);
        
        // Legs with animation
        g.fillStyle = pants;
        g.fillRect(x + 5, y + 15, 2, 4 + (frame === 1 ? legOffset : 0));
        g.fillRect(x + 9, y + 15, 2, 4 + (frame === 3 ? legOffset : 0));
        
        // Shoes
        g.fillStyle = shoes;
        g.fillRect(x + 5, y + 19 + (frame === 1 ? legOffset : 0), 2, 2);
        g.fillRect(x + 9, y + 19 + (frame === 3 ? legOffset : 0), 2, 2);
        
        // Head
        g.fillStyle = skin;
        g.fillRect(x + 5, y + 3, 6, 6);
        
        // Hair
        g.fillStyle = hair;
        g.fillRect(x + 4, y + 2, 8, 3);
        
        // Eyes
        g.fillStyle = '#000';
        g.fillRect(x + 6, y + 5, 1, 1);
        g.fillRect(x + 9, y + 5, 1, 1);
      } else if (dir === 1) { // Up
        // Same structure but back view
        g.fillStyle = shirt;
        g.fillRect(x + 5, y + 8, 6, 7);
        
        g.fillStyle = skin;
        g.fillRect(x + 3, y + 9, 2, 5);
        g.fillRect(x + 11, y + 9, 2, 5);
        
        g.fillStyle = pants;
        g.fillRect(x + 5, y + 15, 2, 4 + (frame === 1 ? legOffset : 0));
        g.fillRect(x + 9, y + 15, 2, 4 + (frame === 3 ? legOffset : 0));
        
        g.fillStyle = shoes;
        g.fillRect(x + 5, y + 19 + (frame === 1 ? legOffset : 0), 2, 2);
        g.fillRect(x + 9, y + 19 + (frame === 3 ? legOffset : 0), 2, 2);
        
        g.fillStyle = skin;
        g.fillRect(x + 5, y + 3, 6, 6);
        
        g.fillStyle = hair;
        g.fillRect(x + 4, y + 2, 8, 5);
      } else if (dir === 2) { // Left
        g.fillStyle = shirt;
        g.fillRect(x + 5, y + 8, 6, 7);
        
        g.fillStyle = skin;
        g.fillRect(x + 3, y + 9, 2, 5);
        
        g.fillStyle = pants;
        g.fillRect(x + 5, y + 15, 2, 4 + (frame === 1 ? legOffset : 0));
        g.fillRect(x + 9, y + 15, 2, 4 + (frame === 3 ? legOffset : 0));
        
        g.fillStyle = shoes;
        g.fillRect(x + 5, y + 19 + (frame === 1 ? legOffset : 0), 2, 2);
        g.fillRect(x + 9, y + 19 + (frame === 3 ? legOffset : 0), 2, 2);
        
        g.fillStyle = skin;
        g.fillRect(x + 5, y + 3, 6, 6);
        
        g.fillStyle = hair;
        g.fillRect(x + 4, y + 2, 8, 3);
        
        g.fillStyle = '#000';
        g.fillRect(x + 6, y + 5, 1, 1);
      } else { // Right
        g.fillStyle = shirt;
        g.fillRect(x + 5, y + 8, 6, 7);
        
        g.fillStyle = skin;
        g.fillRect(x + 11, y + 9, 2, 5);
        
        g.fillStyle = pants;
        g.fillRect(x + 5, y + 15, 2, 4 + (frame === 1 ? legOffset : 0));
        g.fillRect(x + 9, y + 15, 2, 4 + (frame === 3 ? legOffset : 0));
        
        g.fillStyle = shoes;
        g.fillRect(x + 5, y + 19 + (frame === 1 ? legOffset : 0), 2, 2);
        g.fillRect(x + 9, y + 19 + (frame === 3 ? legOffset : 0), 2, 2);
        
        g.fillStyle = skin;
        g.fillRect(x + 5, y + 3, 6, 6);
        
        g.fillStyle = hair;
        g.fillRect(x + 4, y + 2, 8, 3);
        
        g.fillStyle = '#000';
        g.fillRect(x + 9, y + 5, 1, 1);
      }
    }

    // Generate all frames
    for (let d = 0; d < dirs; d++) {
      for (let f = 0; f < frames; f++) {
        drawChar(f * fw, d * fh, d, f);
      }
    }

    const img = new Image();
    img.src = cvs.toDataURL();
    return img;
  }

  // ============================================================================
  // GAME SETUP
  // ============================================================================
  
  const assets = {
    tileset: createDetailedTileset(),
    playerSprite: createCharacterSprite({ hair: '#4a3c28', shirt: '#e85d75', pants: '#4a5d8e' }),
    npcSprite: createCharacterSprite({ hair: '#8b4513', shirt: '#4a7c4e', pants: '#2a2a2a' })
  };

  // Map configuration
  const MAP_WIDTH = 50;
  const MAP_HEIGHT = 40;
  const TILES = {
    GRASS: 0, PATH: 1, TREE: 2, FLOWERS: 3,
    WATER: 4, TALL_GRASS: 5, ROCK: 6, WALL: 7
  };
  const SOLID_TILES = new Set([TILES.TREE, TILES.WATER, TILES.ROCK, TILES.WALL]);

  // Generate map
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
        map[y][x] = TILES.TREE;
      } else if ((y === 10 || y === 20) && x > 5 && x < MAP_WIDTH - 5) {
        map[y][x] = TILES.PATH;
      } else if ((x === 15 || x === 30) && y > 5 && y < MAP_HEIGHT - 5) {
        map[y][x] = TILES.PATH;
      } else if (x > 35 && x < 45 && y > 25 && y < 35) {
        map[y][x] = TILES.WATER;
      } else if (x > 20 && x < 28 && y > 12 && y < 18) {
        map[y][x] = TILES.TALL_GRASS;
      } else if (Math.random() < 0.05) {
        map[y][x] = TILES.FLOWERS;
      } else if (Math.random() < 0.02) {
        map[y][x] = TILES.ROCK;
      } else {
        map[y][x] = TILES.GRASS;
      }
    }
  }

  // ============================================================================
  // GAME CLASSES
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
      this.speed = 2;
    }
    
    checkCollision(x, y) {
      const points = [
        [x, y], [x + this.width - 1, y],
        [x, y + this.height - 1], [x + this.width - 1, y + this.height - 1]
      ];
      
      for (const [px, py] of points) {
        const tx = Math.floor(px / TILE_SIZE);
        const ty = Math.floor(py / TILE_SIZE);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
        if (SOLID_TILES.has(map[ty][tx])) return true;
      }
      return false;
    }
    
    move(dx, dy) {
      if (dx < 0) this.direction = 2;
      else if (dx > 0) this.direction = 3;
      else if (dy < 0) this.direction = 1;
      else if (dy > 0) this.direction = 0;
      
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
        if (this.animTimer > 150) {
          this.animTimer = 0;
          this.frame = (this.frame + 1) % 3;
        }
      } else {
        this.frame = 0;
        this.animTimer = 0;
      }
    }
    
    draw(ctx, camX, camY, sprite) {
      const sx = Math.floor(this.x - camX);
      const sy = Math.floor(this.y - camY - 8);
      ctx.drawImage(sprite, (this.frame + 1) * 16, this.direction * 24, 16, 24, sx, sy, 16, 24);
    }
  }

  class DialogueBox {
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
      while (this.charTimer >= 30 && this.currentChar < this.lines[this.currentLine].length) {
        this.displayText += this.lines[this.currentLine][this.currentChar];
        this.currentChar++;
        this.charTimer -= 30;
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
      
      const h = 80, y = CANVAS_HEIGHT - h - 10, x = 10, w = CANVAS_WIDTH - 20;
      
      // Draw box
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#404040';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      
      // Draw text
      ctx.fillStyle = '#202020';
      ctx.font = '12px monospace';
      
      const words = this.displayText.split(' ');
      let line = '', yPos = y + 20;
      
      for (const word of words) {
        const test = line + (line ? ' ' : '') + word;
        if (ctx.measureText(test).width > w - 20 && line) {
          ctx.fillText(line, x + 10, yPos);
          line = word;
          yPos += 16;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, x + 10, yPos);
      
      // Continue indicator
      if (this.waiting && Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + w - 20, y + h - 20, 10, 10);
      }
    }
  }

  // ============================================================================
  // GAME STATE
  // ============================================================================
  
  const player = new Entity(10 * TILE_SIZE, 10 * TILE_SIZE);
  const npcs = [
    Object.assign(new Entity(15 * TILE_SIZE, 9 * TILE_SIZE), {
      dialogue: ["Hello traveler!", "Be careful in the tall grass!", "Wild creatures lurk there..."]
    }),
    Object.assign(new Entity(25 * TILE_SIZE, 20 * TILE_SIZE), {
      dialogue: ["I'm a merchant from afar.", "The water here has healing properties."]
    })
  ];
  
  const dialogue = new DialogueBox();
  const camera = { x: 0, y: 0 };
  const keys = new Set();
  const lastKeys = new Set();
  let lastTime = 0;
  let paused = false;

  // Input
  window.addEventListener('keydown', e => {
    keys.add(e.key);
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','z','Enter',' '].includes(e.key)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', e => keys.delete(e.key));

  function isKeyPressed(key) {
    return keys.has(key) && !lastKeys.has(key);
  }

  // Game loop
  function gameLoop(time) {
    const dt = time - lastTime;
    lastTime = time;
    
    // Update
    if (dialogue.active) {
      dialogue.update(dt);
      if (isKeyPressed('z') || isKeyPressed('Z') || isKeyPressed('Enter') || isKeyPressed(' ')) {
        dialogue.advance();
      }
    } else {
      // Player movement
      let dx = 0, dy = 0;
      if (keys.has('ArrowLeft') || keys.has('a')) dx = -player.speed;
      if (keys.has('ArrowRight') || keys.has('d')) dx = player.speed;
      if (keys.has('ArrowUp') || keys.has('w')) dy = -player.speed;
      if (keys.has('ArrowDown') || keys.has('s')) dy = player.speed;
      
      if (dx || dy) player.move(dx, dy);
      else player.isMoving = false;
      
      // Check NPC interaction
      if (isKeyPressed('z') || isKeyPressed('Z') || isKeyPressed('Enter') || isKeyPressed(' ')) {
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        let fx = px, fy = py;
        
        if (player.direction === 0) fy += TILE_SIZE;
        else if (player.direction === 1) fy -= TILE_SIZE;
        else if (player.direction === 2) fx -= TILE_SIZE;
        else if (player.direction === 3) fx += TILE_SIZE;
        
        for (const npc of npcs) {
          const nx = npc.x + npc.width / 2;
          const ny = npc.y + npc.height / 2;
          if (Math.abs(fx - nx) < TILE_SIZE && Math.abs(fy - ny) < TILE_SIZE) {
            dialogue.start(npc.dialogue);
            break;
          }
        }
      }
      
      player.update(dt);
    }
    
    // Camera
    camera.x = Math.max(0, Math.min(player.x + player.width / 2 - CANVAS_WIDTH / 2, MAP_WIDTH * TILE_SIZE - CANVAS_WIDTH));
    camera.y = Math.max(0, Math.min(player.y + player.height / 2 - CANVAS_HEIGHT / 2, MAP_HEIGHT * TILE_SIZE - CANVAS_HEIGHT));
    
    // Render
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw map
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.min(startX + VIEW_TILES_X + 1, MAP_WIDTH);
    const endY = Math.min(startY + VIEW_TILES_Y + 1, MAP_HEIGHT);
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = map[y][x];
        const sx = x * TILE_SIZE - camera.x;
        const sy = y * TILE_SIZE - camera.y;
        ctx.drawImage(assets.tileset, (tile % 8) * TILE_SIZE, Math.floor(tile / 8) * TILE_SIZE, TILE_SIZE, TILE_SIZE, sx, sy, TILE_SIZE, TILE_SIZE);
      }
    }
    
    // Draw entities
    [...npcs, player].sort((a, b) => a.y - b.y).forEach(e => {
      e.draw(ctx, camera.x, camera.y, e === player ? assets.playerSprite : assets.npcSprite);
    });
    
    dialogue.draw(ctx);
    
    lastKeys = new Set(keys);
    requestAnimationFrame(gameLoop);
  }
  
  // Save/load
  const saved = localStorage.getItem('gba-rpg-save');
  if (saved) {
    const data = JSON.parse(saved);
    player.x = data.x || player.x;
    player.y = data.y || player.y;
  }
  
  setInterval(() => {
    localStorage.setItem('gba-rpg-save', JSON.stringify({ x: player.x, y: player.y }));
  }, 5000);
  
  requestAnimationFrame(gameLoop);
})();