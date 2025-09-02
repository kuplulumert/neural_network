const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Game Boy colors
const colors = {
    darkest: '#0f380f',
    dark: '#306230',
    light: '#8bac0f',
    lightest: '#9bbc0f'
};

// Game state
let player = {
    x: 320,
    y: 240,
    width: 32,
    height: 32,
    speed: 2,
    direction: 'down',
    moving: false,
    frame: 0,
    animTimer: 0
};

let camera = {
    x: 0,
    y: 0
};

let world = {
    width: 1600,
    height: 1200,
    tileSize: 32
};

let tiles = [];
let grassPatches = [];
let trees = [];
let buildings = [];
let water = [];
let paths = [];
let npcs = [];

let keys = {};
let steps = 0;
let inGrass = false;
let lastGrassCheck = 0;

// Initialize world
function initWorld() {
    // Create grass patches (tall grass for Pokemon)
    for (let i = 0; i < 15; i++) {
        grassPatches.push({
            x: Math.random() * (world.width - 200) + 100,
            y: Math.random() * (world.height - 200) + 100,
            width: 100 + Math.random() * 100,
            height: 100 + Math.random() * 100
        });
    }
    
    // Create trees
    for (let i = 0; i < 50; i++) {
        trees.push({
            x: Math.random() * world.width,
            y: Math.random() * world.height,
            width: 32,
            height: 48
        });
    }
    
    // Create paths
    // Horizontal main path
    paths.push({
        x: 0,
        y: world.height / 2 - 32,
        width: world.width,
        height: 64
    });
    
    // Vertical main path
    paths.push({
        x: world.width / 2 - 32,
        y: 0,
        width: 64,
        height: world.height
    });
    
    // Create buildings
    buildings.push({
        x: world.width / 2 - 64,
        y: world.height / 2 - 64,
        width: 128,
        height: 128,
        type: 'pokecenter'
    });
    
    buildings.push({
        x: 200,
        y: 200,
        width: 96,
        height: 96,
        type: 'house'
    });
    
    buildings.push({
        x: world.width - 300,
        y: 200,
        width: 96,
        height: 96,
        type: 'mart'
    });
    
    // Create water areas
    water.push({
        x: 100,
        y: world.height - 300,
        width: 300,
        height: 200
    });
    
    // Create NPCs
    npcs.push({
        x: 400,
        y: 400,
        width: 32,
        height: 32,
        dialogue: "Hello trainer! The grass is full of Pokemon!"
    });
}

// Sprite drawing functions
function drawPlayer() {
    ctx.save();
    
    // Player sprite (simple representation)
    const x = canvas.width / 2 - player.width / 2;
    const y = canvas.height / 2 - player.height / 2;
    
    // Body
    ctx.fillStyle = colors.darkest;
    ctx.fillRect(x + 8, y + 8, 16, 20);
    
    // Head
    ctx.fillStyle = colors.dark;
    ctx.fillRect(x + 10, y + 4, 12, 12);
    
    // Hat
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(x + 8, y + 2, 16, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 8, y + 8, 16, 2);
    
    // Feet animation
    if (player.moving) {
        const offset = Math.sin(player.animTimer * 0.2) * 2;
        ctx.fillStyle = colors.darkest;
        ctx.fillRect(x + 10 + offset, y + 28, 4, 4);
        ctx.fillRect(x + 18 - offset, y + 28, 4, 4);
    } else {
        ctx.fillStyle = colors.darkest;
        ctx.fillRect(x + 10, y + 28, 4, 4);
        ctx.fillRect(x + 18, y + 28, 4, 4);
    }
    
    // Direction indicator
    ctx.fillStyle = colors.darkest;
    switch(player.direction) {
        case 'up':
            ctx.fillRect(x + 14, y, 4, 4);
            break;
        case 'down':
            ctx.fillRect(x + 14, y + 30, 4, 4);
            break;
        case 'left':
            ctx.fillRect(x + 4, y + 16, 4, 4);
            break;
        case 'right':
            ctx.fillRect(x + 24, y + 16, 4, 4);
            break;
    }
    
    ctx.restore();
}

function drawTile(x, y, type) {
    switch(type) {
        case 'grass':
            // Draw grass tile
            ctx.fillStyle = colors.light;
            ctx.fillRect(x, y, world.tileSize, world.tileSize);
            
            // Grass details
            ctx.fillStyle = colors.dark;
            for (let i = 0; i < 4; i++) {
                const gx = x + Math.random() * world.tileSize;
                const gy = y + Math.random() * world.tileSize;
                ctx.fillRect(gx, gy, 2, 4);
            }
            break;
            
        case 'tallgrass':
            // Draw tall grass (Pokemon encounter area)
            ctx.fillStyle = colors.dark;
            ctx.fillRect(x, y, world.tileSize, world.tileSize);
            
            // Tall grass blades
            ctx.fillStyle = colors.darkest;
            for (let i = 0; i < 8; i++) {
                const gx = x + (i * 4) + 2;
                ctx.fillRect(gx, y + 8, 2, 24);
                ctx.fillRect(gx - 1, y + 6, 4, 2);
            }
            break;
            
        case 'path':
            // Draw path tile
            ctx.fillStyle = '#d4a76a';
            ctx.fillRect(x, y, world.tileSize, world.tileSize);
            
            // Path texture
            ctx.fillStyle = '#c4976a';
            ctx.fillRect(x + 4, y + 4, 8, 8);
            ctx.fillRect(x + 20, y + 20, 8, 8);
            break;
            
        case 'water':
            // Draw water tile
            ctx.fillStyle = '#4444ff';
            ctx.fillRect(x, y, world.tileSize, world.tileSize);
            
            // Water animation
            const waveOffset = (Date.now() / 500) % 8;
            ctx.fillStyle = '#6666ff';
            ctx.fillRect(x + waveOffset, y + 8, 4, 2);
            ctx.fillRect(x + waveOffset + 8, y + 16, 4, 2);
            ctx.fillRect(x + waveOffset + 16, y + 24, 4, 2);
            break;
    }
}

function drawTree(x, y) {
    // Tree trunk
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + 12, y + 32, 8, 16);
    
    // Tree leaves
    ctx.fillStyle = colors.dark;
    ctx.fillRect(x + 4, y + 8, 24, 24);
    ctx.fillRect(x + 8, y + 4, 16, 4);
    ctx.fillRect(x + 8, y + 32, 16, 4);
    
    // Highlights
    ctx.fillStyle = colors.light;
    ctx.fillRect(x + 8, y + 12, 8, 8);
}

function drawBuilding(building) {
    const x = building.x - camera.x;
    const y = building.y - camera.y;
    
    // Building base
    ctx.fillStyle = '#888888';
    ctx.fillRect(x, y, building.width, building.height);
    
    // Roof
    ctx.fillStyle = building.type === 'pokecenter' ? '#ff0000' : '#4444ff';
    ctx.fillRect(x - 8, y - 16, building.width + 16, 24);
    
    // Windows
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(x + 16, y + 16, 16, 16);
    ctx.fillRect(x + building.width - 32, y + 16, 16, 16);
    
    // Door
    ctx.fillStyle = '#654321';
    ctx.fillRect(x + building.width/2 - 12, y + building.height - 32, 24, 32);
    
    // Sign
    if (building.type === 'pokecenter') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + building.width/2 - 8, y - 8, 16, 16);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x + building.width/2 - 6, y - 2, 12, 4);
        ctx.fillRect(x + building.width/2 - 2, y - 6, 4, 12);
    }
}

function drawNPC(npc) {
    const x = npc.x - camera.x;
    const y = npc.y - camera.y;
    
    // NPC sprite
    ctx.fillStyle = colors.darkest;
    ctx.fillRect(x + 8, y + 8, 16, 20);
    
    // Head
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(x + 10, y + 4, 12, 12);
    
    // Hair
    ctx.fillStyle = '#654321';
    ctx.fillRect(x + 8, y + 2, 16, 6);
    
    // Feet
    ctx.fillStyle = colors.darkest;
    ctx.fillRect(x + 10, y + 28, 4, 4);
    ctx.fillRect(x + 18, y + 28, 4, 4);
}

function updateCamera() {
    // Camera follows player
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    
    // Clamp camera to world bounds
    camera.x = Math.max(0, Math.min(camera.x, world.width - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, world.height - canvas.height));
}

function checkCollisions() {
    // Check building collisions
    for (let building of buildings) {
        if (player.x < building.x + building.width &&
            player.x + player.width > building.x &&
            player.y < building.y + building.height &&
            player.y + player.height > building.y) {
            return true;
        }
    }
    
    // Check tree collisions
    for (let tree of trees) {
        if (player.x < tree.x + tree.width &&
            player.x + player.width > tree.x &&
            player.y < tree.y + tree.height &&
            player.y + player.height > tree.y) {
            return true;
        }
    }
    
    // Check water collisions
    for (let w of water) {
        if (player.x < w.x + w.width &&
            player.x + player.width > w.x &&
            player.y < w.y + w.height &&
            player.y + player.height > w.y) {
            return true;
        }
    }
    
    // Check world boundaries
    if (player.x < 0 || player.x > world.width - player.width ||
        player.y < 0 || player.y > world.height - player.height) {
        return true;
    }
    
    return false;
}

function checkGrass() {
    inGrass = false;
    for (let grass of grassPatches) {
        if (player.x < grass.x + grass.width &&
            player.x + player.width > grass.x &&
            player.y < grass.y + grass.height &&
            player.y + player.height > grass.y) {
            inGrass = true;
            
            // Random encounter chance
            if (Date.now() - lastGrassCheck > 1000) {
                lastGrassCheck = Date.now();
                if (Math.random() < 0.05) { // 5% chance per second
                    encounterPokemon();
                }
            }
            break;
        }
    }
}

function encounterPokemon() {
    // Trigger Pokemon encounter
    alert('A wild Pokemon appeared!');
    // Here you would transition to battle screen
}

function update() {
    // Handle movement
    let dx = 0, dy = 0;
    let newX = player.x;
    let newY = player.y;
    
    if (player.moving) {
        switch(player.direction) {
            case 'up':
                newY -= player.speed;
                break;
            case 'down':
                newY += player.speed;
                break;
            case 'left':
                newX -= player.speed;
                break;
            case 'right':
                newX += player.speed;
                break;
        }
        
        // Check collision at new position
        let oldX = player.x;
        let oldY = player.y;
        player.x = newX;
        player.y = newY;
        
        if (!checkCollisions()) {
            // Movement successful
            if (oldX !== player.x || oldY !== player.y) {
                steps++;
                document.getElementById('steps').textContent = 'Steps: ' + steps;
            }
            player.animTimer++;
        } else {
            // Collision, revert position
            player.x = oldX;
            player.y = oldY;
        }
    }
    
    // Check if in grass
    checkGrass();
    
    // Update camera
    updateCamera();
}

function render() {
    // Clear canvas
    ctx.fillStyle = colors.lightest;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate visible tile range
    const startX = Math.floor(camera.x / world.tileSize) * world.tileSize;
    const startY = Math.floor(camera.y / world.tileSize) * world.tileSize;
    const endX = startX + canvas.width + world.tileSize;
    const endY = startY + canvas.height + world.tileSize;
    
    // Draw base grass tiles
    for (let x = startX; x < endX; x += world.tileSize) {
        for (let y = startY; y < endY; y += world.tileSize) {
            drawTile(x - camera.x, y - camera.y, 'grass');
        }
    }
    
    // Draw paths
    ctx.fillStyle = '#d4a76a';
    for (let path of paths) {
        ctx.fillRect(path.x - camera.x, path.y - camera.y, path.width, path.height);
    }
    
    // Draw water
    for (let w of water) {
        for (let x = w.x; x < w.x + w.width; x += world.tileSize) {
            for (let y = w.y; y < w.y + w.height; y += world.tileSize) {
                drawTile(x - camera.x, y - camera.y, 'water');
            }
        }
    }
    
    // Draw tall grass patches
    for (let grass of grassPatches) {
        for (let x = grass.x; x < grass.x + grass.width; x += world.tileSize) {
            for (let y = grass.y; y < grass.y + grass.height; y += world.tileSize) {
                drawTile(x - camera.x, y - camera.y, 'tallgrass');
            }
        }
    }
    
    // Draw trees
    for (let tree of trees) {
        if (tree.x - camera.x > -50 && tree.x - camera.x < canvas.width + 50 &&
            tree.y - camera.y > -50 && tree.y - camera.y < canvas.height + 50) {
            drawTree(tree.x - camera.x, tree.y - camera.y);
        }
    }
    
    // Draw buildings
    for (let building of buildings) {
        if (building.x - camera.x > -200 && building.x - camera.x < canvas.width + 200 &&
            building.y - camera.y > -200 && building.y - camera.y < canvas.height + 200) {
            drawBuilding(building);
        }
    }
    
    // Draw NPCs
    for (let npc of npcs) {
        if (npc.x - camera.x > -50 && npc.x - camera.x < canvas.width + 50 &&
            npc.y - camera.y > -50 && npc.y - camera.y < canvas.height + 50) {
            drawNPC(npc);
        }
    }
    
    // Draw player (always in center)
    drawPlayer();
    
    // Draw grass overlay if in grass
    if (inGrass) {
        ctx.fillStyle = 'rgba(48, 98, 48, 0.3)';
        ctx.fillRect(canvas.width/2 - 16, canvas.height/2 - 16, 32, 32);
    }
    
    // Draw UI overlay
    ctx.fillStyle = 'rgba(15, 56, 15, 0.8)';
    ctx.fillRect(10, 10, 150, 30);
    ctx.fillStyle = colors.lightest;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(inGrass ? 'Tall Grass' : 'Route 1', 20, 30);
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Control functions
function startMove(direction) {
    player.direction = direction;
    player.moving = true;
}

function stopMove() {
    player.moving = false;
    player.animTimer = 0;
}

function actionButton() {
    // Check for NPC interaction
    for (let npc of npcs) {
        const dist = Math.sqrt(Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2));
        if (dist < 50) {
            alert(npc.dialogue);
            break;
        }
    }
    
    // Check for building interaction
    for (let building of buildings) {
        const centerX = building.x + building.width / 2;
        const centerY = building.y + building.height / 2;
        const dist = Math.sqrt(Math.pow(player.x - centerX, 2) + Math.pow(player.y - centerY, 2));
        if (dist < 100) {
            if (building.type === 'pokecenter') {
                alert('Welcome to the Pokemon Center! Your Pokemon have been healed!');
            } else if (building.type === 'mart') {
                alert('Welcome to the Poke Mart!');
            } else {
                alert('This is someone\'s house.');
            }
            break;
        }
    }
}

function cancelButton() {
    console.log('B button pressed');
}

function startButton() {
    alert('Menu: Pokemon | Bag | Save | Options');
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
            startMove('up');
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
            startMove('down');
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
            startMove('left');
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
            startMove('right');
            e.preventDefault();
            break;
        case ' ':
        case 'Enter':
            actionButton();
            e.preventDefault();
            break;
        case 'Escape':
            startButton();
            e.preventDefault();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'w':
        case 'a':
        case 's':
        case 'd':
            stopMove();
            e.preventDefault();
            break;
    }
});

// Initialize and start game
initWorld();
gameLoop();