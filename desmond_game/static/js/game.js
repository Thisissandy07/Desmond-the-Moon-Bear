// ─── Constants ───────────────────────────────────────────────────────────────
const SCREEN_WIDTH  = 1300;
const SCREEN_HEIGHT = 800;
const GROUND_Y      = 650;   // top of ground (feet of player)
const PLAYER_X      = 80;
const JUMP_VEL      = 14;

// ─── Asset loader ────────────────────────────────────────────────────────────
function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const ASSETS = {
    background: loadImage('/static/images/BACKGROUND.png'),
    walk: Array.from({length: 6}, (_, i) => loadImage(`/static/images/walk img/walk${i+1}.png`)),
    jump: Array.from({length: 8}, (_, i) => loadImage(`/static/images/jump img/jump${i+1}.png`)),
    ships: Array.from({length: 3}, (_, i) => loadImage(`/static/images/SHIPS/ship${i+1}.png`)),
    clouds: Array.from({length: 2}, (_, i) => loadImage(`/static/images/CLOUDS/clouds${i+1}.png`)),
    rockSmall: [
        loadImage('/static/images/rock2.png'),
        loadImage('/static/images/smallRock3.png'),
        loadImage('/static/images/small Rock4.png'),
    ],
    rockLarge: [
        loadImage('/static/images/rock1.png'),
        loadImage('/static/images/LargeRock5.png'),
    ],
};

// ─── Input ───────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup',   e => { keys[e.code] = false; });

// Mobile jump button
document.addEventListener('DOMContentLoaded', () => {
    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', () => { keys['Space'] = true; });
        jumpBtn.addEventListener('touchend',   () => { keys['Space'] = false; });
        jumpBtn.addEventListener('mousedown',  () => { keys['Space'] = true; });
        jumpBtn.addEventListener('mouseup',    () => { keys['Space'] = false; });
    }
});

// ─── Player ──────────────────────────────────────────────────────────────────
class Desmond {
    constructor() {
        this.x        = PLAYER_X;
        this.y        = GROUND_Y;
        this.vy       = 0;
        this.jumping  = false;
        this.stepIdx  = 0;
        this.jumpIdx  = 0;
        this.w        = 80;
        this.h        = 80;
    }

    update() {
        if (keys['Space'] && !this.jumping) {
            this.jumping = true;
            this.vy = -JUMP_VEL;
        }

        if (this.jumping) {
            this.y  += this.vy * 3;
            this.vy += 0.8;
            this.jumpIdx++;
            if (this.jumpIdx >= ASSETS.jump.length * 5) this.jumpIdx = 0;
            if (this.y >= GROUND_Y) {
                this.y       = GROUND_Y;
                this.jumping = false;
                this.vy      = 0;
                this.jumpIdx = 0;
            }
        } else {
            this.stepIdx = (this.stepIdx + 1) % (ASSETS.walk.length * 5);
        }
    }

    draw(ctx) {
        let img;
        if (this.jumping) {
            img = ASSETS.jump[Math.floor(this.jumpIdx / 5) % ASSETS.jump.length];
        } else {
            img = ASSETS.walk[Math.floor(this.stepIdx / 5) % ASSETS.walk.length];
        }
        if (img && img.complete) {
            ctx.drawImage(img, this.x, this.y - this.h, this.w, this.h);
        } else {
            // Fallback rectangle
            ctx.fillStyle = '#a8d8ea';
            ctx.fillRect(this.x, this.y - this.h, this.w, this.h);
        }
    }

    getRect() {
        return { x: this.x + 8, y: this.y - this.h + 8, w: this.w - 16, h: this.h - 8 };
    }
}

// ─── Clouds ──────────────────────────────────────────────────────────────────
class Cloud {
    constructor() { this.reset(true); }

    reset(init = false) {
        this.x   = init ? Math.random() * SCREEN_WIDTH : SCREEN_WIDTH + Math.random() * 1000 + 800;
        this.y   = 50 + Math.random() * 150;
        this.img = ASSETS.clouds[Math.floor(Math.random() * 2)];
    }

    update(speed) {
        this.x -= speed * 1.2;
        if (this.x < -300) this.reset();
    }

    draw(ctx) {
        if (this.img && this.img.complete) ctx.drawImage(this.img, this.x, this.y);
    }
}

// ─── Obstacles ───────────────────────────────────────────────────────────────
class Obstacle {
    constructor(type) {
        this.type = type;   // 'smallRock' | 'largeRock' | 'ship'
        switch (type) {
            case 'smallRock': {
                const idx = Math.floor(Math.random() * ASSETS.rockSmall.length);
                this.img = ASSETS.rockSmall[idx];
                this.w = 50; this.h = 50;
                this.y = GROUND_Y - this.h;
                break;
            }
            case 'largeRock': {
                const idx = Math.floor(Math.random() * ASSETS.rockLarge.length);
                this.img = ASSETS.rockLarge[idx];
                this.w = 90; this.h = 80;
                this.y = GROUND_Y - this.h;
                break;
            }
            case 'ship': {
                const idx = Math.floor(Math.random() * ASSETS.ships.length);
                this.img = ASSETS.ships[idx];
                this.w = 80; this.h = 60;
                this.y = 350;
                break;
            }
        }
        this.x = SCREEN_WIDTH + 50;
    }

    update(speed) { this.x -= speed; }

    draw(ctx) {
        if (this.img && this.img.complete) {
            ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
        } else {
            ctx.fillStyle = this.type === 'ship' ? '#ff6b6b' : '#888';
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
    }

    getRect() {
        return { x: this.x + 6, y: this.y + 6, w: this.w - 12, h: this.h - 12 };
    }

    offScreen() { return this.x < -this.w; }
}

// ─── Collision helper ─────────────────────────────────────────────────────────
function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}

// ─── Leaderboard API ─────────────────────────────────────────────────────────
async function fetchLeaderboard() {
    try {
        const res  = await fetch('/api/scores');
        const data = await res.json();
        const tbody = document.getElementById('lb-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        data.forEach((entry, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${i + 1}</td><td>${entry.name}</td><td>${Math.floor(entry.score)}</td><td>${entry.date}</td>`;
            tbody.appendChild(tr);
        });
    } catch(e) { console.warn('Leaderboard fetch failed', e); }
}

async function submitScore(name, score) {
    try {
        await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score: Math.floor(score) }),
        });
        await fetchLeaderboard();
    } catch(e) { console.warn('Score submit failed', e); }
}

// ─── Game State Machine ───────────────────────────────────────────────────────
// states: 'menu' | 'playing' | 'dead'
let state       = 'menu';
let player      = null;
let clouds      = [];
let obstacles   = [];
let gameSpeed   = 15;
let points      = 0;
let deathCount  = 0;
let obstacleTmr = 0;
let playerName  = 'Player';

// ─── Main Loop ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
canvas.width  = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

function spawnObstacle() {
    const r = Math.random();
    if (r < 0.4)      obstacles.push(new Obstacle('smallRock'));
    else if (r < 0.7) obstacles.push(new Obstacle('largeRock'));
    else               obstacles.push(new Obstacle('ship'));
}

function startGame() {
    player      = new Desmond();
    clouds      = [new Cloud(), new Cloud(), new Cloud()];
    obstacles   = [];
    gameSpeed   = 15;
    points      = 0;
    obstacleTmr = 0;
    spawnObstacle();
    state = 'playing';
    document.getElementById('death-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display  = 'none';
}

function drawBackground() {
    if (ASSETS.background.complete) {
        ctx.drawImage(ASSETS.background, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }
}

function drawScore() {
    ctx.fillStyle    = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.roundRect(SCREEN_WIDTH - 220, 20, 190, 50, 10);
    ctx.fill();
    ctx.fillStyle    = '#fff';
    ctx.font         = 'bold 22px "Courier New", monospace';
    ctx.textAlign    = 'right';
    ctx.fillText(`Score: ${Math.floor(points)}`, SCREEN_WIDTH - 35, 53);
    ctx.textAlign    = 'left';
}

let lastTime = 0;
function gameLoop(ts) {
    const dt = Math.min((ts - lastTime) / 16.67, 3); // normalise to ~60fps
    lastTime = ts;

    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    drawBackground();

    if (state === 'playing') {
        // Clouds
        clouds.forEach(c => { c.update(gameSpeed); c.draw(ctx); });

        // Player
        player.update();
        player.draw(ctx);

        // Obstacles
        obstacleTmr++;
        const spawnInterval = Math.max(60, 120 - Math.floor(points / 50));
        if (obstacleTmr >= spawnInterval) {
            spawnObstacle();
            obstacleTmr = 0;
        }
        obstacles = obstacles.filter(o => !o.offScreen());
        for (const obs of obstacles) {
            obs.update(gameSpeed);
            obs.draw(ctx);
            if (rectsOverlap(player.getRect(), obs.getRect())) {
                state = 'dead';
                deathCount++;
                showDeathScreen();
                break;
            }
        }

        // Score
        points += 0.5;
        if (points > 0 && Math.floor(points) % 200 === 0 && Math.floor(points * 2) % 2 === 0) {
            gameSpeed = Math.min(gameSpeed * 1.05, 40);
        }
        drawScore();
    }

    requestAnimationFrame(gameLoop);
}

function showDeathScreen() {
    const ds = document.getElementById('death-screen');
    document.getElementById('final-score').textContent = Math.floor(points);
    ds.style.display = 'flex';
    fetchLeaderboard();
}

// ─── UI Wiring ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard();

    // Menu start
    document.getElementById('start-btn').addEventListener('click', () => {
        playerName = document.getElementById('player-name').value.trim() || 'Player';
        startGame();
    });

    // Death screen submit + restart
    document.getElementById('submit-btn').addEventListener('click', async () => {
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.textContent = 'Saved!';
        await submitScore(playerName, points);
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
        startGame();
    });

    // Keyboard shortcut: Enter on menu
    document.getElementById('player-name').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('start-btn').click();
    });

    requestAnimationFrame(gameLoop);
});
