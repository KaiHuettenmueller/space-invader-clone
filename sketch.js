// Player class: represents the player's spaceship

// Supabase configuration - Ersetze diese mit deinen eigenen Werten
const SUPABASE_URL = 'https://dwmchnkwymyyssldbcky.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bWNobmt3eW15eXNzbGRiY2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NDk5MzYsImV4cCI6MjA1NzUyNTkzNn0.llOZSlp--MV5PhbkFGG2eVuO2eFUh5taKqibRpHzhVc';
let supabase;

class Player {
    constructor(x, y) {
      // Position (start at given coordinates)
      this.x = x;
      this.y = y;
      this.speed = 5;             // movement speed in pixels per frame
      this.width = 0;             // will set based on sprite
      this.height = 0;
      this.lives = 3;             // number of lives
      this.shieldActive = false;  // shield power-up flag
      this.rapidFireActive = false; 
      this.rapidTimer = 0;        // timer for rapid-fire power-up effect
      // Define pixel-art sprite pattern for the ship (1s will be drawn as colored blocks)
      this.sprite = [
        [0,0,1,0,0],
        [0,1,1,1,0],
        [1,1,1,1,1],
        [1,0,1,0,1],
        [0,1,0,1,0]
      ];
      this.color = [0, 200, 255]; // cyan-ish color for the player ship
      this.pixelSize = 4;         // size of one "pixel" block for the sprite
      // Calculate sprite dimensions in pixels for collision detection
      this.width = this.sprite[0].length * this.pixelSize;
      this.height = this.sprite.length * this.pixelSize;
      // Shooting cooldown settings
      this.baseCooldown = 10;     // frames between shots (base rate)
      this.cooldown = this.baseCooldown; // current cooldown (shorter if rapidFireActive)
      this.lastShotFrame = 0;     // the frameCount when the last shot was fired
    }
  
    move(dx, dy) {
      // Move player by dx, dy, ensuring it stays on screen
      this.x += dx * this.speed;
      this.y += dy * this.speed;
      // Constrain within canvas bounds (assuming global width and height)
      if (this.x < this.width/2) this.x = this.width/2;
      if (this.x > width - this.width/2) this.x = width - this.width/2;
      if (this.y < this.height/2) this.y = this.height/2;
      if (this.y > height - this.height/2) this.y = height - this.height/2;
    }
  
    // Handle shooting: returns a new Bullet if able to shoot, otherwise null
    shoot() {
      // Check cooldown (using frameCount for timing)
      if (frameCount - this.lastShotFrame >= this.cooldown) {
        this.lastShotFrame = frameCount;
        // If rapid-fire power-up is active, we use a shorter cooldown
        // (We've already adjusted this.cooldown accordingly when power-up activated)
        // Create a new bullet starting from the tip of the ship
        const bx = this.x;
        const by = this.y - this.height/2 - 2; // a bit above the ship
        // Bullet goes straight up (vx=0, vy=-bulletSpeed), friendly=false since it's player's bullet
        let bullet = new Bullet(bx, by, 0, -BULLET_SPEED, false);
        return bullet;
      }
      return null;
    }
  
    applyPowerUp(type) {
      // Apply effects based on power-up type
      if (type === "shield") {
        this.shieldActive = true;
        // e.g., could also visually indicate shield (not implemented here for simplicity)
      } else if (type === "rapid") {
        this.rapidFireActive = true;
        this.rapidTimer = 300;            // effect lasts ~300 frames (5 seconds at 60 FPS)
        this.cooldown = Math.floor(this.baseCooldown / 2);  // double firing rate
      }
      // (Additional power-up types can be handled here)
    }
  
    update() {
      // Update player state (e.g., power-up timers)
      if (this.rapidFireActive) {
        this.rapidTimer--;
        if (this.rapidTimer <= 0) {
          // Rapid fire effect ended, restore normal firing rate
          this.rapidFireActive = false;
          this.cooldown = this.baseCooldown;
        }
      }
      // (No movement update here; movement is handled externally based on key input each frame)
    }
  
    draw() {
      // Draw the ship in its color, using the sprite pattern
      noStroke();
      fill(this.color[0], this.color[1], this.color[2]);
      // To draw centered at (this.x, this.y), offset by half width/height
      const px = Math.floor(this.x - this.width/2);
      const py = Math.floor(this.y - this.height/2);
      for (let r = 0; r < this.sprite.length; r++) {
        for (let c = 0; c < this.sprite[r].length; c++) {
          if (this.sprite[r][c] === 1) {
            rect(px + c * this.pixelSize, py + r * this.pixelSize, this.pixelSize, this.pixelSize);
          }
        }
      }
      // (Optionally, draw shield indicator if shieldActive is true, e.g., a circle or outline around the ship)
    }
  }
  // Bullet class: represents a projectile fired by player or enemy
  class Bullet {
    constructor(x, y, vx, vy, isEnemy) {
      this.x = x;
      this.y = y;
      this.vx = vx;       // horizontal velocity
      this.vy = vy;       // vertical velocity
      this.isEnemy = isEnemy; 
      // Define a simple pixel-art sprite for the bullet (2 pixels tall)
      this.sprite = [
        [1],
        [1]
      ];
      this.pixelSize = 4;
      this.width = this.pixelSize;
      this.height = this.sprite.length * this.pixelSize;
      // Color: yellow for player bullets, white for enemy bullets
      this.color = isEnemy ? [255, 255, 255] : [255, 255, 0];
    }
  
    update() {
      // Move the bullet according to its velocity
      this.x += this.vx;
      this.y += this.vy;
    }
  
    offScreen() {
      // Check if bullet is outside the canvas bounds
      return (this.y < 0 || this.y > height || this.x < 0 || this.x > width);
    }
  
    draw() {
      noStroke();
      fill(this.color[0], this.color[1], this.color[2]);
      // Draw the bullet sprite (centered at its position)
      const px = Math.floor(this.x - this.width/2);
      const py = Math.floor(this.y - this.height/2);
      for (let r = 0; r < this.sprite.length; r++) {
        for (let c = 0; c < this.sprite[r].length; c++) {
          if (this.sprite[r][c] === 1) {
            rect(px + c * this.pixelSize, py + r * this.pixelSize, this.pixelSize, this.pixelSize);
          }
        }
      }
    }
  }
  // Enemy class: represents an enemy or boss
  class Enemy {
    constructor(type, x, y) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.health = 1;       // default health (boss will override)
      this.canShoot = false; // whether this enemy fires bullets
      // Pixel-art sprite pattern and color based on type
      this.pixelSize = 4;
      if (type === 1) {
        // Type 1: simple block enemy
        this.sprite = [
          [1,0,1],
          [0,1,0],
          [1,1,1]
        ];
        this.color = [255, 100, 100];    // reddish
        this.vy = 2;    // straight down descent speed
      } else if (type === 2) {
        // Type 2: enemy with a different shape (moves in wave pattern)
        this.sprite = [
          [0,1,0],
          [1,1,1],
          [0,1,0],
          [1,0,1]
        ];
        this.color = [100, 255, 100];   // greenish
        this.vy = 3;    // falls faster
        this.vx = 1.5;  // horizontal speed for wave
        this.wavePhase = random(TWO_PI); // random phase for sine movement
      } else if (type === 3) {
        // Type 3: an enemy that can shoot (a bit larger)
        this.sprite = [
          [1,1,1],
          [1,0,1],
          [1,1,1]
        ];
        this.color = [255, 150, 0];    // orange
        this.vy = 2;
        this.canShoot = true;
        this.shootChance = 0.01;      // base probability of shooting each frame
      } else if (type === "boss") {
        // Boss: big enemy with more health and shooting pattern
        this.sprite = [
          [0,1,1,1,0],
          [1,1,0,1,1],
          [1,0,1,0,1],
          [1,1,0,1,1],
          [0,1,1,1,0]
        ];
        this.color = [255, 0, 255];   // magenta
        this.health = 10;            // boss needs 10 hits to destroy
        this.vy = 1;                 // initial downward speed
        this.canShoot = true;
        this.shootChance = 0;        // (not used for boss, will use a timer instead)
        this.dir = 1;                // horizontal direction for oscillation
      }
      // Calculate width and height from sprite
      this.width = this.sprite[0].length * this.pixelSize;
      this.height = this.sprite.length * this.pixelSize;
    }
  
    update() {
      // Movement behavior based on type
      if (this.type === 1) {
        // Moves straight down
        this.y += this.vy;
      } else if (this.type === 2) {
        // Moves down in a sine wave pattern
        this.y += this.vy;
        // Sine wave horizontal movement
        this.x += this.vx * sin(this.wavePhase + (frameCount * 0.05));
        // (wavePhase gives each enemy a unique horizontal offset pattern)
      } else if (this.type === 3) {
        // Moves straight down
        this.y += this.vy;
        // (Could add slight horizontal drift if desired)
      } else if (this.type === "boss") {
        // Boss moves down until it reaches a certain vertical position, then oscillates horizontally
        if (this.y < 100) {
          // move down to fixed position
          this.y += this.vy;
        } else {
          // move horizontally back and forth
          this.x += 2 * this.dir;
          if (this.x < this.width/2 || this.x > width - this.width/2) {
            // bounce off edges
            this.dir *= -1;
          }
        }
      }
      // (Note: Shooting behavior for enemies is handled in the game loop for better control)
    }
  
    draw() {
      noStroke();
      fill(this.color[0], this.color[1], this.color[2]);
      const px = Math.floor(this.x - this.width/2);
      const py = Math.floor(this.y - this.height/2);
      for (let r = 0; r < this.sprite.length; r++) {
        for (let c = 0; c < this.sprite[r].length; c++) {
          if (this.sprite[r][c] === 1) {
            rect(px + c * this.pixelSize, py + r * this.pixelSize, this.pixelSize, this.pixelSize);
          }
        }
      }
    }
  }
  // PowerUp class: represents a falling power-up that the player can collect
  class PowerUp {
    constructor(type, x, y) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.vy = 1.5;  // falling speed
      this.pixelSize = 4;
      // Define sprite and color based on power-up type
      if (type === "shield") {
        // Shield power-up: a hollow square (3x3 with center empty)
        this.sprite = [
          [1,1,1],
          [1,0,1],
          [1,1,1]
        ];
        this.color = [0, 255, 255];  // cyan
      } else if (type === "rapid") {
        // Rapid-fire power-up: a plus sign shape
        this.sprite = [
          [0,1,0],
          [1,1,1],
          [0,1,0]
        ];
        this.color = [255, 255, 0];  // yellow
      } else {
        // Default appearance for any other power-up types
        this.sprite = [
          [1,1,1],
          [1,1,1],
          [1,1,1]
        ];
        this.color = [255, 255, 255]; // white
      }
      this.width = this.sprite[0].length * this.pixelSize;
      this.height = this.sprite.length * this.pixelSize;
    }
  
    update() {
      // Fall down
      this.y += this.vy;
    }
  
    draw() {
      noStroke();
      fill(this.color[0], this.color[1], this.color[2]);
      const px = Math.floor(this.x - this.width/2);
      const py = Math.floor(this.y - this.height/2);
      for (let r = 0; r < this.sprite.length; r++) {
        for (let c = 0; c < this.sprite[r].length; c++) {
          if (this.sprite[r][c] === 1) {
            rect(px + c * this.pixelSize, py + r * this.pixelSize, this.pixelSize, this.pixelSize);
          }
        }
      }
    }
  
    offScreen() {
      return (this.y > height);
    }
  }
  // Global game variables and configurations
  let player;
  let enemies = [];
  let bullets = [];
  let powerUps = [];
  let score = 0;
  let level = 1;
  let gameState = "PLAY";  // "PLAY" or "GAMEOVER"
  const BULLET_SPEED = 5;
  let highScores = [];
  
  // Globale Variable für die Online-Highscores
  let globalHighScores = [];
  let onlineLeaderboardStatus = "Lade Online-Bestenliste...";
  
  // Setup function (runs once at start)
  function setup() {
    createCanvas(400, 600);
    noSmooth();                // disable antialiasing to maintain pixelated graphics
    textFont('monospace');
    textSize(16);
    
    // Initialize Supabase client
    initSupabase();
    
    // Initialize game entities
    resetGame();               // custom function to initialize/restart the game
  }
  
  // Funktion zum Abrufen der globalen Highscores aus Supabase
  function fetchGlobalHighScores() {
    if (supabase) {
      onlineLeaderboardStatus = "Lade Online-Bestenliste...";
      supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(10)
        .then(response => {
          if (response.data && response.data.length > 0) {
            globalHighScores = response.data;
            onlineLeaderboardStatus = "";
            console.log('Global high scores fetched:', globalHighScores);
          } else {
            onlineLeaderboardStatus = "Keine Online-Scores gefunden";
            console.log('No global high scores found');
          }
        })
        .catch(error => {
          onlineLeaderboardStatus = "Fehler beim Laden der Online-Bestenliste: " + error.message;
          console.error('Error fetching global high scores:', error);
        });
    } else {
      onlineLeaderboardStatus = "Keine Verbindung zur Datenbank";
    }
  }
  
  // Separate function to initialize Supabase
  function initSupabase() {
    try {
      if (typeof window.createClient === 'function') {
        console.log('Creating Supabase client...');
        
        // Erweiterte Optionen für den Supabase-Client
        const options = {
          auth: {
            autoRefreshToken: true,
            persistSession: true
          },
          global: {
            headers: {
              'X-Client-Info': 'space-invader-game'
            }
          }
        };
        
        supabase = window.createClient(SUPABASE_URL, SUPABASE_KEY, options);
        console.log('Supabase client initialized');
        
        // Test the connection
        supabase
          .from('leaderboard')
          .select('count', { count: 'exact', head: true })
          .then(response => {
            console.log('Supabase connection test successful');
            // Lade die globalen Highscores beim Start
            fetchGlobalHighScores();
          })
          .catch(error => {
            console.error('Supabase connection test failed:', error);
            onlineLeaderboardStatus = "Verbindungsfehler: " + error.message;
          });
      } else {
        console.error('createClient function not available');
        onlineLeaderboardStatus = "Supabase nicht verfügbar";
        
        // Retry after a short delay (the library might still be loading)
        setTimeout(initSupabase, 1000);
      }
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      onlineLeaderboardStatus = "Fehler bei der Verbindung: " + error.message;
    }
  }
  
  // Initialize or reset the game to starting state
  function resetGame() {
    // Frage nach dem Spielernamen, wenn noch keiner gespeichert ist
    const savedName = window.localStorage.getItem('playerName');
    if (!savedName) {
      askPlayerName();
    }
    
    player = new Player(width/2, height - 50);
    enemies = [];
    bullets = [];
    powerUps = [];
    score = 0;
    level = 1;
    gameState = "PLAY";
    // Load high score list from local storage or initialize a blank list
    let stored = window.localStorage.getItem('highScores');
    if (stored) {
      highScores = JSON.parse(stored);
    } else {
      highScores = [0, 0, 0, 0, 0];  // top 5 scores
    }
    
    // Aktualisiere die globalen Highscores, wenn Supabase verfügbar ist
    if (supabase) {
      fetchGlobalHighScores();
    }
    
    spawnEnemiesForLevel(level);
    // Note: no loop() or noLoop() needed because p5 draw() will run continuously by default at ~60 FPS&#8203;:contentReference[oaicite:4]{index=4}
  }
  
  // Funktion zum Abfragen des Spielernamens
  function askPlayerName() {
    const playerName = prompt("Bitte gib deinen Namen ein:", "Spieler");
    if (playerName) {
      window.localStorage.setItem('playerName', playerName);
    } else {
      window.localStorage.setItem('playerName', "Anonym");
    }
  }
  
  // Function to spawn enemies for a given level
  function spawnEnemiesForLevel(lvl) {
    if (lvl % 5 === 0) {
      // Boss level every 5th level
      let boss = new Enemy("boss", width/2, -60);
      enemies.push(boss);
    } else {
      // Spawn a wave of normal enemies
      let numEnemies = lvl + 4;  // increasing number of enemies each level
      for (let i = 0; i < numEnemies; i++) {
        // Determine enemy type based on level (higher levels introduce new types)
        let possibleTypes = [1];
        if (lvl >= 2) possibleTypes.push(2);
        if (lvl >= 3) possibleTypes.push(3);
        let type = random(possibleTypes);
        type = floor(type);  // ensure it's an integer type (for 1,2,3)
        let ex = random(20, width - 20);
        let ey = random(-300, -50);  // start above the top of canvas
        enemies.push(new Enemy(type, ex, ey));
      }
    }
  }
  
  // The main draw loop (called ~60 times per second by p5.js)
  function draw() {
    background(0);  // clear screen with black background
    if (gameState === "PLAY") {
      // ** Handle Player Input **
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // 65 = 'A'
        player.move(-1, 0);
      }
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // 68 = 'D'
        player.move(1, 0);
      }
      if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // 87 = 'W'
        player.move(0, -1);
      }
      if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // 83 = 'S'
        player.move(0, 1);
      }
      // Shooting (space or 'Z'); create a bullet if cooldown allows
      if (keyIsDown(32) || keyIsDown(90)) { // 32 = SPACE, 90 = 'Z'
        let newBullet = player.shoot();
        if (newBullet) {
          bullets.push(newBullet);
        }
      }
  
      // ** Update Entities **
      player.update();
      // Update enemies and possibly trigger enemy shooting
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        let e = enemies[ei];
        e.update();
        // If enemy can shoot, decide if it fires this frame
        if (e.canShoot) {
          if (e.type === "boss") {
            // Boss: fires periodically (e.g., every 60 frames)
            if (frameCount % 60 === 0) {
              // Boss fires a spread of bullets
              bullets.push(new Bullet(e.x, e.y + e.height/2, 0, BULLET_SPEED, true));      // straight down
              bullets.push(new Bullet(e.x, e.y + e.height/2, -2, BULLET_SPEED, true));     // angled left
              bullets.push(new Bullet(e.x, e.y + e.height/2, 2, BULLET_SPEED, true));      // angled right
            }
          } else if (e.type === 3) {
            // Type 3 shooter enemy: random chance to shoot, increased slightly with level
            if (random(1) < e.shootChance * level) {
              bullets.push(new Bullet(e.x, e.y + e.height/2, 0, BULLET_SPEED, true));
            }
          }
        }
        // Remove enemies that move off screen (escaped) to keep things clean
        if (e.y > height + e.height) {
          enemies.splice(ei, 1);
        }
      }
      // Update bullets
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        let b = bullets[bi];
        b.update();
        if (b.offScreen()) {
          bullets.splice(bi, 1);
          continue;
        }
      }
      // Update power-ups
      for (let pi = powerUps.length - 1; pi >= 0; pi--) {
        let p = powerUps[pi];
        p.update();
        if (p.offScreen()) {
          powerUps.splice(pi, 1);
        }
      }
  
      // ** Collision Detection **
      // Bullets vs Enemies
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        let b = bullets[bi];
        if (!b.isEnemy) {
          // Player bullet: check against enemies
          for (let ei = enemies.length - 1; ei >= 0; ei--) {
            let e = enemies[ei];
            // Simple AABB collision
            if (abs(b.x - e.x) < (b.width/2 + e.width/2) && 
                abs(b.y - e.y) < (b.height/2 + e.height/2)) {
              // Bullet hits enemy
              bullets.splice(bi, 1); // remove bullet
              // Reduce enemy health
              e.health -= 1;
              if (e.health <= 0) {
                // Enemy is destroyed
                score += 100;  // add points
                // Chance to spawn a power-up from this enemy's position
                if (random(1) < 0.2) {  // 20% chance
                  let puType = (random(1) < 0.5) ? "shield" : "rapid";
                  powerUps.push(new PowerUp(puType, e.x, e.y));
                }
                enemies.splice(ei, 1); // remove enemy
              }
              break; // break out of enemy loop (bullet gone)
            }
          }
        } else {
          // Enemy bullet: check collision with player
          if (abs(b.x - player.x) < (b.width/2 + player.width/2) &&
              abs(b.y - player.y) < (b.height/2 + player.height/2)) {
            // Enemy bullet hits player
            bullets.splice(bi, 1);
            if (player.shieldActive) {
              // Shield absorbs the hit
              player.shieldActive = false;
            } else {
              player.lives -= 1;
            }
            if (player.lives <= 0) {
              // Player dies -> Game Over
              triggerGameOver();
              return; // exit the draw loop early this frame
            }
          }
        }
      }
      // Player colliding with enemies (e.g., rammed by an enemy)
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        let e = enemies[ei];
        if (abs(e.x - player.x) < (player.width/2 + e.width/2) &&
            abs(e.y - player.y) < (player.height/2 + e.height/2)) {
          // Collision detected
          enemies.splice(ei, 1);
          if (player.shieldActive) {
            player.shieldActive = false;
          } else {
            player.lives -= 1;
          }
          if (player.lives <= 0) {
            triggerGameOver();
            return;
          }
        }
      }
      // Player collecting power-ups
      for (let pi = powerUps.length - 1; pi >= 0; pi--) {
        let p = powerUps[pi];
        if (abs(p.x - player.x) < (player.width/2 + p.width/2) &&
            abs(p.y - player.y) < (player.height/2 + p.height/2)) {
          // Player picks up the power-up
          player.applyPowerUp(p.type);
          powerUps.splice(pi, 1);
        }
      }
  
      // ** Check Level Completion **
      if (enemies.length === 0) {
        // All enemies (and boss, if present) defeated
        level++;
        spawnEnemiesForLevel(level);
        // Optionally, display a "Level X" banner or brief pause could be implemented here
      }
  
      // ** Drawing: render all game elements **
      player.draw();
      for (let e of enemies) {
        e.draw();
      }
      for (let b of bullets) {
        b.draw();
      }
      for (let p of powerUps) {
        p.draw();
      }
  
      // ** UI Overlay (score, lives, level, power-up status) **
      fill(255);
      textAlign(LEFT, TOP);
      text(`Score: ${score}`, 10, 10);
      text(`Lives: ${player.lives}`, 10, 30);
      text(`Level: ${level}`, 10, 50);
      // Power-up indicators
      if (player.shieldActive) {
        text("Shield ON", 10, 70);
      }
      if (player.rapidFireActive) {
        text("Rapid Fire ON", 10, 90);
      }
  
    } else if (gameState === "GAMEOVER") {
      // Game Over screen
      fill(255);
      textAlign(CENTER, CENTER);
      text("GAME OVER", width/2, height/2 - 80);
      text(`Final Score: ${score}`, width/2, height/2 - 50);
      
      // Display Local High Scores
      text("Lokale Highscores:", width/2, height/2 - 20);
      for (let i = 0; i < Math.min(highScores.length, 3); i++) {
        text(`${i+1}. ${highScores[i]}`, width/2, height/2 + 10 + 20*i);
      }
      
      // Display Global High Scores if available
      text("Online Bestenliste:", width/2, height/2 + 80);
      if (globalHighScores.length > 0) {
        for (let i = 0; i < Math.min(globalHighScores.length, 3); i++) {
          const entry = globalHighScores[i];
          const playerName = entry.player_name || "Anonym";
          text(`${i+1}. ${playerName}: ${entry.score} (Level ${entry.level})`, width/2, height/2 + 110 + 20*i);
        }
      } else {
        // Zeige Status der Online-Bestenliste an
        text(onlineLeaderboardStatus, width/2, height/2 + 110);
      }
      
      text("Press Enter to Restart", width/2, height - 50);
    }
  }
  
  // Handle key pressed events (for one-time actions)
  function keyPressed() {
    // If game over, pressing Enter will restart the game
    if (gameState === "GAMEOVER" && keyCode === ENTER) {
      resetGame();
    }
  }
  
  // Trigger game over sequence
  function triggerGameOver() {
    gameState = "GAMEOVER";
    
    // Update high score list
    highScores.push(score);
    highScores.sort((a, b) => b - a);
    highScores = highScores.slice(0, 5);
    
    // Save updated scores to local storage
    window.localStorage.setItem('highScores', JSON.stringify(highScores));
    
    // Save score to Supabase database
    if (supabase) {
      const playerName = window.localStorage.getItem('playerName') || 'Anonymous';
      
      onlineLeaderboardStatus = "Speichere Punktzahl...";
      
      supabase
        .from('leaderboard')
        .insert([
          { 
            player_name: playerName, 
            score: score,
            level: level
          }
        ])
        .then(response => {
          console.log('Score saved to database', response);
          onlineLeaderboardStatus = "Punktzahl gespeichert!";
          // Nach dem Speichern die globalen Top-Scores abrufen
          setTimeout(fetchGlobalHighScores, 1000);
        })
        .catch(error => {
          console.error('Error saving score:', error);
          onlineLeaderboardStatus = "Fehler beim Speichern: " + error.message;
        });
    } else {
      onlineLeaderboardStatus = "Offline-Modus: Punktzahl nur lokal gespeichert";
    }
  }
  
  