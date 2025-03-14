// Player class: represents the player's spaceship

// Supabase-Variablen
let supabase; // Der Supabase-Client

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
    
    console.log('Game setup started');
    
    // Supabase-Client aus der globalen Variable holen
    initSupabase();
    
    // Initialize game entities
    resetGame();               // custom function to initialize/restart the game
  }
  
  // Einfache Funktion zur Initialisierung von Supabase
  function initSupabase() {
    console.log('Initializing Supabase from sketch.js...');
    
    // Prüfen, ob der Supabase-Client in der globalen Variable verfügbar ist
    if (window.supabaseClient) {
      console.log('Using Supabase client from global variable');
      supabase = window.supabaseClient;
      
      // Verbindung testen
      testConnection();
    } else {
      console.error('Supabase client not available in global variable');
      onlineLeaderboardStatus = "Supabase nicht verfügbar";
      
      // Warte kurz und versuche es erneut, falls die Initialisierung in index.html noch läuft
      setTimeout(() => {
        if (window.supabaseClient) {
          console.log('Supabase client found after delay');
          supabase = window.supabaseClient;
          testConnection();
        } else if (typeof supabase !== 'undefined') {
          // Versuche, den Client direkt zu erstellen, falls die Bibliothek geladen ist
          try {
            // Verwende die globalen Variablen aus index.html
            supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
              auth: {
                autoRefreshToken: true,
                persistSession: true
              }
            });
            console.log('Created Supabase client directly in sketch.js');
            window.supabaseClient = supabase; // Setze die globale Variable
            testConnection();
          } catch (error) {
            console.error('Error creating Supabase client in sketch.js:', error);
            onlineLeaderboardStatus = "Fehler bei Supabase-Initialisierung";
            
            // Versuche es später noch einmal
            setTimeout(initSupabase, 2000);
          }
        } else {
          console.error('Supabase library still not available after delay');
          onlineLeaderboardStatus = "Supabase-Bibliothek nicht verfügbar";
          
          // Versuche es später noch einmal
          setTimeout(initSupabase, 2000);
        }
      }, 1000);
    }
  }
  
  // Funktion zum Testen der Verbindung
  function testConnection() {
    if (!supabase) {
      console.error('Cannot test connection: Supabase client not initialized');
      onlineLeaderboardStatus = "Supabase nicht initialisiert";
      return;
    }
    
    console.log('Testing Supabase connection...');
    onlineLeaderboardStatus = "Teste Verbindung...";
    
    // Direkter Fetch-Aufruf mit CORS-Proxy als Alternative testen
    try {
      fetch(CORS_PROXY + SUPABASE_URL + '/rest/v1/leaderboard?select=count', {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        console.log('Direct fetch test response:', response);
        if (response.ok) {
          console.log('Direct fetch test successful');
        }
      })
      .catch(error => {
        console.error('Direct fetch test failed:', error);
      });
    } catch (e) {
      console.error('Error in direct fetch test:', e);
    }
    
    // Einfacher Test: Versuche, die Anzahl der Einträge in der Tabelle zu zählen
    supabase
      .from('leaderboard')
      .select('count', { count: 'exact', head: true })
      .then(response => {
        console.log('Connection test successful:', response);
        onlineLeaderboardStatus = "Verbindung erfolgreich!";
        
        // Lade die Highscores
        fetchGlobalHighScores();
      })
      .catch(error => {
        console.error('Connection test failed:', error);
        onlineLeaderboardStatus = "Verbindungsfehler: " + error.message;
        
        // Versuche es mit dem CORS-Proxy
        if (error.message && error.message.includes('CORS')) {
          console.log('CORS error detected, trying with proxy...');
          onlineLeaderboardStatus = "Versuche mit CORS-Proxy...";
          
          // Versuche, die Daten direkt mit fetch und CORS-Proxy zu holen
          fetchWithCorsProxy();
        }
      });
  }
  
  // Funktion zum Abrufen der Daten mit CORS-Proxy
  function fetchWithCorsProxy() {
    console.log('Fetching with CORS proxy...');
    
    fetch(CORS_PROXY + SUPABASE_URL + '/rest/v1/leaderboard?select=*&order=score.desc&limit=10', {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log('Data fetched with CORS proxy:', data);
      if (data && data.length > 0) {
        globalHighScores = data;
        onlineLeaderboardStatus = "Daten über CORS-Proxy geladen";
      } else {
        onlineLeaderboardStatus = "Keine Daten über CORS-Proxy gefunden";
      }
    })
    .catch(error => {
      console.error('Error fetching with CORS proxy:', error);
      onlineLeaderboardStatus = "CORS-Proxy-Fehler: " + error.message;
    });
  }
  
  // Funktion zum Abrufen der globalen Highscores
  function fetchGlobalHighScores() {
    if (!supabase) {
      console.error('Cannot fetch global high scores: Supabase client not initialized');
      onlineLeaderboardStatus = "Supabase nicht initialisiert";
      return;
    }
    
    console.log('Fetching global high scores...');
    onlineLeaderboardStatus = "Lade Online-Bestenliste...";
    
    supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(10)
      .then(response => {
        if (response.error) {
          throw response.error;
        }
        
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
        console.error('Error fetching global high scores:', error);
        
        // Detaillierte Fehleranalyse
        if (error.code === 'PGRST301') {
          onlineLeaderboardStatus = "Tabelle nicht gefunden";
        } else if (error.message && error.message.includes('CORS')) {
          onlineLeaderboardStatus = "CORS-Fehler: Versuche mit Proxy...";
          // Versuche es mit dem CORS-Proxy
          fetchWithCorsProxy();
        } else if (error.message && error.message.includes('network')) {
          onlineLeaderboardStatus = "Netzwerkfehler";
        } else {
          onlineLeaderboardStatus = "Fehler beim Laden: " + (error.message || "Unbekannter Fehler");
        }
        
        // Leere die globalHighScores, damit keine alten Daten angezeigt werden
        globalHighScores = [];
      });
  }
  
  // Initialize or reset the game to starting state
  function resetGame() {
    console.log('Resetting game...');
    
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
      console.log('Supabase available, fetching global high scores...');
      fetchGlobalHighScores();
    } else {
      console.log('Supabase not available, trying to initialize...');
      
      // Versuche erneut, Supabase zu initialisieren
      initSupabase();
      
      // Wenn das nicht funktioniert, versuche es mit der globalen Variable
      if (!supabase && window.supabaseClient) {
        console.log('Using Supabase client from global variable');
        supabase = window.supabaseClient;
        fetchGlobalHighScores();
      }
    }
    
    spawnEnemiesForLevel(level);
    // Note: no loop() or noLoop() needed because p5 draw() will run continuously by default at ~60 FPS
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
  
  // Draw function (runs every frame)
  function draw() {
    // Überprüfe regelmäßig die Supabase-Verbindung
    if (!supabase && frameCount % 300 === 0) { // Alle 5 Sekunden (bei 60 FPS)
      console.log('Periodic connection check: Retrying Supabase initialization...');
      initSupabase();
    }
    
    // Clear the canvas with black background
    background(0);
    
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
          let displayText = `${i+1}. ${playerName}: ${entry.score}`;
          
          // Füge Level-Info hinzu, wenn verfügbar
          if (entry.level !== undefined && entry.level !== null) {
            displayText += ` (Level ${entry.level})`;
          }
          
          text(displayText, width/2, height/2 + 110 + 20*i);
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
    
    // Taste 'T' zum Testen der Supabase-Verbindung
    if (key === 't' || key === 'T') {
      console.log('Manual connection test requested');
      
      // Versuche, Supabase neu zu initialisieren
      initSupabase();
      
      // Wenn das nicht funktioniert, versuche es mit der globalen Variable
      if (!supabase && window.supabaseClient) {
        console.log('Using Supabase client from global variable');
        supabase = window.supabaseClient;
        testConnection();
      }
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
      console.log('Saving score to Supabase:', score, 'level:', level);
      
      // Versuche direkt zu speichern
      const scoreData = {
        player_name: playerName,
        score: score,
        level: level
      };
      
      supabase
        .from('leaderboard')
        .insert([scoreData])
        .then(response => {
          if (response.error) {
            throw response.error;
          }
          console.log('Score saved to database', response);
          onlineLeaderboardStatus = "Punktzahl gespeichert!";
          // Nach dem Speichern die globalen Top-Scores abrufen
          setTimeout(fetchGlobalHighScores, 1000);
        })
        .catch(error => {
          console.error('Error saving score:', error);
          
          // Versuche es mit dem CORS-Proxy, wenn es ein CORS-Problem gibt
          if (error.message && error.message.includes('CORS')) {
            console.log('CORS error detected, trying with proxy...');
            onlineLeaderboardStatus = "Versuche mit CORS-Proxy...";
            
            // Versuche, den Score direkt mit fetch und CORS-Proxy zu speichern
            fetch(CORS_PROXY + SUPABASE_URL + '/rest/v1/leaderboard', {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify([scoreData])
            })
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
              }
              console.log('Score saved with CORS proxy');
              onlineLeaderboardStatus = "Punktzahl über Proxy gespeichert!";
              setTimeout(fetchGlobalHighScores, 1000);
            })
            .catch(proxyError => {
              console.error('Error saving with CORS proxy:', proxyError);
              onlineLeaderboardStatus = "Proxy-Fehler: " + proxyError.message;
              
              // Versuche es ohne level-Feld als Fallback
              tryWithoutLevelField();
            });
          } else if (error.message && (error.message.includes('level') || error.code === '42703')) {
            // Versuche es ohne level-Feld, falls das der Fehler war
            tryWithoutLevelField();
          } else {
            onlineLeaderboardStatus = "Fehler beim Speichern: " + error.message;
            
            // Trotzdem versuchen, die globalen Highscores zu laden
            setTimeout(fetchGlobalHighScores, 1000);
          }
        });
    } else {
      onlineLeaderboardStatus = "Offline-Modus: Punktzahl nur lokal gespeichert";
      
      // Versuche, Supabase zu initialisieren
      console.log('Trying to initialize Supabase...');
      initSupabase();
      
      // Wenn das nicht funktioniert, versuche es mit der globalen Variable
      if (!supabase && window.supabaseClient) {
        console.log('Using Supabase client from global variable');
        supabase = window.supabaseClient;
        
        // Versuche erneut, den Score zu speichern
        setTimeout(() => triggerGameOver(), 500);
      }
    }
    
    // Hilfsfunktion zum Versuch ohne level-Feld
    function tryWithoutLevelField() {
      console.log('Trying without level field');
      const simpleScoreData = {
        player_name: playerName,
        score: score
      };
      
      supabase
        .from('leaderboard')
        .insert([simpleScoreData])
        .then(response => {
          if (response.error) {
            throw response.error;
          }
          console.log('Score saved to database (without level)', response);
          onlineLeaderboardStatus = "Punktzahl gespeichert!";
          setTimeout(fetchGlobalHighScores, 1000);
        })
        .catch(secondError => {
          console.error('Second attempt failed:', secondError);
          
          // Versuche es mit dem CORS-Proxy als letzten Ausweg
          if (secondError.message && secondError.message.includes('CORS')) {
            fetch(CORS_PROXY + SUPABASE_URL + '/rest/v1/leaderboard', {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify([simpleScoreData])
            })
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
              }
              console.log('Simple score saved with CORS proxy');
              onlineLeaderboardStatus = "Einfache Punktzahl über Proxy gespeichert!";
              setTimeout(fetchGlobalHighScores, 1000);
            })
            .catch(proxyError => {
              console.error('Error saving simple score with CORS proxy:', proxyError);
              onlineLeaderboardStatus = "Fehler beim Speichern: " + secondError.message;
            });
          } else {
            onlineLeaderboardStatus = "Fehler beim Speichern: " + secondError.message;
          }
          
          // Trotzdem versuchen, die globalen Highscores zu laden
          setTimeout(fetchGlobalHighScores, 1000);
        });
    }
  }
  
  