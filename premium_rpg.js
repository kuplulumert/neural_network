/* 
   PREMIUM 2D RPG ENGINE
   - High-quality pixel art with advanced shaders
   - Dynamic lighting and particle effects
   - Smooth animations and transitions
   - Professional UI/UX design
*/

(() => {
  // ============================================================================
  // PREMIUM RENDERING PIPELINE
  // ============================================================================
  
  const BASE_W = 240;
  const BASE_H = 160;
  const SCALE = 4; // 4x for crisp premium feel
  
  // Main canvas
  const screen = document.getElementById('game');
  screen.width = BASE_W * SCALE;
  screen.height = BASE_H * SCALE;
  const sctx = screen.getContext('2d', { alpha: false });
  sctx.imageSmoothingEnabled = false;
  
  // Game render buffer
  const gameBuffer = document.createElement('canvas');
  gameBuffer.width = BASE_W;
  gameBuffer.height = BASE_H;
  const gctx = gameBuffer.getContext('2d', { alpha: false });
  gctx.imageSmoothingEnabled = false;
  
  // Lighting layer
  const lightBuffer = document.createElement('canvas');
  lightBuffer.width = BASE_W;
  lightBuffer.height = BASE_H;
  const lctx = lightBuffer.getContext('2d', { alpha: true });
  
  // Effects layer
  const fxBuffer = document.createElement('canvas');
  fxBuffer.width = BASE_W;
  fxBuffer.height = BASE_H;
  const fxctx = fxBuffer.getContext('2d', { alpha: true });

  // ============================================================================
  // PREMIUM COLOR PALETTE
  // ============================================================================
  
  const PALETTE = {
    // Environment - Rich, vibrant colors
    GRASS: {
      SHADOW: '#0F3B0F',
      DARK: '#1A5A1A',
      BASE: '#2E7D2E',
      LIGHT: '#4CAF50',
      BRIGHT: '#66BB6A',
      HIGHLIGHT: '#81C784'
    },
    
    WATER: {
      DEEP: '#0D47A1',
      DARK: '#1565C0',
      BASE: '#1E88E5',
      LIGHT: '#42A5F5',
      BRIGHT: '#64B5F6',
      FOAM: '#E3F2FD'
    },
    
    STONE: {
      SHADOW: '#37474F',
      DARK: '#546E7A',
      BASE: '#78909C',
      LIGHT: '#90A4AE',
      BRIGHT: '#B0BEC5',
      HIGHLIGHT: '#CFD8DC'
    },
    
    WOOD: {
      SHADOW: '#3E2723',
      DARK: '#5D4037',
      BASE: '#795548',
      LIGHT: '#8D6E63',
      BRIGHT: '#A1887F',
      HIGHLIGHT: '#BCAAA4'
    },
    
    // Lighting
    LIGHT: {
      WARM: 'rgba(255, 235, 205, 0.4)',
      COOL: 'rgba(205, 235, 255, 0.3)',
      SUNSET: 'rgba(255, 183, 77, 0.5)',
      NIGHT: 'rgba(63, 81, 181, 0.6)',
      TORCH: 'rgba(255, 152, 0, 0.7)'
    },
    
    // UI - Premium glass morphism
    UI: {
      BG: 'rgba(18, 18, 18, 0.92)',
      GLASS: 'rgba(255, 255, 255, 0.08)',
      BORDER: 'rgba(255, 255, 255, 0.18)',
      TEXT: '#FFFFFF',
      ACCENT: '#00E5FF',
      GOLD: '#FFD700',
      SHADOW: 'rgba(0, 0, 0, 0.5)'
    }
  };

  // ============================================================================
  // PARTICLE SYSTEM
  // ============================================================================
  
  class Particle {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.life = 1.0;
      this.maxLife = 1.0;
      
      switch(type) {
        case 'leaf':
          this.vx = (Math.random() - 0.5) * 0.5;
          this.vy = Math.random() * 0.5 + 0.2;
          this.size = Math.random() * 3 + 2;
          this.color = Math.random() > 0.5 ? PALETTE.GRASS.LIGHT : PALETTE.GRASS.BRIGHT;
          this.rotation = Math.random() * Math.PI * 2;
          this.rotSpeed = (Math.random() - 0.5) * 0.1;
          break;
          
        case 'sparkle':
          this.vx = (Math.random() - 0.5) * 1;
          this.vy = (Math.random() - 0.5) * 1;
          this.size = Math.random() * 2 + 1;
          this.color = PALETTE.UI.GOLD;
          this.pulse = 0;
          break;
          
        case 'water':
          this.vx = (Math.random() - 0.5) * 0.3;
          this.vy = -Math.random() * 0.5 - 0.5;
          this.size = Math.random() * 2 + 1;
          this.color = PALETTE.WATER.BRIGHT;
          break;
          
        case 'dust':
          this.vx = (Math.random() - 0.5) * 0.2;
          this.vy = -Math.random() * 0.1;
          this.size = Math.random() * 1.5 + 0.5;
          this.color = PALETTE.STONE.LIGHT;
          break;
      }
    }
    
    update(dt) {
      this.life -= dt / 1000;
      
      this.x += this.vx;
      this.y += this.vy;
      
      if (this.type === 'leaf') {
        this.vx += Math.sin(this.y * 0.1) * 0.01;
        this.rotation += this.rotSpeed;
      } else if (this.type === 'sparkle') {
        this.pulse += dt / 100;
        this.size = (Math.sin(this.pulse) + 1) * 1.5 + 1;
      }
      
      return this.life > 0;
    }
    
    draw(ctx, camX, camY) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      
      const screenX = this.x - camX;
      const screenY = this.y - camY;
      
      if (this.type === 'leaf') {
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size * 0.7);
      } else if (this.type === 'sparkle') {
        // Draw star shape
        ctx.fillStyle = this.color;
        ctx.translate(screenX, screenY);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const x = Math.cos(angle) * this.size;
          const y = Math.sin(angle) * this.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY, this.size, this.size);
      }
      
      ctx.restore();
    }
  }
  
  const particles = [];
  
  function spawnParticle(x, y, type, count = 1) {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(
        x + (Math.random() - 0.5) * 10,
        y + (Math.random() - 0.5) * 10,
        type
      ));
    }
  }

  // ============================================================================
  // PREMIUM TILESET GENERATION
  // ============================================================================
  
  function createPremiumTileset() {
    const tileSize = 16;
    const atlasSize = 256;
    const cvs = document.createElement('canvas');
    cvs.width = atlasSize;
    cvs.height = atlasSize;
    const ctx = cvs.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    function drawTile(tileX, tileY, drawFunc) {
      ctx.save();
      ctx.translate(tileX * tileSize, tileY * tileSize);
      drawFunc(ctx);
      ctx.restore();
    }
    
    // Tile 0: Premium Grass with detail
    drawTile(0, 0, (c) => {
      // Base grass
      const gradient = c.createLinearGradient(0, 0, 0, 16);
      gradient.addColorStop(0, PALETTE.GRASS.BASE);
      gradient.addColorStop(1, PALETTE.GRASS.DARK);
      c.fillStyle = gradient;
      c.fillRect(0, 0, 16, 16);
      
      // Grass blades with variation
      c.fillStyle = PALETTE.GRASS.LIGHT;
      for (let i = 0; i < 8; i++) {
        const x = Math.floor(Math.random() * 14) + 1;
        const y = Math.floor(Math.random() * 14) + 1;
        const h = Math.floor(Math.random() * 3) + 2;
        c.fillRect(x, y, 1, h);
        
        // Highlight
        c.fillStyle = PALETTE.GRASS.BRIGHT;
        c.fillRect(x, y, 1, 1);
        c.fillStyle = PALETTE.GRASS.LIGHT;
      }
      
      // Shadow details
      c.fillStyle = PALETTE.GRASS.SHADOW;
      c.fillRect(0, 15, 16, 1);
      c.fillRect(15, 0, 1, 16);
    });
    
    // Tile 1: Premium Stone Path
    drawTile(1, 0, (c) => {
      // Base stone
      c.fillStyle = PALETTE.STONE.BASE;
      c.fillRect(0, 0, 16, 16);
      
      // Stone texture
      c.fillStyle = PALETTE.STONE.DARK;
      c.fillRect(0, 0, 16, 1);
      c.fillRect(0, 8, 16, 1);
      c.fillRect(0, 15, 16, 1);
      
      // Cracks and details
      c.fillStyle = PALETTE.STONE.SHADOW;
      c.fillRect(3, 2, 1, 5);
      c.fillRect(11, 9, 1, 4);
      
      // Highlights
      c.fillStyle = PALETTE.STONE.LIGHT;
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * 14) + 1;
        const y = Math.floor(Math.random() * 14) + 1;
        c.fillRect(x, y, 2, 1);
      }
      
      // Polish
      c.fillStyle = PALETTE.STONE.BRIGHT;
      c.fillRect(5, 5, 1, 1);
      c.fillRect(10, 3, 1, 1);
    });
    
    // Tile 2-5: Premium Tree (2x2)
    // Top-left
    drawTile(2, 0, (c) => {
      // Tree canopy with gradient
      const gradient = c.createRadialGradient(12, 12, 0, 12, 12, 14);
      gradient.addColorStop(0, PALETTE.GRASS.BRIGHT);
      gradient.addColorStop(0.5, PALETTE.GRASS.BASE);
      gradient.addColorStop(1, PALETTE.GRASS.SHADOW);
      
      c.fillStyle = gradient;
      c.beginPath();
      c.arc(12, 12, 12, Math.PI, Math.PI * 1.5, false);
      c.lineTo(16, 0);
      c.lineTo(16, 16);
      c.closePath();
      c.fill();
      
      // Leaf clusters
      c.fillStyle = PALETTE.GRASS.LIGHT;
      c.fillRect(8, 4, 3, 3);
      c.fillRect(5, 8, 4, 2);
      
      c.fillStyle = PALETTE.GRASS.HIGHLIGHT;
      c.fillRect(9, 5, 1, 1);
      c.fillRect(6, 8, 1, 1);
    });
    
    // Top-right
    drawTile(3, 0, (c) => {
      const gradient = c.createRadialGradient(4, 12, 0, 4, 12, 14);
      gradient.addColorStop(0, PALETTE.GRASS.BRIGHT);
      gradient.addColorStop(0.5, PALETTE.GRASS.BASE);
      gradient.addColorStop(1, PALETTE.GRASS.SHADOW);
      
      c.fillStyle = gradient;
      c.beginPath();
      c.arc(4, 12, 12, Math.PI * 1.5, 0, false);
      c.lineTo(16, 16);
      c.lineTo(0, 16);
      c.closePath();
      c.fill();
      
      c.fillStyle = PALETTE.GRASS.LIGHT;
      c.fillRect(5, 4, 3, 3);
      c.fillRect(3, 8, 4, 2);
      
      c.fillStyle = PALETTE.GRASS.HIGHLIGHT;
      c.fillRect(6, 5, 1, 1);
    });
    
    // Bottom-left (trunk)
    drawTile(2, 1, (c) => {
      const gradient = c.createRadialGradient(12, 4, 0, 12, 4, 14);
      gradient.addColorStop(0, PALETTE.GRASS.BRIGHT);
      gradient.addColorStop(0.5, PALETTE.GRASS.BASE);
      gradient.addColorStop(1, PALETTE.GRASS.SHADOW);
      
      c.fillStyle = gradient;
      c.beginPath();
      c.arc(12, 4, 12, Math.PI * 0.5, Math.PI, false);
      c.lineTo(0, 0);
      c.lineTo(16, 0);
      c.closePath();
      c.fill();
      
      // Trunk
      c.fillStyle = PALETTE.WOOD.DARK;
      c.fillRect(7, 8, 3, 8);
      c.fillStyle = PALETTE.WOOD.BASE;
      c.fillRect(8, 8, 1, 8);
      
      // Roots
      c.fillStyle = PALETTE.WOOD.SHADOW;
      c.fillRect(6, 14, 5, 2);
    });
    
    // Bottom-right (trunk)
    drawTile(3, 1, (c) => {
      const gradient = c.createRadialGradient(4, 4, 0, 4, 4, 14);
      gradient.addColorStop(0, PALETTE.GRASS.BRIGHT);
      gradient.addColorStop(0.5, PALETTE.GRASS.BASE);
      gradient.addColorStop(1, PALETTE.GRASS.SHADOW);
      
      c.fillStyle = gradient;
      c.beginPath();
      c.arc(4, 4, 12, 0, Math.PI * 0.5, false);
      c.lineTo(16, 0);
      c.lineTo(0, 0);
      c.closePath();
      c.fill();
      
      // Trunk
      c.fillStyle = PALETTE.WOOD.DARK;
      c.fillRect(6, 8, 3, 8);
      c.fillStyle = PALETTE.WOOD.BASE;
      c.fillRect(7, 8, 1, 8);
      
      // Roots
      c.fillStyle = PALETTE.WOOD.SHADOW;
      c.fillRect(5, 14, 5, 2);
    });
    
    // Tile 6-7: Animated Premium Water
    drawTile(6, 0, (c) => {
      // Water with depth gradient
      const gradient = c.createLinearGradient(0, 0, 0, 16);
      gradient.addColorStop(0, PALETTE.WATER.LIGHT);
      gradient.addColorStop(0.5, PALETTE.WATER.BASE);
      gradient.addColorStop(1, PALETTE.WATER.DARK);
      c.fillStyle = gradient;
      c.fillRect(0, 0, 16, 16);
      
      // Wave highlights
      c.fillStyle = PALETTE.WATER.BRIGHT;
      c.beginPath();
      c.moveTo(0, 4);
      c.quadraticCurveTo(8, 2, 16, 4);
      c.lineTo(16, 6);
      c.quadraticCurveTo(8, 4, 0, 6);
      c.closePath();
      c.fill();
      
      // Foam
      c.fillStyle = PALETTE.WATER.FOAM;
      c.fillRect(3, 3, 1, 1);
      c.fillRect(12, 4, 1, 1);
      c.fillRect(7, 10, 1, 1);
    });
    
    // Tile 8: Flowers
    drawTile(8, 0, (c) => {
      // Grass base
      const gradient = c.createLinearGradient(0, 0, 0, 16);
      gradient.addColorStop(0, PALETTE.GRASS.BASE);
      gradient.addColorStop(1, PALETTE.GRASS.DARK);
      c.fillStyle = gradient;
      c.fillRect(0, 0, 16, 16);
      
      // Flowers with gradients
      function drawFlower(x, y, color1, color2) {
        c.fillStyle = color1;
        c.fillRect(x - 1, y - 1, 3, 3);
        c.fillStyle = color2;
        c.fillRect(x, y, 1, 1);
        
        // Stem
        c.fillStyle = PALETTE.GRASS.DARK;
        c.fillRect(x, y + 2, 1, 3);
      }
      
      drawFlower(4, 5, '#FF6B9D', '#FFC0CB');
      drawFlower(11, 8, '#C8E6C9', '#FFFFFF');
      drawFlower(7, 11, '#FFE082', '#FFF59D');
    });
    
    // Tile 9: Premium Tall Grass
    drawTile(9, 0, (c) => {
      // Dark grass base
      c.fillStyle = PALETTE.GRASS.SHADOW;
      c.fillRect(0, 0, 16, 16);
      
      // Tall grass blades with gradient
      for (let x = 0; x < 16; x += 2) {
        const h = 10 + Math.floor(Math.sin(x) * 3);
        const gradient = c.createLinearGradient(0, 16 - h, 0, 16);
        gradient.addColorStop(0, PALETTE.GRASS.LIGHT);
        gradient.addColorStop(0.5, PALETTE.GRASS.BASE);
        gradient.addColorStop(1, PALETTE.GRASS.SHADOW);
        c.fillStyle = gradient;
        c.fillRect(x, 16 - h, 1, h);
      }
    });
    
    return cvs;
  }

  // ============================================================================
  // PREMIUM CHARACTER SPRITES
  // ============================================================================
  
  function createPremiumCharacter(config) {
    const fw = 16, fh = 24;
    const frames = 8; // More frames for smooth animation
    const directions = 4;
    
    const cvs = document.createElement('canvas');
    cvs.width = fw * frames;
    cvs.height = fh * directions;
    const ctx = cvs.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    function drawCharacter(frameX, frameY, dir, frame) {
      const x = frameX * fw;
      const y = frameY * fh;
      
      // Shadow with gradient
      const shadowGrad = ctx.createRadialGradient(x + 8, y + 22, 0, x + 8, y + 22, 4);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(x + 4, y + 20, 8, 4);
      
      // Walking animation
      const walkCycle = Math.sin(frame * Math.PI / 4) * 2;
      const armSwing = Math.sin(frame * Math.PI / 4 + Math.PI) * 3;
      
      // Body with shading
      ctx.fillStyle = config.armor || '#4A5568';
      ctx.fillRect(x + 4, y + 10, 8, 8);
      
      // Body highlights
      ctx.fillStyle = config.armorLight || '#718096';
      ctx.fillRect(x + 5, y + 11, 6, 2);
      ctx.fillRect(x + 6, y + 10, 4, 1);
      
      // Head with gradient
      const headGrad = ctx.createRadialGradient(x + 8, y + 6, 0, x + 8, y + 6, 4);
      headGrad.addColorStop(0, config.skin || '#FDBCB4');
      headGrad.addColorStop(1, config.skinShadow || '#F4A460');
      ctx.fillStyle = headGrad;
      ctx.fillRect(x + 5, y + 4, 6, 6);
      
      // Hair with detail
      ctx.fillStyle = config.hair || '#8B4513';
      ctx.fillRect(x + 4, y + 2, 8, 4);
      ctx.fillStyle = config.hairLight || '#A0522D';
      ctx.fillRect(x + 5, y + 2, 6, 2);
      
      // Eyes (direction dependent)
      if (dir === 0 || dir === 2 || dir === 3) { // Not showing back
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 6, y + 6, 2, 2);
        ctx.fillRect(x + 9, y + 6, 2, 2);
        
        ctx.fillStyle = config.eyes || '#4169E1';
        ctx.fillRect(x + 6 + (dir === 2 ? 0 : dir === 3 ? 1 : 0), y + 6, 1, 1);
        ctx.fillRect(x + 9 + (dir === 2 ? 0 : dir === 3 ? 1 : 0), y + 6, 1, 1);
      }
      
      // Arms with animation
      ctx.fillStyle = config.skin || '#FDBCB4';
      ctx.fillRect(x + 3, y + 11 + Math.floor(armSwing), 2, 5);
      ctx.fillRect(x + 11, y + 11 - Math.floor(armSwing), 2, 5);
      
      // Legs with walk cycle
      ctx.fillStyle = config.pants || '#2C3E50';
      ctx.fillRect(x + 5, y + 17 + Math.floor(Math.abs(walkCycle)), 3, 5);
      ctx.fillRect(x + 8, y + 17 - Math.floor(Math.abs(walkCycle)), 3, 5);
      
      // Boots with detail
      ctx.fillStyle = config.boots || '#654321';
      ctx.fillRect(x + 5, y + 21 + Math.floor(Math.abs(walkCycle)), 3, 2);
      ctx.fillRect(x + 8, y + 21 - Math.floor(Math.abs(walkCycle)), 3, 2);
      
      // Equipment details
      if (config.sword && dir !== 1) { // Show sword except when facing up
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(x + 2, y + 12, 1, 8);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 1, y + 11, 3, 2);
      }
    }
    
    // Generate all animation frames
    for (let dir = 0; dir < directions; dir++) {
      for (let frame = 0; frame < frames; frame++) {
        drawCharacter(frame, dir, dir, frame);
      }
    }
    
    return cvs;
  }

  // ============================================================================
  // DYNAMIC LIGHTING SYSTEM
  // ============================================================================
  
  class LightSource {
    constructor(x, y, radius, color, intensity = 1.0, flicker = false) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.intensity = intensity;
      this.baseIntensity = intensity;
      this.flicker = flicker;
      this.flickerPhase = Math.random() * Math.PI * 2;
    }
    
    update(dt) {
      if (this.flicker) {
        this.flickerPhase += dt / 200;
        this.intensity = this.baseIntensity * (0.8 + Math.sin(this.flickerPhase) * 0.2);
      }
    }
    
    draw(ctx, camX, camY) {
      const screenX = this.x - camX;
      const screenY = this.y - camY;
      
      const gradient = ctx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, this.radius * this.intensity
      );
      
      const [r, g, b] = this.parseColor(this.color);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.intensity * 0.8})`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${this.intensity * 0.4})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        screenX - this.radius,
        screenY - this.radius,
        this.radius * 2,
        this.radius * 2
      );
    }
    
    parseColor(color) {
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
      }
      return [255, 255, 255];
    }
  }
  
  const lights = [];
  let ambientLight = { r: 0.7, g: 0.7, b: 0.8 }; // Slightly blue ambient
  let timeOfDay = 0.5; // 0 = night, 0.5 = day, 1 = night

  // ============================================================================
  // ADVANCED MAP GENERATION
  // ============================================================================
  
  const MAP_WIDTH = 64;
  const MAP_HEIGHT = 64;
  const TILE_SIZE = 16;
  
  const TILES = {
    GRASS: 0,
    STONE: 1,
    TREE_TL: 2,
    TREE_TR: 3,
    TREE_BL: 18,
    TREE_BR: 19,
    WATER: 6,
    FLOWERS: 8,
    TALL_GRASS: 9
  };
  
  const SOLID_TILES = new Set([
    TILES.TREE_TL, TILES.TREE_TR, TILES.TREE_BL, TILES.TREE_BR,
    TILES.WATER
  ]);
  
  // Generate premium map with biomes
  function generatePremiumMap() {
    const map = [];
    const heightMap = [];
    
    // Generate height map using Perlin-like noise
    for (let y = 0; y < MAP_HEIGHT; y++) {
      heightMap[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const nx = x / MAP_WIDTH - 0.5;
        const ny = y / MAP_HEIGHT - 0.5;
        heightMap[y][x] = 
          Math.sin(nx * 4) * 0.3 +
          Math.cos(ny * 4) * 0.3 +
          Math.sin(nx * 8) * 0.2 +
          Math.cos(ny * 8) * 0.2;
      }
    }
    
    // Generate tiles based on height
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const h = heightMap[y][x];
        
        if (h < -0.3) {
          map[y][x] = TILES.WATER;
        } else if (h < -0.1) {
          map[y][x] = Math.random() > 0.7 ? TILES.FLOWERS : TILES.GRASS;
        } else if (h < 0.2) {
          map[y][x] = TILES.GRASS;
        } else if (h < 0.4) {
          map[y][x] = Math.random() > 0.8 ? TILES.TALL_GRASS : TILES.GRASS;
        } else {
          map[y][x] = TILES.STONE;
        }
      }
    }
    
    // Add trees in clusters
    for (let i = 0; i < 30; i++) {
      const cx = Math.floor(Math.random() * (MAP_WIDTH - 10)) + 5;
      const cy = Math.floor(Math.random() * (MAP_HEIGHT - 10)) + 5;
      const radius = Math.random() * 3 + 2;
      
      for (let y = -radius; y < radius; y++) {
        for (let x = -radius; x < radius; x++) {
          if (x * x + y * y < radius * radius && Math.random() > 0.3) {
            const tx = Math.floor(cx + x);
            const ty = Math.floor(cy + y);
            
            if (tx > 0 && ty > 0 && tx < MAP_WIDTH - 1 && ty < MAP_HEIGHT - 1) {
              if (map[ty][tx] === TILES.GRASS && map[ty][tx + 1] === TILES.GRASS &&
                  map[ty + 1] && map[ty + 1][tx] === TILES.GRASS && map[ty + 1][tx + 1] === TILES.GRASS) {
                map[ty][tx] = TILES.TREE_TL;
                map[ty][tx + 1] = TILES.TREE_TR;
                map[ty + 1][tx] = TILES.TREE_BL;
                map[ty + 1][tx + 1] = TILES.TREE_BR;
              }
            }
          }
        }
      }
    }
    
    // Add paths
    function carvePath(x1, y1, x2, y2) {
      let x = x1, y = y1;
      while (x !== x2 || y !== y2) {
        if (map[y] && map[y][x] !== undefined) {
          map[y][x] = TILES.STONE;
          if (map[y - 1]) map[y - 1][x] = TILES.STONE;
          if (map[y + 1]) map[y + 1][x] = TILES.STONE;
          if (map[y][x - 1] !== undefined) map[y][x - 1] = TILES.STONE;
          if (map[y][x + 1] !== undefined) map[y][x + 1] = TILES.STONE;
        }
        
        if (Math.random() > 0.5) {
          x += x < x2 ? 1 : x > x2 ? -1 : 0;
        } else {
          y += y < y2 ? 1 : y > y2 ? -1 : 0;
        }
      }
    }
    
    // Create main paths
    carvePath(10, 10, 50, 10);
    carvePath(10, 10, 10, 50);
    carvePath(50, 10, 50, 50);
    carvePath(10, 50, 50, 50);
    carvePath(30, 10, 30, 50);
    carvePath(10, 30, 50, 30);
    
    return map;
  }
  
  const map = generatePremiumMap();

  // ============================================================================
  // PREMIUM ENTITY SYSTEM
  // ============================================================================
  
  class PremiumEntity {
    constructor(x, y, config = {}) {
      this.x = x;
      this.y = y;
      this.z = 0; // Height for jumping
      this.width = config.width || 12;
      this.height = config.height || 12;
      this.speed = config.speed || 2;
      this.direction = 0; // 0=down, 1=up, 2=left, 3=right
      
      // Animation
      this.animFrame = 0;
      this.animTimer = 0;
      this.animSpeed = config.animSpeed || 100;
      this.isMoving = false;
      
      // Physics
      this.vx = 0;
      this.vy = 0;
      this.vz = 0;
      this.friction = 0.85;
      
      // Effects
      this.shadow = true;
      this.light = config.light || null;
      this.particleTimer = 0;
      this.footstepTimer = 0;
      
      // State
      this.health = config.health || 100;
      this.maxHealth = config.maxHealth || 100;
      this.invulnerable = false;
      this.invulnerableTimer = 0;
    }
    
    update(dt) {
      // Physics update
      this.x += this.vx;
      this.y += this.vy;
      this.z += this.vz;
      
      this.vx *= this.friction;
      this.vy *= this.friction;
      
      if (this.z > 0) {
        this.vz -= 0.5; // Gravity
      } else if (this.z < 0) {
        this.z = 0;
        this.vz = 0;
      }
      
      // Animation update
      if (this.isMoving) {
        this.animTimer += dt;
        if (this.animTimer > this.animSpeed) {
          this.animTimer = 0;
          this.animFrame = (this.animFrame + 1) % 8;
          
          // Footstep particles
          this.footstepTimer += dt;
          if (this.footstepTimer > 200 && this.z === 0) {
            this.footstepTimer = 0;
            spawnParticle(this.x + this.width / 2, this.y + this.height, 'dust', 2);
          }
        }
      } else {
        this.animFrame = 0;
        this.animTimer = 0;
      }
      
      // Invulnerability
      if (this.invulnerable) {
        this.invulnerableTimer -= dt;
        if (this.invulnerableTimer <= 0) {
          this.invulnerable = false;
        }
      }
      
      // Update attached light
      if (this.light) {
        this.light.x = this.x + this.width / 2;
        this.light.y = this.y + this.height / 2;
        this.light.update(dt);
      }
    }
    
    move(dx, dy) {
      // Smooth movement with acceleration
      this.vx += dx * 0.3;
      this.vy += dy * 0.3;
      
      // Clamp max speed
      const maxSpeed = this.speed;
      const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (currentSpeed > maxSpeed) {
        this.vx = (this.vx / currentSpeed) * maxSpeed;
        this.vy = (this.vy / currentSpeed) * maxSpeed;
      }
      
      // Update direction
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx < 0 ? 2 : 3;
      } else if (Math.abs(dy) > 0.1) {
        this.direction = dy < 0 ? 1 : 0;
      }
      
      this.isMoving = true;
    }
    
    jump() {
      if (this.z === 0) {
        this.vz = 5;
        spawnParticle(this.x + this.width / 2, this.y + this.height, 'dust', 5);
      }
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
    
    draw(ctx, sprite, camX, camY) {
      const screenX = Math.floor(this.x - camX);
      const screenY = Math.floor(this.y - camY - this.z);
      
      // Draw shadow
      if (this.shadow) {
        ctx.save();
        ctx.globalAlpha = 0.3 * (1 - this.z / 50);
        ctx.fillStyle = '#000000';
        const shadowScale = 1 - this.z / 100;
        ctx.fillRect(
          screenX + this.width * (1 - shadowScale) / 2,
          screenY + this.height - 2,
          this.width * shadowScale,
          4
        );
        ctx.restore();
      }
      
      // Draw sprite with invulnerability flashing
      if (!this.invulnerable || Math.floor(this.invulnerableTimer / 100) % 2 === 0) {
        ctx.drawImage(
          sprite,
          this.animFrame * 16, this.direction * 24,
          16, 24,
          screenX, screenY - 8,
          16, 24
        );
      }
      
      // Draw health bar if damaged
      if (this.health < this.maxHealth) {
        const barWidth = 12;
        const barHeight = 2;
        const barX = screenX + 2;
        const barY = screenY - 12;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
        
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
      }
    }
  }

  // ============================================================================
  // PREMIUM DIALOGUE SYSTEM
  // ============================================================================
  
  class PremiumDialogue {
    constructor() {
      this.active = false;
      this.queue = [];
      this.currentMessage = null;
      this.displayText = '';
      this.targetText = '';
      this.charIndex = 0;
      this.charTimer = 0;
      this.charSpeed = 30;
      
      this.speaker = null;
      this.portrait = null;
      this.choices = null;
      this.selectedChoice = 0;
      
      this.boxY = BASE_H;
      this.targetBoxY = BASE_H - 60;
      this.animating = true;
    }
    
    show(messages, speaker = null, portrait = null) {
      this.queue = Array.isArray(messages) ? [...messages] : [messages];
      this.speaker = speaker;
      this.portrait = portrait;
      this.active = true;
      this.animating = true;
      this.boxY = BASE_H;
      this.nextMessage();
    }
    
    nextMessage() {
      if (this.queue.length === 0) {
        this.close();
        return;
      }
      
      this.currentMessage = this.queue.shift();
      this.targetText = this.currentMessage.text || this.currentMessage;
      this.displayText = '';
      this.charIndex = 0;
      this.choices = this.currentMessage.choices || null;
      this.selectedChoice = 0;
    }
    
    update(dt) {
      if (!this.active) return;
      
      // Animate box sliding in/out
      if (this.animating) {
        const speed = 5;
        if (this.active && this.boxY > this.targetBoxY) {
          this.boxY -= speed;
          if (this.boxY <= this.targetBoxY) {
            this.boxY = this.targetBoxY;
            this.animating = false;
          }
        } else if (!this.active && this.boxY < BASE_H) {
          this.boxY += speed;
          if (this.boxY >= BASE_H) {
            this.boxY = BASE_H;
          }
        }
      }
      
      // Typewriter effect
      if (!this.animating && this.charIndex < this.targetText.length) {
        this.charTimer += dt;
        while (this.charTimer >= this.charSpeed && this.charIndex < this.targetText.length) {
          this.displayText += this.targetText[this.charIndex];
          this.charIndex++;
          this.charTimer -= this.charSpeed;
          
          // Play sound effect here
        }
      }
    }
    
    advance() {
      if (this.charIndex < this.targetText.length) {
        // Skip to end
        this.displayText = this.targetText;
        this.charIndex = this.targetText.length;
      } else if (this.choices) {
        // Handle choice selection
        const callback = this.choices[this.selectedChoice].callback;
        if (callback) callback();
        this.choices = null;
        this.nextMessage();
      } else {
        this.nextMessage();
      }
    }
    
    close() {
      this.active = false;
      this.animating = true;
      this.targetBoxY = BASE_H;
    }
    
    draw(ctx) {
      if (this.boxY >= BASE_H) return;
      
      const boxHeight = 60;
      const boxX = 4;
      const boxWidth = BASE_W - 8;
      
      // Draw backdrop blur
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, this.boxY - 10, BASE_W, boxHeight + 20);
      
      // Draw glass morphism panel
      const gradient = ctx.createLinearGradient(0, this.boxY, 0, this.boxY + boxHeight);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(boxX, this.boxY, boxWidth, boxHeight);
      
      // Draw premium border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, this.boxY, boxWidth, boxHeight);
      
      // Inner glow
      ctx.shadowColor = PALETTE.UI.ACCENT;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = PALETTE.UI.ACCENT;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(boxX + 2, this.boxY + 2, boxWidth - 4, boxHeight - 4);
      ctx.shadowBlur = 0;
      
      // Draw portrait if available
      let textX = boxX + 8;
      if (this.portrait) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(boxX + 4, this.boxY + 4, 32, 32);
        // Draw portrait image here
        textX += 40;
      }
      
      // Draw speaker name
      if (this.speaker) {
        ctx.fillStyle = PALETTE.UI.GOLD;
        ctx.font = 'bold 8px monospace';
        ctx.fillText(this.speaker, textX, this.boxY + 10);
      }
      
      // Draw text with premium font
      ctx.fillStyle = PALETTE.UI.TEXT;
      ctx.font = '10px monospace';
      
      const lines = this.wrapText(this.displayText, boxWidth - 20);
      const textY = this.speaker ? this.boxY + 20 : this.boxY + 12;
      
      lines.forEach((line, i) => {
        ctx.fillText(line, textX, textY + i * 12);
      });
      
      // Draw choices if available
      if (this.choices && this.charIndex >= this.targetText.length) {
        const choiceY = this.boxY + boxHeight - 20;
        this.choices.forEach((choice, i) => {
          const choiceX = boxX + 10 + i * 80;
          
          if (i === this.selectedChoice) {
            ctx.fillStyle = PALETTE.UI.ACCENT;
            ctx.fillRect(choiceX - 2, choiceY - 10, 70, 14);
          }
          
          ctx.fillStyle = i === this.selectedChoice ? PALETTE.UI.TEXT : 'rgba(255, 255, 255, 0.7)';
          ctx.fillText(choice.text, choiceX, choiceY);
        });
      }
      
      // Draw continue indicator
      if (!this.choices && this.charIndex >= this.targetText.length) {
        const time = Date.now() / 300;
        const pulse = Math.sin(time) * 0.5 + 0.5;
        
        ctx.fillStyle = PALETTE.UI.GOLD;
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.moveTo(boxX + boxWidth - 12, this.boxY + boxHeight - 12);
        ctx.lineTo(boxX + boxWidth - 8, this.boxY + boxHeight - 8);
        ctx.lineTo(boxX + boxWidth - 12, this.boxY + boxHeight - 4);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    }
    
    wrapText(text, maxWidth) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const metrics = gctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) lines.push(currentLine);
      return lines;
    }
  }

  // ============================================================================
  // GAME INITIALIZATION
  // ============================================================================
  
  const assets = {
    tileset: createPremiumTileset(),
    player: createPremiumCharacter({
      armor: '#4A5568',
      armorLight: '#718096',
      hair: '#8B4513',
      hairLight: '#A0522D',
      skin: '#FDBCB4',
      skinShadow: '#F4A460',
      eyes: '#4169E1',
      pants: '#2C3E50',
      boots: '#654321',
      sword: true
    }),
    npc: createPremiumCharacter({
      armor: '#6B46C1',
      armorLight: '#9F7AEA',
      hair: '#1A202C',
      hairLight: '#2D3748',
      skin: '#FDBCB4',
      skinShadow: '#F4A460',
      eyes: '#059669',
      pants: '#1F2937',
      boots: '#4B5563'
    })
  };
  
  // Create entities
  const player = new PremiumEntity(20 * TILE_SIZE, 20 * TILE_SIZE, {
    speed: 2.5,
    health: 100,
    maxHealth: 100
  });
  
  // Add player light
  player.light = new LightSource(
    player.x + 8, player.y + 8,
    40,
    '#FFE082',
    0.6,
    true
  );
  lights.push(player.light);
  
  // Create NPCs
  const npcs = [];
  
  const wizard = new PremiumEntity(25 * TILE_SIZE, 20 * TILE_SIZE, {
    speed: 0
  });
  wizard.dialogue = [
    { text: "Greetings, brave adventurer!", speaker: "Wizard" },
    { text: "This realm holds many secrets and treasures..." },
    { text: "But beware, darkness falls quickly here." },
    {
      text: "Will you accept my quest?",
      choices: [
        { text: "Yes", callback: () => console.log("Quest accepted!") },
        { text: "Not yet", callback: () => console.log("Quest declined") }
      ]
    }
  ];
  npcs.push(wizard);
  
  // Add environmental lights
  for (let i = 0; i < 10; i++) {
    lights.push(new LightSource(
      Math.random() * MAP_WIDTH * TILE_SIZE,
      Math.random() * MAP_HEIGHT * TILE_SIZE,
      60 + Math.random() * 40,
      Math.random() > 0.5 ? '#FFB74D' : '#81C784',
      0.4 + Math.random() * 0.3,
      Math.random() > 0.7
    ));
  }
  
  // Camera with smooth follow
  const camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    shake: 0,
    
    follow(target) {
      this.targetX = target.x + target.width / 2 - BASE_W / 2;
      this.targetY = target.y + target.height / 2 - BASE_H / 2;
      
      // Smooth camera movement
      this.x += (this.targetX - this.x) * 0.1;
      this.y += (this.targetY - this.y) * 0.1;
      
      // Apply shake
      if (this.shake > 0) {
        this.x += (Math.random() - 0.5) * this.shake;
        this.y += (Math.random() - 0.5) * this.shake;
        this.shake *= 0.9;
      }
      
      // Clamp to map bounds
      this.x = Math.max(0, Math.min(this.x, MAP_WIDTH * TILE_SIZE - BASE_W));
      this.y = Math.max(0, Math.min(this.y, MAP_HEIGHT * TILE_SIZE - BASE_H));
    },
    
    addShake(amount) {
      this.shake = Math.min(this.shake + amount, 10);
    }
  };
  
  const dialogue = new PremiumDialogue();
  
  // Input system
  const keys = new Set();
  const lastKeys = new Set();
  
  window.addEventListener('keydown', e => {
    keys.add(e.key.toLowerCase());
    if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','z','x','enter',' '].includes(e.key.toLowerCase())) {
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
  let weatherTimer = 0;
  let dayNightTimer = 0;
  
  function update(dt) {
    // Update day/night cycle
    dayNightTimer += dt / 10000; // Full cycle in ~20 seconds
    timeOfDay = (Math.sin(dayNightTimer) + 1) / 2;
    
    // Update ambient light based on time
    if (timeOfDay < 0.3 || timeOfDay > 0.7) {
      // Night
      ambientLight = { r: 0.3, g: 0.3, b: 0.5 };
    } else if (timeOfDay < 0.4 || timeOfDay > 0.6) {
      // Dawn/Dusk
      ambientLight = { r: 0.7, g: 0.5, b: 0.4 };
    } else {
      // Day
      ambientLight = { r: 0.9, g: 0.9, b: 0.8 };
    }
    
    // Weather effects
    weatherTimer += dt;
    if (weatherTimer > 100) {
      weatherTimer = 0;
      
      // Random leaf particles
      if (Math.random() > 0.7) {
        spawnParticle(
          camera.x + Math.random() * BASE_W,
          camera.y - 10,
          'leaf',
          Math.floor(Math.random() * 3) + 1
        );
      }
      
      // Random sparkles near water
      const camTileX = Math.floor(camera.x / TILE_SIZE);
      const camTileY = Math.floor(camera.y / TILE_SIZE);
      
      for (let y = camTileY; y < camTileY + 12 && y < MAP_HEIGHT; y++) {
        for (let x = camTileX; x < camTileX + 16 && x < MAP_WIDTH; x++) {
          if (map[y] && map[y][x] === TILES.WATER && Math.random() > 0.95) {
            spawnParticle(
              x * TILE_SIZE + Math.random() * TILE_SIZE,
              y * TILE_SIZE + Math.random() * TILE_SIZE,
              'water'
            );
          }
        }
      }
    }
    
    // Dialogue handling
    dialogue.update(dt);
    
    if (dialogue.active) {
      if (isKeyPressed('z') || isKeyPressed('enter') || isKeyPressed(' ')) {
        dialogue.advance();
      }
      if (dialogue.choices) {
        if (isKeyPressed('arrowleft') || isKeyPressed('a')) {
          dialogue.selectedChoice = Math.max(0, dialogue.selectedChoice - 1);
        }
        if (isKeyPressed('arrowright') || isKeyPressed('d')) {
          dialogue.selectedChoice = Math.min(dialogue.choices.length - 1, dialogue.selectedChoice + 1);
        }
      }
      return; // Don't update game while dialogue is active
    }
    
    // Player input
    let moveX = 0, moveY = 0;
    
    if (keys.has('arrowleft') || keys.has('a')) moveX -= 1;
    if (keys.has('arrowright') || keys.has('d')) moveX += 1;
    if (keys.has('arrowup') || keys.has('w')) moveY -= 1;
    if (keys.has('arrowdown') || keys.has('s')) moveY += 1;
    
    if (moveX || moveY) {
      // Normalize diagonal movement
      if (moveX && moveY) {
        moveX *= 0.707;
        moveY *= 0.707;
      }
      player.move(moveX, moveY);
    } else {
      player.isMoving = false;
    }
    
    // Jump
    if (isKeyPressed('x') || isKeyPressed(' ')) {
      player.jump();
      camera.addShake(2);
    }
    
    // Interaction
    if (isKeyPressed('z') || isKeyPressed('enter')) {
      // Check for NPC interaction
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      
      for (const npc of npcs) {
        const dist = Math.sqrt(
          Math.pow(npc.x + npc.width / 2 - px, 2) +
          Math.pow(npc.y + npc.height / 2 - py, 2)
        );
        
        if (dist < 20) {
          if (npc.dialogue) {
            dialogue.show(npc.dialogue, "Wizard");
            camera.addShake(1);
            spawnParticle(npc.x + 8, npc.y, 'sparkle', 5);
          }
          break;
        }
      }
    }
    
    // Update entities
    player.update(dt);
    
    // Check collisions after physics update
    if (player.checkCollision(player.x, player.y)) {
      // Bounce back
      player.x -= player.vx * 2;
      player.y -= player.vy * 2;
      player.vx = -player.vx * 0.5;
      player.vy = -player.vy * 0.5;
      camera.addShake(3);
    }
    
    for (const npc of npcs) {
      npc.update(dt);
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      if (!particles[i].update(dt)) {
        particles.splice(i, 1);
      }
    }
    
    // Update lights
    for (const light of lights) {
      light.update(dt);
    }
    
    // Update camera
    camera.follow(player);
  }
  
  function render() {
    // Clear main buffer
    gctx.fillStyle = '#000000';
    gctx.fillRect(0, 0, BASE_W, BASE_H);
    
    // Draw map
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.min(startX + Math.ceil(BASE_W / TILE_SIZE) + 1, MAP_WIDTH);
    const endY = Math.min(startY + Math.ceil(BASE_H / TILE_SIZE) + 1, MAP_HEIGHT);
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (map[y] && map[y][x] !== undefined) {
          const tile = map[y][x];
          const screenX = x * TILE_SIZE - camera.x;
          const screenY = y * TILE_SIZE - camera.y;
          
          // Draw base tile
          const tileX = (tile % 16) * TILE_SIZE;
          const tileY = Math.floor(tile / 16) * TILE_SIZE;
          
          gctx.drawImage(
            assets.tileset,
            tileX, tileY, TILE_SIZE, TILE_SIZE,
            screenX, screenY, TILE_SIZE, TILE_SIZE
          );
        }
      }
    }
    
    // Draw entities (sorted by Y for depth)
    const entities = [...npcs, player].sort((a, b) => a.y - b.y);
    
    for (const entity of entities) {
      entity.draw(gctx, entity === player ? assets.player : assets.npc, camera.x, camera.y);
    }
    
    // Draw particles
    for (const particle of particles) {
      particle.draw(gctx, camera.x, camera.y);
    }
    
    // Apply lighting
    lctx.clearRect(0, 0, BASE_W, BASE_H);
    
    // Draw ambient light
    lctx.fillStyle = `rgba(${Math.floor(ambientLight.r * 255)}, ${Math.floor(ambientLight.g * 255)}, ${Math.floor(ambientLight.b * 255)}, ${1 - timeOfDay * 0.5})`;
    lctx.fillRect(0, 0, BASE_W, BASE_H);
    
    // Draw light sources
    lctx.globalCompositeOperation = 'lighter';
    for (const light of lights) {
      light.draw(lctx, camera.x, camera.y);
    }
    lctx.globalCompositeOperation = 'source-over';
    
    // Composite lighting
    gctx.globalCompositeOperation = 'multiply';
    gctx.drawImage(lightBuffer, 0, 0);
    gctx.globalCompositeOperation = 'source-over';
    
    // Draw UI
    dialogue.draw(gctx);
    
    // Draw HUD
    drawHUD();
    
    // Final presentation with post-processing
    sctx.clearRect(0, 0, screen.width, screen.height);
    
    // Draw game with scaling
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(gameBuffer, 0, 0, screen.width, screen.height);
    
    // Add vignette effect
    const vignette = sctx.createRadialGradient(
      screen.width / 2, screen.height / 2, 0,
      screen.width / 2, screen.height / 2, screen.width / 2
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.7, 'rgba(0,0,0,0.1)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
    sctx.fillStyle = vignette;
    sctx.fillRect(0, 0, screen.width, screen.height);
  }
  
  function drawHUD() {
    // Health bar
    const barX = 8;
    const barY = 8;
    const barWidth = 50;
    const barHeight = 6;
    
    // Background
    gctx.fillStyle = 'rgba(0,0,0,0.7)';
    gctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    
    // Health gradient
    const healthGradient = gctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    healthGradient.addColorStop(0, '#FF4444');
    healthGradient.addColorStop(0.5, '#FFAA44');
    healthGradient.addColorStop(1, '#44FF44');
    
    gctx.fillStyle = healthGradient;
    gctx.fillRect(barX, barY, barWidth * (player.health / player.maxHealth), barHeight);
    
    // Border
    gctx.strokeStyle = PALETTE.UI.BORDER;
    gctx.lineWidth = 1;
    gctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    
    // Time of day indicator
    const timeX = BASE_W - 30;
    const timeY = 8;
    const timeRadius = 8;
    
    gctx.fillStyle = 'rgba(0,0,0,0.7)';
    gctx.beginPath();
    gctx.arc(timeX, timeY, timeRadius + 2, 0, Math.PI * 2);
    gctx.fill();
    
    // Sun/Moon
    if (timeOfDay > 0.3 && timeOfDay < 0.7) {
      // Sun
      gctx.fillStyle = '#FFD700';
      gctx.beginPath();
      gctx.arc(timeX, timeY, timeRadius, 0, Math.PI * 2);
      gctx.fill();
    } else {
      // Moon
      gctx.fillStyle = '#E0E0E0';
      gctx.beginPath();
      gctx.arc(timeX, timeY, timeRadius, 0, Math.PI * 2);
      gctx.fill();
      
      gctx.fillStyle = 'rgba(0,0,0,0.7)';
      gctx.beginPath();
      gctx.arc(timeX + 3, timeY, timeRadius, 0, Math.PI * 2);
      gctx.fill();
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
  
  // Start game
  requestAnimationFrame(gameLoop);
})();