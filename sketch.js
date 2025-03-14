// Player class: represents the player's spaceship

// Globale Variablen für Speichermanagement
let framesSinceLastCleanup = 0;
const CLEANUP_INTERVAL = 300; // Alle 5 Sekunden (bei 60 FPS)
const MAX_ENEMIES = 50; // Maximale Anzahl von Gegnern
const MAX_BULLETS = 100; // Maximale Anzahl von Kugeln
const MAX_POWERUPS = 10; // Maximale Anzahl von Power-Ups

// Globale Variablen für die Online-Bestenliste
let globalHighScores = [];
let onlineLeaderboardStatus = "Lade Online-Bestenliste...";

// Neue Variablen für das Formular
let playerNameInput;
let submitButton;
let formSubmitted = false;

// Neue Variable für den Controls-Tooltip
let showControlsTooltip = true;
let tooltipAlpha = 255; // Vollständig sichtbar zu Beginn
let tooltipFadeTimer = 0;
const TOOLTIP_FADE_DELAY = 600; // 10 Sekunden bei 60 FPS

// Neue Variablen für Partikeleffekte
let particles = [];
const MAX_PARTICLES = 200;

// Neue Variablen für Sternenhintergrund
let stars = [];
const NUM_STARS = 100;

// Neue Variablen für das Leaderboard-Scrolling
let leaderboardScrollY = 0;
let maxLeaderboardScroll = 0;
let isDragging = false;
let dragStartY = 0;
let dragStartScrollY = 0;

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
      this.thrusterAnimation = 0; // Animation für die Triebwerke
      this.tiltAmount = 0;        // Neigung beim Bewegen
      this.maxTilt = 0.2;         // Maximale Neigung in Radianten
      this.tiltSpeed = 0.05;      // Geschwindigkeit der Neigungsänderung
      this.shieldPulse = 0;       // Pulsierender Schild-Effekt
      this.engineGlow = 0;        // Triebwerksglühen
      this.lastDirection = 0;     // Letzte Bewegungsrichtung (-1 links, 0 keine, 1 rechts)
      
      // Define detailed pixel-art sprite pattern for the ship
      this.sprite = [
        [0,0,0,0,0,1,0,0,0,0,0],
        [0,0,0,0,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0],
        [0,1,1,2,2,2,2,2,1,1,0],
        [1,1,2,2,3,3,3,2,2,1,1],
        [1,2,2,3,3,4,3,3,2,2,1],
        [1,2,3,3,4,4,4,3,3,2,1],
        [1,2,3,4,4,5,4,4,3,2,1],
        [1,1,3,3,3,3,3,3,3,1,1],
        [0,0,1,1,0,1,0,1,1,0,0],
        [0,0,0,1,0,1,0,1,0,0,0]
      ];
      
      // Triebwerksanimation (wird abwechselnd gezeichnet)
      this.thrusterSprites = [
        [
          [0,0,0,1,0,1,0,0,0],
          [0,0,1,2,1,2,1,0,0],
          [0,1,2,3,2,3,2,1,0]
        ],
        [
          [0,0,1,0,1,0,1,0,0],
          [0,1,2,1,2,1,2,1,0],
          [1,2,3,2,3,2,3,2,1]
        ]
      ];
      
      // Farbpalette für das Schiff (Indizes entsprechen den Zahlen im Sprite)
      this.colorPalette = [
        [0, 0, 0, 0],             // 0: Transparent
        [0, 180, 255, 255],       // 1: Hellblau (Außenhülle)
        [0, 120, 200, 255],       // 2: Mittelblau
        [0, 80, 150, 255],        // 3: Dunkelblau
        [200, 230, 255, 255],     // 4: Cockpit-Glas
        [255, 255, 255, 255]      // 5: Highlights
      ];
      
      // Farbpalette für die Triebwerke
      this.thrusterColors = [
        [0, 0, 0, 0],             // 0: Transparent
        [255, 200, 50, 255],      // 1: Gelb
        [255, 120, 0, 255],       // 2: Orange
        [255, 50, 0, 255]         // 3: Rot
      ];
      
      this.pixelSize = 3;         // size of one "pixel" block for the sprite
      
      // Calculate sprite dimensions in pixels for collision detection
      this.width = this.sprite[0].length * this.pixelSize;
      this.height = this.sprite.length * this.pixelSize;
      
      // Shooting cooldown settings
      this.baseCooldown = 10;     // frames between shots (base rate)
      this.cooldown = this.baseCooldown; // current cooldown (shorter if rapidFireActive)
      this.lastShotFrame = 0;     // the frameCount when the last shot was fired
      
      // Schild-Eigenschaften
      this.shieldRadius = this.width * 0.8;
      this.shieldColor = [0, 200, 255, 100]; // Cyan mit Transparenz
      
      // Partikeleffekt-Timer
      this.particleTimer = 0;
    }
  
    move(dx, dy) {
      // Speichere die letzte horizontale Bewegungsrichtung für die Neigung
      if (dx !== 0) {
        this.lastDirection = dx > 0 ? 1 : -1;
      } else {
        // Langsam zur Mitte zurückkehren, wenn keine Bewegung
        if (this.tiltAmount > 0) this.tiltAmount -= this.tiltSpeed;
        else if (this.tiltAmount < 0) this.tiltAmount += this.tiltSpeed;
        
        // Kleine Schwellenwerte auf Null setzen
        if (Math.abs(this.tiltAmount) < 0.05) this.tiltAmount = 0;
      }
      
      // Neigung basierend auf der Bewegungsrichtung anpassen
      if (dx > 0) { // Nach rechts -> nach links neigen
        this.tiltAmount = lerp(this.tiltAmount, -this.maxTilt, 0.2);
      } else if (dx < 0) { // Nach links -> nach rechts neigen
        this.tiltAmount = lerp(this.tiltAmount, this.maxTilt, 0.2);
      }
      
      // Move player by dx, dy, ensuring it stays on screen
      this.x += dx * this.speed;
      this.y += dy * this.speed;
      
      // Constrain within canvas bounds (assuming global width and height)
      if (this.x < this.width/2) this.x = this.width/2;
      if (this.x > width - this.width/2) this.x = width - this.width/2;
      if (this.y < this.height/2) this.y = this.height/2;
      if (this.y > height - this.height/2) this.y = height - this.height/2;
      
      // Triebwerksanimation aktualisieren
      if (frameCount % 5 === 0) {
        this.thrusterAnimation = (this.thrusterAnimation + 1) % 2;
      }
      
      // Triebwerksglühen pulsieren lassen
      this.engineGlow = 0.7 + 0.3 * sin(frameCount * 0.2);
      
      // Partikeleffekte erzeugen (Triebwerksabgase)
      this.particleTimer++;
      if (this.particleTimer >= 2) { // Alle 2 Frames
        this.particleTimer = 0;
        
        // Partikel für die Triebwerke erzeugen
        if (particles.length < MAX_PARTICLES) {
          // Linkes Triebwerk
          let leftX = this.x - this.width/4;
          let rightX = this.x + this.width/4;
          let exhaustY = this.y + this.height/2;
          
          // Zufällige Geschwindigkeit und Lebensdauer
          let vx = random(-0.3, 0.3);
          let vy = random(1, 3);
          let lifetime = random(20, 40);
          
          // Farbe basierend auf Triebwerksglühen
          let r = 255;
          let g = random(100, 200) * this.engineGlow;
          let b = random(0, 50) * this.engineGlow;
          let alpha = random(150, 255);
          
          // Partikel hinzufügen
          particles.push(new Particle(leftX, exhaustY, vx, vy, [r, g, b, alpha], lifetime, random(1, 3)));
          particles.push(new Particle(rightX, exhaustY, vx, vy, [r, g, b, alpha], lifetime, random(1, 3)));
        }
      }
    }
  
    // Handle shooting: returns a new Bullet if able to shoot, otherwise null
    shoot() {
      // Check cooldown (using frameCount for timing)
      if (frameCount - this.lastShotFrame >= this.cooldown) {
        this.lastShotFrame = frameCount;
        
        // Schusseffekt: kurzes Aufleuchten
        this.engineGlow = 1.5;
        
        // Schussposition (leicht versetzt für Doppelschuss)
        const leftX = this.x - this.width/6;
        const rightX = this.x + this.width/6;
        const by = this.y - this.height/2 - 2; // a bit above the ship
        
        // Erzeuge Partikeleffekte für den Schuss
        if (particles.length < MAX_PARTICLES - 10) {
          for (let i = 0; i < 5; i++) {
            let vx = random(-1, 1);
            let vy = random(-3, -1);
            let lifetime = random(10, 20);
            let color = this.rapidFireActive ? 
                        [255, 255, 0, random(150, 255)] : // Gelb für Rapid Fire
                        [0, 200, 255, random(150, 255)];  // Blau für normalen Schuss
            
            particles.push(new Particle(leftX, by, vx, vy, color, lifetime, random(1, 2)));
            particles.push(new Particle(rightX, by, vx, vy, color, lifetime, random(1, 2)));
          }
        }
        
        // Erzeuge zwei Schüsse nebeneinander
        let leftBullet = new Bullet(leftX, by, 0, -BULLET_SPEED, false);
        let rightBullet = new Bullet(rightX, by, 0, -BULLET_SPEED, false);
        
        // Wenn Rapid Fire aktiv ist, gib beiden Kugeln spezielle Eigenschaften
        if (this.rapidFireActive) {
          leftBullet.powered = true;
          rightBullet.powered = true;
        }
        
        return [leftBullet, rightBullet];
      }
      return null;
    }
  
    applyPowerUp(type) {
      // Apply effects based on power-up type
      if (type === "shield") {
        this.shieldActive = true;
        // Partikeleffekt beim Aktivieren des Schilds
        if (particles.length < MAX_PARTICLES - 20) {
          for (let i = 0; i < 20; i++) {
            let angle = random(TWO_PI);
            let speed = random(1, 3);
            let vx = cos(angle) * speed;
            let vy = sin(angle) * speed;
            let lifetime = random(20, 40);
            particles.push(new Particle(
              this.x, this.y, vx, vy, 
              [0, 200, 255, random(150, 255)], 
              lifetime, random(1, 3)
            ));
          }
        }
      } else if (type === "rapid") {
        this.rapidFireActive = true;
        this.rapidTimer = 300;            // effect lasts ~300 frames (5 seconds at 60 FPS)
        this.cooldown = Math.floor(this.baseCooldown / 2);  // double firing rate
        
        // Partikeleffekt beim Aktivieren von Rapid Fire
        if (particles.length < MAX_PARTICLES - 20) {
          for (let i = 0; i < 20; i++) {
            let angle = random(TWO_PI);
            let speed = random(1, 3);
            let vx = cos(angle) * speed;
            let vy = sin(angle) * speed;
            let lifetime = random(20, 40);
            particles.push(new Particle(
              this.x, this.y, vx, vy, 
              [255, 255, 0, random(150, 255)], 
              lifetime, random(1, 3)
            ));
          }
        }
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
      
      // Schild-Pulsieren aktualisieren
      if (this.shieldActive) {
        this.shieldPulse = (this.shieldPulse + 0.05) % TWO_PI;
      }
    }
  
    draw() {
      push(); // Speichere den aktuellen Transformationszustand
      
      // Transformiere zum Schiffszentrum und wende Neigung an
      translate(this.x, this.y);
      rotate(this.tiltAmount);
      
      // Zeichne zuerst die Triebwerke (sie sind unter dem Schiff)
      this.drawThrusters();
      
      // Zeichne das Hauptschiff
      this.drawShipBody();
      
      // Zeichne den Schild, wenn aktiv
      if (this.shieldActive) {
        this.drawShield();
      }
      
      // Zeichne Rapid-Fire-Indikator, wenn aktiv
      if (this.rapidFireActive) {
        this.drawRapidFireEffect();
      }
      
      pop(); // Stelle den ursprünglichen Transformationszustand wieder her
    }
    
    drawShipBody() {
      noStroke();
      
      // Zeichne das Schiff Pixel für Pixel mit der Farbpalette
      const halfWidth = (this.sprite[0].length * this.pixelSize) / 2;
      const halfHeight = (this.sprite.length * this.pixelSize) / 2;
      
      for (let r = 0; r < this.sprite.length; r++) {
        for (let c = 0; c < this.sprite[r].length; c++) {
          const colorIndex = this.sprite[r][c];
          if (colorIndex > 0) { // Nur zeichnen, wenn nicht transparent
            const color = this.colorPalette[colorIndex];
            fill(color[0], color[1], color[2], color[3]);
            rect(
              c * this.pixelSize - halfWidth, 
              r * this.pixelSize - halfHeight, 
              this.pixelSize, this.pixelSize
            );
          }
        }
      }
      
      // Zeichne zusätzliche Details wie Cockpit-Glanz
      if (frameCount % 120 < 10) { // Gelegentliches Aufblitzen
        fill(255, 255, 255, 150);
        const cockpitX = -this.pixelSize;
        const cockpitY = -this.pixelSize * 3;
        rect(cockpitX, cockpitY, this.pixelSize * 2, this.pixelSize);
      }
    }
    
    drawThrusters() {
      // Wähle das aktuelle Triebwerksanimations-Frame
      const thrusterSprite = this.thrusterSprites[this.thrusterAnimation];
      
      // Position unter dem Schiff
      const thrusterWidth = thrusterSprite[0].length * this.pixelSize;
      const thrusterHeight = thrusterSprite.length * this.pixelSize;
      const thrusterX = -thrusterWidth / 2;
      const thrusterY = this.height / 2 - 2; // Leicht überlappend mit dem Schiff
      
      // Zeichne die Triebwerke mit Glüheffekt
      for (let r = 0; r < thrusterSprite.length; r++) {
        for (let c = 0; c < thrusterSprite[r].length; c++) {
          const colorIndex = thrusterSprite[r][c];
          if (colorIndex > 0) {
            const color = this.thrusterColors[colorIndex];
            // Passe die Helligkeit basierend auf engineGlow an
            fill(
              color[0], 
              color[1] * this.engineGlow, 
              color[2] * this.engineGlow, 
              color[3]
            );
            rect(
              thrusterX + c * this.pixelSize, 
              thrusterY + r * this.pixelSize, 
              this.pixelSize, this.pixelSize
            );
          }
        }
      }
    }
    
    drawShield() {
      // Pulsierender Schild-Effekt
      const pulseSize = 1 + 0.1 * sin(this.shieldPulse * 5);
      const pulseAlpha = 100 + 50 * sin(this.shieldPulse * 3);
      
      // Äußerer Schild (transparent)
      noFill();
      strokeWeight(2);
      stroke(
        this.shieldColor[0], 
        this.shieldColor[1], 
        this.shieldColor[2], 
        pulseAlpha
      );
      ellipse(0, 0, this.shieldRadius * 2 * pulseSize);
      
      // Innerer Schild (noch transparenter)
      strokeWeight(4);
      stroke(
        this.shieldColor[0], 
        this.shieldColor[1], 
        this.shieldColor[2], 
        pulseAlpha * 0.5
      );
      ellipse(0, 0, this.shieldRadius * 1.8 * pulseSize);
      
      // Schild-Highlights
      strokeWeight(1);
      for (let i = 0; i < 8; i++) {
        const angle = i * PI/4 + frameCount * 0.01;
        const highlightX = cos(angle) * this.shieldRadius * pulseSize;
        const highlightY = sin(angle) * this.shieldRadius * pulseSize;
        
        stroke(255, 255, 255, pulseAlpha);
        line(
          highlightX * 0.8, highlightY * 0.8,
          highlightX, highlightY
        );
      }
    }
    
    drawRapidFireEffect() {
      // Pulsierender Effekt um das Schiff für Rapid Fire
      noFill();
      strokeWeight(1);
      
      // Berechne Pulsieren basierend auf verbleibender Zeit
      const pulseSpeed = map(this.rapidTimer, 0, 300, 0.3, 0.1);
      const pulseIntensity = map(this.rapidTimer, 0, 300, 0.5, 1);
      
      for (let i = 0; i < 3; i++) {
        const pulseSize = 1 + 0.2 * sin(frameCount * pulseSpeed + i);
        const alpha = 150 * pulseIntensity * (1 - i * 0.2);
        
        stroke(255, 255, 0, alpha);
        ellipse(0, 0, (this.width * 0.8 + i * 5) * pulseSize);
      }
    }
  }

// Neue Partikelklasse für visuelle Effekte
class Particle {
  constructor(x, y, vx, vy, color, lifetime, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.maxLifetime = lifetime;
    this.lifetime = lifetime;
    this.size = size;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    
    // Optional: Partikel können langsamer werden
    this.vx *= 0.98;
    this.vy *= 0.98;
  }
  
  draw() {
    // Transparenz basierend auf verbleibender Lebensdauer
    const alpha = map(this.lifetime, 0, this.maxLifetime, 0, this.color[3]);
    const size = map(this.lifetime, 0, this.maxLifetime, 0, this.size);
    
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], alpha);
    ellipse(this.x, this.y, size);
  }
  
  isDead() {
    return this.lifetime <= 0;
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
    this.powered = false; // Flag für Rapid-Fire-Projektile
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.rotation = 0;
    this.rotationSpeed = random(-0.1, 0.1);
    
    // Größere und detailliertere Sprites für die Projektile
    if (!isEnemy) {
      // Spieler-Projektil: Blau-Weiß mit Energieeffekt
      this.sprites = [
        [
          [0,0,1,1,0,0],
          [0,1,2,2,1,0],
          [1,2,3,3,2,1],
          [1,2,3,3,2,1],
          [0,1,2,2,1,0],
          [0,0,1,1,0,0]
        ],
        [
          [0,0,1,1,0,0],
          [0,1,2,2,1,0],
          [1,3,2,2,3,1],
          [1,3,2,2,3,1],
          [0,1,2,2,1,0],
          [0,0,1,1,0,0]
        ]
      ];
      
      // Farbpalette für Spieler-Projektile
      this.colorPalette = [
        [0, 0, 0, 0],         // 0: Transparent
        [0, 150, 255, 200],   // 1: Hellblau (Außen)
        [100, 200, 255, 230], // 2: Mittelblau
        [200, 240, 255, 255]  // 3: Weiß-Blau (Kern)
      ];
    } else {
      // Gegner-Projektil: Rot-Orange mit Feuereffekt
      this.sprites = [
        [
          [0,1,1,1,1,0],
          [1,2,2,2,2,1],
          [1,2,3,3,2,1],
          [1,2,3,3,2,1],
          [1,2,2,2,2,1],
          [0,1,1,1,1,0]
        ],
        [
          [0,1,1,1,1,0],
          [1,2,3,3,2,1],
          [1,3,2,2,3,1],
          [1,3,2,2,3,1],
          [1,2,3,3,2,1],
          [0,1,1,1,1,0]
        ]
      ];
      
      // Farbpalette für Gegner-Projektile
      this.colorPalette = [
        [0, 0, 0, 0],         // 0: Transparent
        [255, 100, 0, 200],   // 1: Orange (Außen)
        [255, 50, 0, 230],    // 2: Rot
        [255, 220, 50, 255]   // 3: Gelb (Kern)
      ];
    }
    
    this.pixelSize = 2; // Kleinere Pixel für feinere Details
    
    // Berechne die Dimensionen für die Kollisionserkennung
    this.width = this.sprites[0][0].length * this.pixelSize;
    this.height = this.sprites[0].length * this.pixelSize;
    
    // Erstelle Partikeleffekt beim Erzeugen des Projektils
    if (particles.length < MAX_PARTICLES - 5) {
      const particleColor = isEnemy ? 
        [255, 100, 0, random(150, 200)] : 
        [0, 150, 255, random(150, 200)];
      
      for (let i = 0; i < 3; i++) {
        const vx = random(-1, 1);
        const vy = isEnemy ? random(-1, 1) : random(-2, -0.5);
        particles.push(new Particle(
          this.x, this.y, vx, vy, 
          particleColor, random(10, 20), random(1, 2)
        ));
      }
    }
    
    // Spezielle Eigenschaften für Rapid-Fire-Projektile
    if (this.powered) {
      this.width *= 1.2;
      this.height *= 1.2;
      this.pixelSize *= 1.2;
    }
  }

  update() {
    // Move the bullet according to its velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Rotation aktualisieren
    this.rotation += this.rotationSpeed;
    
    // Animation aktualisieren
    this.animationTimer++;
    if (this.animationTimer >= 5) { // Alle 5 Frames wechseln
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % this.sprites.length;
    }
    
    // Partikeleffekt während der Bewegung
    if (frameCount % 2 === 0 && particles.length < MAX_PARTICLES) {
      const particleColor = this.isEnemy ? 
        [255, 100, 0, random(50, 100)] : 
        [0, 150, 255, random(50, 100)];
      
      // Schweif-Partikel
      particles.push(new Particle(
        this.x, this.y, 
        random(-0.5, 0.5), 
        this.isEnemy ? random(-1, -0.5) : random(0.5, 1), 
        particleColor, random(5, 15), random(0.5, 1.5)
      ));
    }
  }

  offScreen() {
    // Check if bullet is outside the canvas bounds
    return (this.y < 0 || this.y > height || this.x < 0 || this.x > width);
  }

  draw() {
    push(); // Speichere den aktuellen Transformationszustand
    
    // Transformiere zum Projektilzentrum und wende Rotation an
    translate(this.x, this.y);
    rotate(this.rotation);
    
    // Wähle das aktuelle Animationsframe
    const sprite = this.sprites[this.animationFrame];
    
    // Zeichne das Projektil mit der Farbpalette
    noStroke();
    const halfWidth = (sprite[0].length * this.pixelSize) / 2;
    const halfHeight = (sprite.length * this.pixelSize) / 2;
    
    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        const colorIndex = sprite[r][c];
        if (colorIndex > 0) { // Nur zeichnen, wenn nicht transparent
          const color = this.colorPalette[colorIndex];
          
          // Spezielle Effekte für Rapid-Fire-Projektile
          if (this.powered) {
            fill(color[0], color[1], color[2], color[3] * (0.8 + 0.2 * sin(frameCount * 0.2)));
          } else {
            fill(color[0], color[1], color[2], color[3]);
          }
          
          rect(
            c * this.pixelSize - halfWidth, 
            r * this.pixelSize - halfHeight, 
            this.pixelSize, this.pixelSize
          );
        }
      }
    }
    
    // Zusätzlicher Glüheffekt für Rapid-Fire-Projektile
    if (this.powered) {
      noFill();
      const glowColor = this.isEnemy ? 
        [255, 100, 0, 100 + 50 * sin(frameCount * 0.2)] : 
        [0, 150, 255, 100 + 50 * sin(frameCount * 0.2)];
      
      stroke(glowColor[0], glowColor[1], glowColor[2], glowColor[3]);
      strokeWeight(2);
      ellipse(0, 0, this.width * 1.5);
    }
    
    pop(); // Stelle den ursprünglichen Transformationszustand wieder her
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
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.hitEffect = 0;    // Effekt beim Treffer
    this.rotation = 0;     // Rotation für einige Gegnertypen
    this.scale = 1;        // Skalierung für Pulsiereffekte
    this.particleTimer = 0; // Timer für Partikeleffekte
    
    // Pixel-art sprite pattern and color based on type
    this.pixelSize = 3;
    
    if (type === 1) {
      // Type 1: Einfacher Gegner (Jäger) - Schnell und aggressiv
      this.sprites = [
        [
          [0,0,1,1,1,0,0],
          [0,1,2,2,2,1,0],
          [1,2,3,3,3,2,1],
          [1,2,3,0,3,2,1],
          [1,2,3,3,3,2,1],
          [0,1,2,2,2,1,0],
          [0,0,1,1,1,0,0]
        ],
        [
          [0,0,1,1,1,0,0],
          [0,1,2,2,2,1,0],
          [1,2,3,3,3,2,1],
          [1,2,3,3,3,2,1],
          [1,2,0,3,0,2,1],
          [0,1,2,2,2,1,0],
          [0,0,1,1,1,0,0]
        ]
      ];
      
      // Farbpalette für Typ 1
      this.colorPalette = [
        [0, 0, 0, 0],         // 0: Transparent/Augen
        [255, 50, 50, 255],   // 1: Dunkelrot (Außen)
        [255, 100, 100, 255], // 2: Mittelrot
        [255, 150, 150, 255]  // 3: Hellrot (Kern)
      ];
      
      this.vy = 2;    // straight down descent speed
      this.health = 1;
    } else if (type === 2) {
      // Type 2: Wellenförmiger Gegner (Drohne) - Bewegt sich in Wellenform
      this.sprites = [
        [
          [0,0,0,1,0,0,0],
          [0,0,1,2,1,0,0],
          [0,1,2,3,2,1,0],
          [1,2,3,3,3,2,1],
          [1,2,3,0,3,2,1],
          [0,1,2,2,2,1,0],
          [0,0,1,0,1,0,0]
        ],
        [
          [0,0,0,1,0,0,0],
          [0,0,1,2,1,0,0],
          [0,1,2,3,2,1,0],
          [1,2,3,3,3,2,1],
          [1,2,0,3,0,2,1],
          [0,1,2,2,2,1,0],
          [0,0,0,1,0,0,0]
        ]
      ];
      
      // Farbpalette für Typ 2
      this.colorPalette = [
        [0, 0, 0, 0],         // 0: Transparent/Augen
        [50, 255, 50, 255],   // 1: Dunkelgrün (Außen)
        [100, 255, 100, 255], // 2: Mittelgrün
        [150, 255, 150, 255]  // 3: Hellgrün (Kern)
      ];
      
      this.vy = 2;    // falls faster
      this.vx = 1.5;  // horizontal speed for wave
      this.wavePhase = random(TWO_PI); // random phase for sine movement
      this.health = 2; // Etwas mehr Gesundheit
    } else if (type === 3) {
      // Type 3: Schütze (Kanonenturm) - Kann schießen
      this.sprites = [
        [
          [0,1,1,1,1,1,0],
          [1,2,2,2,2,2,1],
          [1,2,3,3,3,2,1],
          [1,2,3,0,3,2,1],
          [1,2,3,3,3,2,1],
          [1,2,2,2,2,2,1],
          [0,1,1,1,1,1,0]
        ],
        [
          [0,1,1,1,1,1,0],
          [1,2,2,2,2,2,1],
          [1,2,3,3,3,2,1],
          [1,2,3,3,3,2,1],
          [1,2,0,3,0,2,1],
          [1,2,2,2,2,2,1],
          [0,1,1,1,1,1,0]
        ]
      ];
      
      // Farbpalette für Typ 3
      this.colorPalette = [
        [0, 0, 0, 0],         // 0: Transparent/Augen
        [255, 120, 0, 255],   // 1: Dunkelorange (Außen)
        [255, 150, 50, 255],  // 2: Mittelorange
        [255, 200, 100, 255]  // 3: Hellorange (Kern)
      ];
      
      this.vy = 1.5;  // Langsamer, da er schießen kann
      this.canShoot = true;
      this.shootChance = 0.01;  // base probability of shooting each frame
      this.health = 3;  // Mehr Gesundheit
    } else if (type === "boss") {
      // Boss: Großer Gegner mit mehr Gesundheit und Schussmustern
      this.sprites = [
        [
          [0,0,1,1,1,1,1,1,1,0,0],
          [0,1,2,2,2,2,2,2,2,1,0],
          [1,2,3,3,3,3,3,3,3,2,1],
          [1,2,3,0,3,3,3,0,3,2,1],
          [1,2,3,3,3,3,3,3,3,2,1],
          [1,2,3,3,3,0,3,3,3,2,1],
          [1,2,3,3,3,3,3,3,3,2,1],
          [1,2,3,0,3,3,3,0,3,2,1],
          [1,2,3,3,3,3,3,3,3,2,1],
          [0,1,2,2,2,2,2,2,2,1,0],
          [0,0,1,1,1,1,1,1,1,0,0]
        ],
        [
          [0,0,1,1,1,1,1,1,1,0,0],
          [0,1,2,2,2,2,2,2,2,1,0],
          [1,2,3,3,3,3,3,3,3,2,1],
          [1,2,3,3,0,3,0,3,3,2,1],
          [1,2,3,3,3,3,3,3,3,2,1],
          [1,2,3,0,3,3,3,0,3,2,1],
          [1,2,3,3,3,3,3,3,3,2,1],
          [1,2,3,3,0,3,0,3,3,2,1],
          [1,2,3,3,3,3,3,3,3,2,1],
          [0,1,2,2,2,2,2,2,2,1,0],
          [0,0,1,1,1,1,1,1,1,0,0]
        ]
      ];
      
      // Farbpalette für Boss
      this.colorPalette = [
        [0, 0, 0, 0],         // 0: Transparent/Augen
        [200, 0, 200, 255],   // 1: Dunkellila (Außen)
        [230, 50, 230, 255],  // 2: Mittellila
        [255, 100, 255, 255]  // 3: Helllila (Kern)
      ];
      
      this.health = 15;            // boss needs 15 hits to destroy
      this.vy = 0.8;               // initial downward speed
      this.canShoot = true;
      this.shootChance = 0;        // (not used for boss, will use a timer instead)
      this.dir = 1;                // horizontal direction for oscillation
      this.shootTimer = 0;         // Timer für Schussmuster
      this.shootPattern = 0;       // Aktuelles Schussmuster
    }
    
    // Calculate width and height from sprite
    this.width = this.sprites[0][0].length * this.pixelSize;
    this.height = this.sprites[0].length * this.pixelSize;
    
    // Spezielle Effekte beim Spawnen
    if (particles.length < MAX_PARTICLES - 10) {
      const baseColor = this.colorPalette[2]; // Mittlere Farbe für Partikel
      for (let i = 0; i < 10; i++) {
        const angle = random(TWO_PI);
        const speed = random(0.5, 2);
        const vx = cos(angle) * speed;
        const vy = sin(angle) * speed;
        particles.push(new Particle(
          this.x, this.y, vx, vy,
          [baseColor[0], baseColor[1], baseColor[2], random(150, 200)],
          random(20, 40), random(1, 3)
        ));
      }
    }
  }

  update() {
    // Animation aktualisieren
    this.animationTimer++;
    if (this.animationTimer >= 15) { // Langsamer als Projektile
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % this.sprites.length;
    }
    
    // Treffer-Effekt abklingen lassen
    if (this.hitEffect > 0) {
      this.hitEffect -= 0.1;
    }
    
    // Movement behavior based on type
    if (this.type === 1) {
      // Moves straight down
      this.y += this.vy;
      
      // Leichte Rotation für visuellen Effekt
      this.rotation = sin(frameCount * 0.05) * 0.1;
    } else if (this.type === 2) {
      // Moves down in a sine wave pattern
      this.y += this.vy;
      // Sine wave horizontal movement
      this.x += this.vx * sin(this.wavePhase + (frameCount * 0.05));
      // Rotation basierend auf Bewegungsrichtung
      this.rotation = sin(this.wavePhase + (frameCount * 0.05)) * 0.2;
      // Pulsieren
      this.scale = 1 + 0.05 * sin(frameCount * 0.1);
    } else if (this.type === 3) {
      // Moves straight down with slight wobble
      this.y += this.vy;
      this.x += sin(frameCount * 0.02) * 0.5; // Leichtes Wackeln
      
      // Zielt auf den Spieler (dreht sich in Richtung Spieler)
      if (player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.rotation = atan2(dy, dx) + PI/2; // +PI/2 um nach unten zu zeigen
      }
    } else if (this.type === "boss") {
      // Boss-spezifische Bewegung und Verhalten
      if (this.y < 100) {
        // move down to fixed position
        this.y += this.vy;
      } else {
        // move horizontally back and forth
        this.x += 1.5 * this.dir;
        if (this.x < this.width/2 || this.x > width - this.width/2) {
          // bounce off edges
          this.dir *= -1;
        }
        
        // Pulsieren
        this.scale = 1 + 0.05 * sin(frameCount * 0.05);
        
        // Schuss-Timer und Muster
        this.shootTimer++;
        if (this.shootTimer >= 120) { // Alle 2 Sekunden Muster wechseln
          this.shootTimer = 0;
          this.shootPattern = (this.shootPattern + 1) % 3; // 3 verschiedene Muster
        }
      }
    }
    
    // Partikeleffekte während der Bewegung
    this.particleTimer++;
    if (this.particleTimer >= 10) { // Alle 10 Frames
      this.particleTimer = 0;
      
      if (particles.length < MAX_PARTICLES && random() < 0.3) {
        const baseColor = this.colorPalette[1]; // Äußere Farbe für Partikel
        const angle = random(TWO_PI);
        const speed = random(0.2, 0.8);
        const vx = cos(angle) * speed;
        const vy = sin(angle) * speed + 0.5; // Leicht nach unten tendierend
        
        particles.push(new Particle(
          this.x + random(-this.width/3, this.width/3), 
          this.y + random(-this.height/3, this.height/3), 
          vx, vy,
          [baseColor[0], baseColor[1], baseColor[2], random(50, 100)],
          random(10, 20), random(1, 2)
        ));
      }
    }
  }
  
  // Neue Methode für Treffer-Effekte
  hit() {
    this.health--;
    this.hitEffect = 1.0; // Maximaler Treffer-Effekt
    
    // Partikeleffekt beim Treffer
    if (particles.length < MAX_PARTICLES - 5) {
      const baseColor = this.colorPalette[2]; // Mittlere Farbe für Partikel
      for (let i = 0; i < 5; i++) {
        const angle = random(TWO_PI);
        const speed = random(1, 3);
        const vx = cos(angle) * speed;
        const vy = sin(angle) * speed;
        particles.push(new Particle(
          this.x, this.y, vx, vy,
          [baseColor[0], baseColor[1], baseColor[2], random(150, 200)],
          random(10, 20), random(1, 2)
        ));
      }
    }
    
    return this.health <= 0; // Gibt zurück, ob der Gegner zerstört wurde
  }
  
  // Neue Methode für Boss-Schussmuster
  getBossShots() {
    if (this.type !== "boss" || this.y < 100) return [];
    
    const shots = [];
    
    // Verschiedene Schussmuster basierend auf this.shootPattern
    switch (this.shootPattern) {
      case 0: // Kreisförmiges Muster
        if (this.shootTimer % 20 === 0 && bullets.length < MAX_BULLETS - 8) {
          const numShots = 8;
          for (let i = 0; i < numShots; i++) {
            const angle = (i / numShots) * TWO_PI;
            const vx = cos(angle) * BULLET_SPEED * 0.5;
            const vy = sin(angle) * BULLET_SPEED * 0.5;
            shots.push(new Bullet(this.x, this.y, vx, vy, true));
          }
        }
        break;
      case 1: // Zielgerichtetes Muster auf Spieler
        if (this.shootTimer % 30 === 0 && bullets.length < MAX_BULLETS - 3 && player) {
          // Berechne Richtung zum Spieler
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const angle = atan2(dy, dx);
          
          // Hauptschuss
          const vx = cos(angle) * BULLET_SPEED * 0.7;
          const vy = sin(angle) * BULLET_SPEED * 0.7;
          shots.push(new Bullet(this.x, this.y, vx, vy, true));
          
          // Zwei Schüsse leicht versetzt
          shots.push(new Bullet(this.x, this.y, 
            cos(angle + 0.2) * BULLET_SPEED * 0.6, 
            sin(angle + 0.2) * BULLET_SPEED * 0.6, true));
          shots.push(new Bullet(this.x, this.y, 
            cos(angle - 0.2) * BULLET_SPEED * 0.6, 
            sin(angle - 0.2) * BULLET_SPEED * 0.6, true));
        }
        break;
      case 2: // Spiralmuster
        if (this.shootTimer % 10 === 0 && bullets.length < MAX_BULLETS - 1) {
          const angle = this.shootTimer * 0.2;
          const vx = cos(angle) * BULLET_SPEED * 0.6;
          const vy = sin(angle) * BULLET_SPEED * 0.6;
          shots.push(new Bullet(this.x, this.y, vx, vy, true));
        }
        break;
    }
    
    return shots;
  }

  draw() {
    push(); // Speichere den aktuellen Transformationszustand
    
    // Transformiere zum Gegnerzentrum und wende Rotation/Skalierung an
    translate(this.x, this.y);
    rotate(this.rotation);
    scale(this.scale);
    
    // Wähle das aktuelle Animationsframe
    const sprite = this.sprites[this.animationFrame];
    
    // Zeichne den Gegner mit der Farbpalette
    noStroke();
    const halfWidth = (sprite[0].length * this.pixelSize) / 2;
    const halfHeight = (sprite.length * this.pixelSize) / 2;
    
    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        const colorIndex = sprite[r][c];
        if (colorIndex > 0) { // Nur zeichnen, wenn nicht transparent
          const color = this.colorPalette[colorIndex];
          
          // Treffer-Effekt: Weißes Aufblitzen
          if (this.hitEffect > 0) {
            // Direkte Berechnung der Mischfarbe zwischen der Originalfarbe und Weiß
            const r = color[0] + (255 - color[0]) * this.hitEffect;
            const g = color[1] + (255 - color[1]) * this.hitEffect;
            const b = color[2] + (255 - color[2]) * this.hitEffect;
            const a = color[3];
            fill(r, g, b, a);
          } else {
            fill(color[0], color[1], color[2], color[3]);
          }
          
          rect(
            c * this.pixelSize - halfWidth, 
            r * this.pixelSize - halfHeight, 
            this.pixelSize, this.pixelSize
          );
        }
      }
    }
    
    // Spezielle Effekte für verschiedene Gegnertypen
    if (this.type === 2) {
      // Energiefeld für Typ 2
      noFill();
      stroke(this.colorPalette[1][0], this.colorPalette[1][1], this.colorPalette[1][2], 50 + 30 * sin(frameCount * 0.1));
      strokeWeight(2);
      ellipse(0, 0, this.width * 1.2);
    } else if (this.type === 3) {
      // Zielvisier für Typ 3
      if (player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = atan2(dy, dx);
        
        stroke(this.colorPalette[3][0], this.colorPalette[3][1], this.colorPalette[3][2], 100);
        strokeWeight(1);
        line(0, 0, cos(angle) * this.width, sin(angle) * this.width);
        
        noFill();
        stroke(this.colorPalette[3][0], this.colorPalette[3][1], this.colorPalette[3][2], 50 + 30 * sin(frameCount * 0.2));
        ellipse(cos(angle) * this.width, sin(angle) * this.width, 5, 5);
      }
    } else if (this.type === "boss") {
      // Energieschild für Boss
      noFill();
      for (let i = 0; i < 3; i++) {
        const pulseSize = 1 + 0.1 * sin(frameCount * 0.05 + i);
        stroke(
          this.colorPalette[i+1][0], 
          this.colorPalette[i+1][1], 
          this.colorPalette[i+1][2], 
          30 + 20 * sin(frameCount * 0.1 + i)
        );
        strokeWeight(1 + i);
        ellipse(0, 0, this.width * (1.1 + i * 0.1) * pulseSize);
      }
      
      // Gesundheitsanzeige
      const healthPercent = this.health / 15; // 15 ist die maximale Gesundheit
      const barWidth = this.width * 1.2;
      const barHeight = 5;
      
      // Hintergrund der Gesundheitsanzeige
      fill(50, 50, 50, 150);
      rect(-barWidth/2, -this.height/2 - 15, barWidth, barHeight);
      
      // Vordergrund der Gesundheitsanzeige (basierend auf verbleibender Gesundheit)
      if (healthPercent > 0.6) {
        fill(0, 255, 0, 200); // Grün
      } else if (healthPercent > 0.3) {
        fill(255, 255, 0, 200); // Gelb
      } else {
        fill(255, 0, 0, 200); // Rot
      }
      rect(-barWidth/2, -this.height/2 - 15, barWidth * healthPercent, barHeight);
    }
    
    pop(); // Stelle den ursprünglichen Transformationszustand wieder her
  }
}

// PowerUp class: represents a falling power-up that the player can collect
class PowerUp {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vy = 1.5;  // falling speed
    this.vx = 0;    // horizontale Geschwindigkeit für Schweben
    this.angle = 0; // Rotation
    this.scale = 1; // Pulsieren
    this.glowIntensity = 0; // Glüheffekt
    
    // Animation und Effekte
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.particleTimer = 0;
    
    // Define sprite and color based on power-up type
    this.pixelSize = 3;
    
    if (type === "shield") {
      // Shield power-up: Schild-Symbol
      this.sprites = [
        [
          [0,0,1,1,1,0,0],
          [0,1,2,2,2,1,0],
          [1,2,0,0,0,2,1],
          [1,2,0,0,0,2,1],
          [1,2,0,0,0,2,1],
          [0,1,2,2,2,1,0],
          [0,0,1,1,1,0,0]
        ],
        [
          [0,0,1,1,1,0,0],
          [0,1,2,2,2,1,0],
          [1,2,0,0,0,2,1],
          [1,2,0,3,0,2,1],
          [1,2,0,0,0,2,1],
          [0,1,2,2,2,1,0],
          [0,0,1,1,1,0,0]
        ]
      ];
      
      // Farbpalette für Schild-Power-Up
      this.colorPalette = [
        [0, 0, 0, 0],         // 0: Transparent
        [0, 150, 255, 200],   // 1: Hellblau (Außen)
        [0, 200, 255, 230],   // 2: Mittelblau
        [200, 240, 255, 255]  // 3: Weiß-Blau (Kern)
      ];
      
      // Partikelfarbe für Schild
      this.particleColor = [0, 200, 255];
      
    } else if (type === "rapid") {
      // Rapid-fire power-up: Blitz-Symbol
      this.sprites = [
        [
          [0,0,0,1,0,0,0],
          [0,0,1,2,1,0,0],
          [0,1,2,3,0,0,0],
          [1,2,3,2,1,0,0],
          [0,0,1,2,3,1,0],
          [0,0,0,1,2,1,0],
          [0,0,0,0,1,0,0]
        ],
        [
          [0,0,0,1,0,0,0],
          [0,0,1,2,1,0,0],
          [0,1,2,3,0,0,0],
          [1,3,2,1,0,0,0],
          [0,0,1,2,3,1,0],
          [0,0,0,1,2,1,0],
          [0,0,0,0,1,0,0]
        ]
      ];
      
      // Farbpalette für Rapid-Fire-Power-Up
      this.colorPalette = [
        [0, 0, 0, 0],         // 0: Transparent
        [255, 200, 0, 200],   // 1: Hellgelb (Außen)
        [255, 255, 0, 230],   // 2: Gelb
        [255, 255, 200, 255]  // 3: Weiß-Gelb (Kern)
      ];
      
      // Partikelfarbe für Rapid Fire
      this.particleColor = [255, 255, 0];
      
    } else {
      // Default appearance for any other power-up types
      this.sprites = [
        [
          [0,0,1,1,1,0,0],
          [0,1,2,2,2,1,0],
          [1,2,3,3,3,2,1],
          [1,2,3,3,3,2,1],
          [1,2,3,3,3,2,1],
          [0,1,2,2,2,1,0],
          [0,0,1,1,1,0,0]
        ],
        [
          [0,0,1,1,1,0,0],
          [0,1,2,2,2,1,0],
          [1,2,3,3,3,2,1],
          [1,2,3,0,3,2,1],
          [1,2,3,3,3,2,1],
          [0,1,2,2,2,1,0],
          [0,0,1,1,1,0,0]
        ]
      ];
      
      // Farbpalette für Standard-Power-Up
      this.colorPalette = [
        [0, 0, 0, 0],         // 0: Transparent
        [200, 200, 200, 200], // 1: Hellgrau (Außen)
        [230, 230, 230, 230], // 2: Mittelgrau
        [255, 255, 255, 255]  // 3: Weiß (Kern)
      ];
      
      // Partikelfarbe für Standard
      this.particleColor = [255, 255, 255];
    }
    
    // Calculate dimensions for collision detection
    this.width = this.sprites[0][0].length * this.pixelSize;
    this.height = this.sprites[0].length * this.pixelSize;
    
    // Spezielle Effekte beim Spawnen
    if (particles.length < MAX_PARTICLES - 10) {
      for (let i = 0; i < 10; i++) {
        const angle = random(TWO_PI);
        const speed = random(0.5, 2);
        const vx = cos(angle) * speed;
        const vy = sin(angle) * speed;
        particles.push(new Particle(
          this.x, this.y, vx, vy,
          [this.particleColor[0], this.particleColor[1], this.particleColor[2], random(150, 200)],
          random(20, 40), random(1, 3)
        ));
      }
    }
  }

  update() {
    // Fall down with slight horizontal movement (floating effect)
    this.y += this.vy;
    this.vx = 0.3 * sin(frameCount * 0.05);
    this.x += this.vx;
    
    // Rotation
    this.angle = sin(frameCount * 0.03) * 0.2;
    
    // Pulsieren
    this.scale = 1 + 0.1 * sin(frameCount * 0.1);
    
    // Glüheffekt
    this.glowIntensity = 0.5 + 0.5 * sin(frameCount * 0.1);
    
    // Animation aktualisieren
    this.animationTimer++;
    if (this.animationTimer >= 15) { // Langsamer als Projektile
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % this.sprites.length;
    }
    
    // Partikeleffekte während der Bewegung
    this.particleTimer++;
    if (this.particleTimer >= 10) { // Alle 10 Frames
      this.particleTimer = 0;
      
      if (particles.length < MAX_PARTICLES && random() < 0.3) {
        const angle = random(TWO_PI);
        const speed = random(0.2, 0.8);
        const vx = cos(angle) * speed;
        const vy = sin(angle) * speed + 0.5; // Leicht nach unten tendierend
        
        particles.push(new Particle(
          this.x + random(-this.width/4, this.width/4), 
          this.y + random(-this.height/4, this.height/4), 
          vx, vy,
          [this.particleColor[0], this.particleColor[1], this.particleColor[2], random(50, 100)],
          random(10, 20), random(1, 2)
        ));
      }
    }
  }

  draw() {
    push(); // Speichere den aktuellen Transformationszustand
    
    // Transformiere zum Power-Up-Zentrum und wende Rotation/Skalierung an
    translate(this.x, this.y);
    rotate(this.angle);
    scale(this.scale);
    
    // Wähle das aktuelle Animationsframe
    const sprite = this.sprites[this.animationFrame];
    
    // Zeichne das Power-Up mit der Farbpalette
    noStroke();
    const halfWidth = (sprite[0].length * this.pixelSize) / 2;
    const halfHeight = (sprite.length * this.pixelSize) / 2;
    
    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        const colorIndex = sprite[r][c];
        if (colorIndex > 0) { // Nur zeichnen, wenn nicht transparent
          const color = this.colorPalette[colorIndex];
          fill(color[0], color[1], color[2], color[3]);
          rect(
            c * this.pixelSize - halfWidth, 
            r * this.pixelSize - halfHeight, 
            this.pixelSize, this.pixelSize
          );
        }
      }
    }
    
    // Glüheffekt um das Power-Up
    noFill();
    for (let i = 0; i < 2; i++) {
      const glowSize = (1.2 + i * 0.2) * this.glowIntensity;
      const alpha = (150 - i * 50) * this.glowIntensity;
      stroke(
        this.particleColor[0], 
        this.particleColor[1], 
        this.particleColor[2], 
        alpha
      );
      strokeWeight(1 + i);
      ellipse(0, 0, this.width * glowSize, this.height * glowSize);
    }
    
    pop(); // Stelle den ursprünglichen Transformationszustand wieder her
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

// Setup function (runs once at start)
function setup() {
  // Debug-Ausgabe
  console.log('SETUP FUNCTION CALLED');
  
  // Lademeldung entfernen
  const loadingMessage = document.getElementById('loadingMessage');
  if (loadingMessage) {
    console.log('Entferne Lademeldung aus setup()');
    loadingMessage.style.display = 'none';
  }
  
  // Canvas erstellen und im gameContainer platzieren
  const canvas = createCanvas(400, 600);
  canvas.parent('gameContainer');
  noSmooth();                // disable antialiasing to maintain pixelated graphics
  textFont('monospace');
  textSize(16);
  
  console.log('Game setup started');
  
  // Initialize game entities
  resetGame();               // custom function to initialize/restart the game
  
  // Initialisiere Sterne für den Hintergrund
  initStars();
  
  // Initialisiere Supabase und lade die Highscores
  try {
    if (typeof window.SupabaseService !== 'undefined') {
      console.log('Supabase-Service gefunden, initialisiere...');
      
      // Wir verwenden eine Timeout-Funktion, um sicherzustellen, dass der Rest des Spiels
      // auch dann funktioniert, wenn Supabase nicht verfügbar ist
      setTimeout(() => {
        window.SupabaseService.initialize()
          .then(result => {
            if (result) {
              console.log('Supabase erfolgreich initialisiert, lade Highscores...');
              fetchGlobalHighScores();
            } else {
              console.log('Supabase-Initialisierung fehlgeschlagen');
              onlineLeaderboardStatus = "Supabase-Initialisierung fehlgeschlagen";
            }
          })
          .catch(error => {
            console.error('Fehler bei der Supabase-Initialisierung:', error);
            onlineLeaderboardStatus = "Fehler: " + (error.message || "Unbekannter Fehler");
          });
      }, 1000);
    } else {
      console.error('Supabase-Service nicht gefunden');
      onlineLeaderboardStatus = "Supabase-Service nicht verfügbar";
    }
  } catch (error) {
    console.error('Fehler beim Zugriff auf Supabase-Service:', error);
    onlineLeaderboardStatus = "Fehler beim Zugriff auf Supabase";
    // Spiel läuft trotzdem weiter
  }
}

// Funktion zum Abrufen der globalen Highscores
function fetchGlobalHighScores() {
  console.log('Rufe globale Highscores ab...');
  onlineLeaderboardStatus = "Lade Online-Bestenliste...";
  
  try {
    if (typeof window.SupabaseService === 'undefined') {
      console.error('Supabase-Service nicht verfügbar');
      onlineLeaderboardStatus = "Supabase-Service nicht verfügbar";
      return;
    }
    
    window.SupabaseService.fetchHighScores(50) // Erhöhe das Limit auf 50 Einträge
      .then(result => {
        if (result.error) {
          throw result.error;
        }
          
        if (result.data && result.data.length > 0) {
          globalHighScores = result.data;
          console.log('Globale Highscores geladen:', globalHighScores);
          onlineLeaderboardStatus = "";
          
          // Berechne die maximale Scroll-Position basierend auf der Anzahl der Einträge
          // Verwende die neue Höhe des sichtbaren Bereichs
          const visibleAreaHeight = height * 2/3;
          maxLeaderboardScroll = Math.max(0, (globalHighScores.length * 30) - visibleAreaHeight + 40);
        } else {
          console.log('Keine globalen Highscores gefunden');
          onlineLeaderboardStatus = "Keine Online-Scores gefunden";
        }
      })
      .catch(error => {
        console.error('Fehler beim Abrufen der Highscores:', error);
        onlineLeaderboardStatus = "Fehler: " + (error.message || "Unbekannter Fehler");
      });
  } catch (error) {
    console.error('Fehler beim Zugriff auf Supabase-Service:', error);
    onlineLeaderboardStatus = "Fehler beim Zugriff auf Supabase";
  }
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
  particles = [];
  score = 0;
  level = 1;
  gameState = "PLAY";
  
  // Initialisiere den Sternenhintergrund
  initStars();
  
  // Setze den Tooltip zurück
  showControlsTooltip = true;
  tooltipAlpha = 255;
  tooltipFadeTimer = 0;
  
  // Load high score list from local storage or initialize a blank list
  let stored = window.localStorage.getItem('highScores');
  if (stored) {
    highScores = JSON.parse(stored);
  } else {
    highScores = [0, 0, 0, 0, 0];  // top 5 scores
  }
  
  // Lade die globalen Highscores, wenn Supabase verfügbar ist
  if (window.SupabaseService) {
      fetchGlobalHighScores();
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
    let numEnemies = Math.min(lvl + 4, MAX_ENEMIES - enemies.length);  // Begrenze die Anzahl der Gegner
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
  // Speichermanagement: Regelmäßige Bereinigung
  framesSinceLastCleanup++;
  if (framesSinceLastCleanup >= CLEANUP_INTERVAL) {
    cleanupGameObjects();
    framesSinceLastCleanup = 0;
  }
  
  // Aktualisiere den Verbindungsstatus
  if (frameCount % 60 === 0) { // Einmal pro Sekunde aktualisieren
    displayConnectionStatus();
  }
  
  // Clear the canvas with black background
  background(0);
  
  // Zeichne den Sternenhintergrund
  drawStars();
  
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
      let newBullets = player.shoot();
      if (newBullets && bullets.length < MAX_BULLETS) {
        bullets.push(...newBullets);
      }
    }

    // ** Update Entities **
    player.update();
    
    // Begrenze die Anzahl der Gegner
    if (enemies.length > MAX_ENEMIES) {
      enemies = enemies.slice(0, MAX_ENEMIES);
    }
    
    // Update enemies and possibly trigger enemy shooting
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      let e = enemies[ei];
      e.update();
      
      // If enemy can shoot, decide if it fires this frame
      if (e.canShoot) {
        if (e.type === "boss") {
          // Boss: Verwende die neue Methode für Boss-Schussmuster
          const bossShots = e.getBossShots();
          if (bossShots.length > 0 && bullets.length < MAX_BULLETS - bossShots.length) {
            bullets.push(...bossShots);
          }
        } else if (e.type === 3) {
          // Type 3 shooter enemy: random chance to shoot, increased slightly with level
          if (random(1) < e.shootChance * level && bullets.length < MAX_BULLETS) {
            bullets.push(new Bullet(e.x, e.y + e.height/2, 0, BULLET_SPEED, true));
          }
        }
      }
      
      // Remove enemies that move off screen (escaped) to keep things clean
      if (e.y > height + e.height) {
        enemies.splice(ei, 1);
      }
    }
    
    // Begrenze die Anzahl der Kugeln
    if (bullets.length > MAX_BULLETS) {
      bullets = bullets.slice(0, MAX_BULLETS);
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
    
    // Begrenze die Anzahl der Power-Ups
    if (powerUps.length > MAX_POWERUPS) {
      powerUps = powerUps.slice(0, MAX_POWERUPS);
    }
    
    // Update power-ups
    for (let pi = powerUps.length - 1; pi >= 0; pi--) {
      let p = powerUps[pi];
      p.update();
      if (p.offScreen()) {
        powerUps.splice(pi, 1);
      }
    }
    
    // Update particles
    for (let pi = particles.length - 1; pi >= 0; pi--) {
      let p = particles[pi];
      p.update();
      if (p.isDead()) {
        particles.splice(pi, 1);
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
            
            // Verwende die neue hit-Methode, die Treffer-Effekte erzeugt
            const destroyed = e.hit();
            
            if (destroyed) {
              // Enemy is destroyed
              score += 100;  // add points
              
              // Explosion beim Zerstören
              if (particles.length < MAX_PARTICLES - 20) {
                const baseColor = e.colorPalette[2]; // Mittlere Farbe für Partikel
                for (let i = 0; i < 20; i++) {
                  const angle = random(TWO_PI);
                  const speed = random(1, 4);
                  const vx = cos(angle) * speed;
                  const vy = sin(angle) * speed;
                  particles.push(new Particle(
                    e.x, e.y, vx, vy,
                    [baseColor[0], baseColor[1], baseColor[2], random(150, 200)],
                    random(20, 40), random(1, 3)
                  ));
                }
              }
              
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
          
          // Partikeleffekt beim Treffer
          if (particles.length < MAX_PARTICLES - 10) {
            for (let i = 0; i < 10; i++) {
              const angle = random(TWO_PI);
              const speed = random(1, 3);
              const vx = cos(angle) * speed;
              const vy = sin(angle) * speed;
              particles.push(new Particle(
                player.x, player.y, vx, vy,
                [255, 255, 255, random(150, 200)],
                random(10, 20), random(1, 2)
              ));
            }
          }
          
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
        
        // Explosion beim Zerstören des Gegners
        if (particles.length < MAX_PARTICLES - 20) {
          const baseColor = e.colorPalette[2]; // Mittlere Farbe für Partikel
          for (let i = 0; i < 20; i++) {
            const angle = random(TWO_PI);
            const speed = random(1, 4);
            const vx = cos(angle) * speed;
            const vy = sin(angle) * speed;
            particles.push(new Particle(
              e.x, e.y, vx, vy,
              [baseColor[0], baseColor[1], baseColor[2], random(150, 200)],
              random(20, 40), random(1, 3)
            ));
          }
        }
        
        if (player.shieldActive) {
          player.shieldActive = false;
        } else {
          player.lives -= 1;
          
          // Partikeleffekt beim Treffer des Spielers
          if (particles.length < MAX_PARTICLES - 10) {
            for (let i = 0; i < 10; i++) {
              const angle = random(TWO_PI);
              const speed = random(1, 3);
              const vx = cos(angle) * speed;
              const vy = sin(angle) * speed;
              particles.push(new Particle(
                player.x, player.y, vx, vy,
                [255, 255, 255, random(150, 200)],
                random(10, 20), random(1, 2)
              ));
            }
          }
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
      
      // Level-Up-Effekt
      if (particles.length < MAX_PARTICLES - 30) {
        for (let i = 0; i < 30; i++) {
          const angle = random(TWO_PI);
          const speed = random(2, 5);
          const vx = cos(angle) * speed;
          const vy = sin(angle) * speed;
          const colorChoice = random([
            [255, 255, 0, random(150, 200)],  // Gelb
            [0, 255, 255, random(150, 200)],  // Cyan
            [255, 0, 255, random(150, 200)]   // Magenta
          ]);
          particles.push(new Particle(
            width/2, height/2, vx, vy,
            colorChoice, random(30, 60), random(2, 4)
          ));
        }
      }
    }

    // ** Drawing: render all game elements **
    // Zeichne zuerst die Partikel im Hintergrund
    for (let p of particles) {
      p.draw();
    }
    
    // Dann die Power-Ups
    for (let p of powerUps) {
      p.draw();
    }
    
    // Dann die Projektile
    for (let b of bullets) {
      b.draw();
    }
    
    // Dann die Gegner
    for (let e of enemies) {
      e.draw();
    }
    
    // Zuletzt den Spieler (damit er immer im Vordergrund ist)
    player.draw();

    // ** UI Overlay (score, lives, level, power-up status) **
    fill(255);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 10, 10);
    text(`Lives: ${player.lives}`, 10, 30);
    text(`Level: ${level}`, 10, 50);
    
    // Power-up indicators
    if (player.shieldActive) {
      fill(0, 200, 255);
      text("Shield ON", 10, 70);
    }
    if (player.rapidFireActive) {
      fill(255, 255, 0);
      text("Rapid Fire ON", 10, 90);
    }

    // Zeichne den Controls-Tooltip
    drawControlsTooltip();

  } else if (gameState === "GAMEOVER") {
    // Nur den Hintergrund zeichnen, der Rest wird vom Formular übernommen
    background(0);
  } else if (gameState === "LEADERBOARD") {
    // Statische Elemente des Leaderboards zeichnen
    // Hintergrund verdunkeln
    background(0, 0, 0, 200);
    
    // Leaderboard-Titel
    fill(255);
    textAlign(CENTER);
    textSize(24);
    text("LEADERBOARD", width / 2, height / 6 - 20); // Titel weiter nach oben verschieben
    
    // Wenn wir Daten haben, zeige sie an
    if (globalHighScores && globalHighScores.length > 0) {
      // Tabellenkopf
      textSize(16);
      textAlign(LEFT);
      fill(200, 200, 200);
      text("RANG", width / 4 - 40, height / 6 + 10); // Tabellenkopf weiter nach oben verschieben
      text("NAME", width / 4 + 20, height / 6 + 10);
      text("PUNKTE", width * 3 / 4 - 40, height / 6 + 10);
      
      // Trennlinie
      stroke(100, 100, 100);
      line(width / 4 - 60, height / 6 + 20, width * 3 / 4 + 40, height / 6 + 20);
      noStroke();
      
      // Definiere den sichtbaren Bereich für die Einträge - größer machen
      const visibleAreaY = height / 6 + 30; // Weiter nach oben verschieben
      const visibleAreaHeight = height * 2/3; // Höher machen
      
      // Einträge anzeigen mit Clipping
      push(); // Speichere den aktuellen Zustand
      
      
      // Anstatt clip() zu verwenden, zeichnen wir nur Einträge, die im sichtbaren Bereich sind
      
      // Einträge anzeigen
      textAlign(LEFT);
      for (let i = 0; i < globalHighScores.length; i++) {
        const entry = globalHighScores[i];
        const y = visibleAreaY + 20 + i * 30 - leaderboardScrollY;
        
        // Nur zeichnen, wenn im sichtbaren Bereich
        if (y > visibleAreaY - 30 && y < visibleAreaY + visibleAreaHeight + 30) {
          // Hintergrund für abwechselnde Zeilen
          if (i % 2 === 0) {
            fill(30, 30, 30, 150);
            rect(width / 4 - 60, y - 15, width / 2 + 100, 25, 5);
          }
          
          // Hervorhebung für den aktuellen Spieler
          const playerName = window.localStorage.getItem('playerName') || 'Anonymous';
          if (entry.player_name === playerName) {
            fill(60, 60, 120, 150);
            rect(width / 4 - 60, y - 15, width / 2 + 100, 25, 5);
          }
          
          // Rang
          fill(255, 215, 0); // Gold
          text(`#${i + 1}`, width / 4 - 40, y);
          
          // Name
          fill(255);
          text(entry.player_name, width / 4 + 20, y);
          
          // Punkte
          fill(0, 255, 0);
          text(entry.score, width * 3 / 4 - 40, y);
        }
      }
      
      pop(); // Stelle den vorherigen Zustand wieder her
      
      // Zeichne einen Rahmen um den sichtbaren Bereich
      noFill();
      stroke(100, 100, 100);
      rect(width / 4 - 60, visibleAreaY, width / 2 + 100, visibleAreaHeight, 5);
      noStroke();
      
      // Zeichne die Scrollbar
      const scrollbarHeight = Math.min(visibleAreaHeight, (visibleAreaHeight * visibleAreaHeight) / (globalHighScores.length * 30));
      const scrollbarY = visibleAreaY + (leaderboardScrollY / maxLeaderboardScroll) * (visibleAreaHeight - scrollbarHeight);
      
      // Scrollbar-Hintergrund
      fill(50, 50, 50, 100);
      rect(width * 3 / 4 + 50, visibleAreaY, 10, visibleAreaHeight, 5);
      
      // Scrollbar-Griff
      fill(200, 200, 200, 150);
      rect(width * 3 / 4 + 50, scrollbarY, 10, scrollbarHeight, 5);
      
      // Scrollhinweis - nach unten verschieben
      fill(200, 200, 200);
      textAlign(CENTER);
      textSize(12);
      text("Scrolle mit Mausrad oder ziehe", width / 2, height - 30);
    } else {
      // Keine Daten gefunden
      textSize(16);
      text("Keine Daten verfügbar", width / 2, height / 2);
    }
    
    // Hinweis zum Zurückkehren - nach unten verschieben
    fill(200, 200, 200);
    textAlign(CENTER);
    textSize(14);
    text("Drücke ESC zum Zurückkehren", width / 2, height - 10);
    
    // Aktualisiere das Leaderboard alle 5 Sekunden
    if (frameCount % 300 === 0) {
      fetchLeaderboard();
    }
  }
}

// Handle key pressed events (for one-time actions)
function keyPressed() {
  // Wenn der Tooltip ausgeblendet wurde, zeige ihn wieder an, wenn eine Taste gedrückt wird
  if (!showControlsTooltip) {
    showControlsTooltip = true;
    tooltipAlpha = 255;
    tooltipFadeTimer = 0;
  }
  
  // If game over, pressing Enter will restart the game
  if (gameState === "GAMEOVER" && keyCode === ENTER) {
    removeGameOverForm(); // Entferne das Formular, falls vorhanden
    resetGame();
  }
  
  // Taste 'T' zum Testen der Supabase-Verbindung
  if (key === 't' || key === 'T') {
    console.log('Manueller Verbindungstest angefordert');
    
    if (window.SupabaseService) {
      window.SupabaseService.initialize()
        .then(initialized => {
          if (initialized) {
            console.log('Supabase-Verbindung erfolgreich');
            fetchGlobalHighScores();
          } else {
            console.error('Supabase-Initialisierung fehlgeschlagen');
          }
        })
        .catch(error => {
          console.error('Fehler bei der Supabase-Initialisierung:', error);
        });
    } else {
      console.error('Supabase-Service nicht verfügbar');
    }
  }
  
  // Leaderboard mit 'L' anzeigen
  if (key === 'l' || key === 'L') {
    if (gameState === "PLAY") {
      gameState = "LEADERBOARD";
      fetchLeaderboard(); // Nur Daten laden, kein direktes Zeichnen mehr
    }
  }
  
  // ESC-Taste zum Zurückkehren vom Leaderboard
  if (keyCode === ESCAPE) {
    if (gameState === "LEADERBOARD") {
      gameState = "PLAY";
      // Stelle sicher, dass das Spiel korrekt fortgesetzt wird
      loop();
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
  
  // Erstelle Formular für Name und E-Mail
  createGameOverForm();
  
  // Save score to Supabase database
  if (window.SupabaseService) {
    const playerName = window.localStorage.getItem('playerName') || 'Anonymous';
    
    onlineLeaderboardStatus = "Speichere Punktzahl...";
    console.log('Speichere Punktzahl in Supabase:', score, 'level:', level);
    
    // Initialisiere Supabase, falls noch nicht geschehen
    window.SupabaseService.initialize()
      .then(initialized => {
        if (initialized) {
          // Speichere den Highscore
          return window.SupabaseService.saveHighScore(playerName, score, level);
        } else {
          throw new Error('Supabase konnte nicht initialisiert werden');
        }
      })
      .then(result => {
        if (result.error) {
          throw result.error;
        }
        
        console.log('Punktzahl in Datenbank gespeichert', result);
        onlineLeaderboardStatus = "Punktzahl gespeichert!";
        
        // Nach dem Speichern die globalen Top-Scores abrufen
        setTimeout(fetchGlobalHighScores, 1000);
      })
      .catch(error => {
        console.error('Fehler beim Speichern der Punktzahl:', error);
        onlineLeaderboardStatus = "Fehler beim Speichern: " + (error.message || "Unbekannter Fehler");
        
        // Trotzdem versuchen, die globalen Highscores zu laden
            setTimeout(fetchGlobalHighScores, 1000);
      });
        } else {
    onlineLeaderboardStatus = "Offline-Modus: Punktzahl nur lokal gespeichert";
  }
}

// Neue Funktion zum Erstellen des Formulars
function createGameOverForm() {
  // Entferne vorhandenes Formular, falls vorhanden
  removeGameOverForm();
  
  // Weltraum-Farbpalette
  const spaceColors = {
    background: '#0A0E17',        // Dunkles Weltraum-Blau
    accent1: '#3A1E7C',           // Dunkles Violett
    accent2: '#1E3A7C',           // Dunkles Blau
    highlight: '#4F8BFF',         // Helles Blau für Highlights
    text: '#E6F0FF',              // Helles Blau-Weiß für Text
    success: '#50EEBB',           // Türkis für Erfolge/Scores
    warning: '#FF5A5A',           // Rot für Warnungen/Game Over
    border: '#2A3A66',            // Blauer Rahmen
    buttonHover: '#2A4A8F'        // Hover-Farbe für Buttons
  };
  
  // Erstelle einen Container für das Formular
  const formContainer = createDiv();
  formContainer.id('formContainer');
  formContainer.style('background-color', spaceColors.background);
  formContainer.style('border-radius', '8px');
  formContainer.style('padding', '20px');
  formContainer.style('width', '300px');
  formContainer.style('position', 'absolute');
  formContainer.style('left', `${width/2 - 150}px`);
  formContainer.style('top', '20px'); // Höher positionieren
  formContainer.style('z-index', '100');
  formContainer.style('box-shadow', `0 0 20px ${spaceColors.accent1}80, 0 0 40px rgba(0, 0, 0, 0.8)`);
  formContainer.style('max-height', '560px'); // Maximale Höhe begrenzen
  formContainer.style('overflow-y', 'auto'); // Scrollbar hinzufügen, falls nötig
  formContainer.style('border', `1px solid ${spaceColors.border}`);
  formContainer.parent('gameContainer');
  
  // GAME OVER Titel mit Weltraum-Effekt
  const gameOverTitle = createP('GAME OVER');
  gameOverTitle.style('color', spaceColors.warning);
  gameOverTitle.style('text-align', 'center');
  gameOverTitle.style('margin', '0 0 10px 0');
  gameOverTitle.style('font-weight', 'bold');
  gameOverTitle.style('font-size', '36px');
  gameOverTitle.style('font-family', 'Arial, sans-serif');
  gameOverTitle.style('letter-spacing', '3px');
  gameOverTitle.style('text-shadow', `0 0 10px ${spaceColors.warning}80, 0 0 20px ${spaceColors.warning}40`);
  gameOverTitle.parent(formContainer);
  
  // Score anzeigen
  const scoreDisplay = createP(`FINAL SCORE: <span style="color: ${spaceColors.success};">${score}</span>`);
  scoreDisplay.style('color', spaceColors.text);
  scoreDisplay.style('text-align', 'center');
  scoreDisplay.style('margin', '0 0 15px 0');
  scoreDisplay.style('font-size', '18px');
  scoreDisplay.style('font-family', 'Arial, sans-serif');
  scoreDisplay.style('text-shadow', `0 0 5px ${spaceColors.highlight}60`);
  scoreDisplay.parent(formContainer);
  
  // Erstelle Eingabefelder
  playerNameInput = createInput(window.localStorage.getItem('playerName') || '');
  playerNameInput.attribute('placeholder', 'Enter your name');
  playerNameInput.style('width', '100%');
  playerNameInput.style('padding', '10px');
  playerNameInput.style('margin-bottom', '10px');
  playerNameInput.style('border-radius', '5px');
  playerNameInput.style('border', `1px solid ${spaceColors.border}`);
  playerNameInput.style('background-color', spaceColors.background);
  playerNameInput.style('color', spaceColors.text);
  playerNameInput.style('box-sizing', 'border-box');
  playerNameInput.style('font-family', 'Arial, sans-serif');
  playerNameInput.parent(formContainer);
  
  // Submit Button
  submitButton = createButton('SUBMIT SCORE');
  submitButton.style('width', '100%');
  submitButton.style('padding', '12px');
  submitButton.style('background-color', spaceColors.accent1);
  submitButton.style('color', spaceColors.text);
  submitButton.style('border', 'none');
  submitButton.style('border-radius', '5px');
  submitButton.style('cursor', 'pointer');
  submitButton.style('font-weight', 'bold');
  submitButton.style('font-family', 'Arial, sans-serif');
  submitButton.style('letter-spacing', '1px');
  submitButton.style('margin-bottom', '15px');
  submitButton.mouseOver(() => {
    submitButton.style('background-color', spaceColors.buttonHover);
    submitButton.style('box-shadow', `0 0 10px ${spaceColors.accent1}80`);
  });
  submitButton.mouseOut(() => {
    submitButton.style('background-color', spaceColors.accent1);
    submitButton.style('box-shadow', 'none');
  });
  submitButton.parent(formContainer);
  
  // Highscores Titel
  const highscoresTitle = createP('✨ TOP SCORES ✨');
  highscoresTitle.style('color', spaceColors.highlight);
  highscoresTitle.style('text-align', 'center');
  highscoresTitle.style('margin', '5px 0');
  highscoresTitle.style('font-weight', 'bold');
  highscoresTitle.style('font-size', '18px');
  highscoresTitle.style('font-family', 'Arial, sans-serif');
  highscoresTitle.style('text-shadow', `0 0 5px ${spaceColors.highlight}60`);
  highscoresTitle.parent(formContainer);
  
  // Highscores Liste
  const scoresList = createDiv();
  scoresList.style('width', '100%');
  scoresList.style('margin-bottom', '10px');
  scoresList.parent(formContainer);
  
  // Top 3 Scores anzeigen (Beispieldaten, falls keine echten Daten vorhanden)
  const dummyScores = [
    { player_name: "ACE", score: 2500 },
    { player_name: "BOS", score: 2100 },
    { player_name: "CAT", score: 1800 }
  ];
  
  const topScores = globalHighScores.length > 0 ? 
    [...globalHighScores].sort((a, b) => b.score - a.score).slice(0, 3) : 
    dummyScores;
  
  for (let i = 0; i < topScores.length; i++) {
    const entry = topScores[i];
    const playerName = entry.player_name || "Anonym";
    const scoreValue = entry.score || 0;
    
    const scoreEntry = createDiv();
    scoreEntry.style('display', 'flex');
    scoreEntry.style('justify-content', 'space-between');
    scoreEntry.style('padding', '8px');
    scoreEntry.style('margin-bottom', '4px');
    scoreEntry.style('border-radius', '5px');
    scoreEntry.style('background-color', `${spaceColors.accent2}80`);
    scoreEntry.style('border', `1px solid ${spaceColors.border}`);
    scoreEntry.style('box-shadow', `0 0 5px ${spaceColors.accent2}40`);
    scoreEntry.parent(scoresList);
    
    const rankName = createP(`#${i+1} ${playerName}`);
    rankName.style('margin', '0');
    rankName.style('color', spaceColors.text);
    rankName.style('font-family', 'Arial, sans-serif');
    rankName.style('font-weight', 'bold');
    rankName.parent(scoreEntry);
    
    const scoreText = createP(`${scoreValue}`);
    scoreText.style('margin', '0');
    scoreText.style('color', spaceColors.success);
    scoreText.style('font-family', 'Arial, sans-serif');
    scoreText.style('font-weight', 'bold');
    scoreText.parent(scoreEntry);
  }
  
  // Deine Position
  const positionTitle = createP('YOUR POSITION');
  positionTitle.style('color', spaceColors.text);
  positionTitle.style('text-align', 'center');
  positionTitle.style('margin', '5px 0');
  positionTitle.style('font-family', 'Arial, sans-serif');
  positionTitle.parent(formContainer);
  
  const yourPosition = createDiv();
  yourPosition.style('display', 'flex');
  yourPosition.style('justify-content', 'space-between');
  yourPosition.style('padding', '8px');
  yourPosition.style('margin-bottom', '15px');
  yourPosition.style('border-radius', '5px');
  yourPosition.style('background-color', `${spaceColors.accent1}80`);
  yourPosition.style('border', `1px solid ${spaceColors.border}`);
  yourPosition.style('box-shadow', `0 0 10px ${spaceColors.accent1}40`);
  yourPosition.parent(formContainer);
  
  const yourRank = createP(`#5 YOU`);
  yourRank.style('margin', '0');
  yourRank.style('color', spaceColors.text);
  yourRank.style('font-family', 'Arial, sans-serif');
  yourRank.style('font-weight', 'bold');
  yourRank.parent(yourPosition);
  
  const yourScore = createP(`${score}`);
  yourScore.style('margin', '0');
  yourScore.style('color', spaceColors.success);
  yourScore.style('font-family', 'Arial, sans-serif');
  yourScore.style('font-weight', 'bold');
  yourScore.parent(yourPosition);
  
  // Play Again Button
  const playAgainButton = createButton('PLAY AGAIN');
  playAgainButton.style('width', '100%');
  playAgainButton.style('padding', '12px');
  playAgainButton.style('background-color', spaceColors.warning);
  playAgainButton.style('color', spaceColors.text);
  playAgainButton.style('border', 'none');
  playAgainButton.style('border-radius', '5px');
  playAgainButton.style('cursor', 'pointer');
  playAgainButton.style('font-weight', 'bold');
  playAgainButton.style('font-family', 'Arial, sans-serif');
  playAgainButton.style('letter-spacing', '1px');
  playAgainButton.style('margin-bottom', '10px');
  playAgainButton.mouseOver(() => {
    playAgainButton.style('background-color', '#FF7070');
    playAgainButton.style('box-shadow', `0 0 10px ${spaceColors.warning}80`);
  });
  playAgainButton.mouseOut(() => {
    playAgainButton.style('background-color', spaceColors.warning);
    playAgainButton.style('box-shadow', 'none');
  });
  playAgainButton.mousePressed(() => {
    removeGameOverForm();
    resetGame();
  });
  playAgainButton.parent(formContainer);
  
  // Leaderboards Button
  const leaderboardsButton = createButton('LEADERBOARDS');
  leaderboardsButton.style('width', '100%');
  leaderboardsButton.style('padding', '12px');
  leaderboardsButton.style('background-color', spaceColors.highlight);
  leaderboardsButton.style('color', spaceColors.background);
  leaderboardsButton.style('border', 'none');
  leaderboardsButton.style('border-radius', '5px');
  leaderboardsButton.style('cursor', 'pointer');
  leaderboardsButton.style('font-weight', 'bold');
  leaderboardsButton.style('font-family', 'Arial, sans-serif');
  leaderboardsButton.style('letter-spacing', '1px');
  leaderboardsButton.style('margin-bottom', '15px');
  leaderboardsButton.mouseOver(() => {
    leaderboardsButton.style('background-color', spaceColors.buttonHover);
    leaderboardsButton.style('box-shadow', `0 0 10px ${spaceColors.highlight}80`);
  });
  leaderboardsButton.mouseOut(() => {
    leaderboardsButton.style('background-color', spaceColors.highlight);
    leaderboardsButton.style('box-shadow', 'none');
  });
  leaderboardsButton.mousePressed(() => {
    removeGameOverForm();
    gameState = "LEADERBOARD";
    fetchLeaderboard(); // Nur Daten laden, kein direktes Zeichnen mehr
  });
  leaderboardsButton.parent(formContainer);
  
  // JOBSUCHE-BEREICH mit Weltraum-Thema (nach unten verschoben)
  const jobContainer = createDiv();
  jobContainer.style('background-color', spaceColors.accent2);
  jobContainer.style('border-radius', '8px');
  jobContainer.style('padding', '15px');
  jobContainer.style('margin-top', '5px');
  jobContainer.style('box-shadow', `0 0 10px ${spaceColors.accent2}80`);
  jobContainer.style('border', `1px solid ${spaceColors.border}`);
  jobContainer.parent(formContainer);
  
  // Jobsuche-Titel
  const jobTitle = createP('🚀 LOOKING FOR GROUP 🚀');
  jobTitle.style('color', spaceColors.text);
  jobTitle.style('text-align', 'center');
  jobTitle.style('margin', '0 0 10px 0');
  jobTitle.style('font-weight', 'bold');
  jobTitle.style('font-size', '16px');
  jobTitle.style('font-family', 'Arial, sans-serif');
  jobTitle.parent(jobContainer);
  
  // Jobsuche-Text
  const jobText = createP('Ich suche eine berufliche Herausforderung! Wenn ihr von spannenden Möglichkeiten hört, freue ich mich über Tipps oder eine Weiterempfehlung');
  jobText.style('color', spaceColors.text);
  jobText.style('text-align', 'center');
  jobText.style('margin', '0 0 10px 0');
  jobText.style('font-size', '14px');
  jobText.style('font-family', 'Arial, sans-serif');
  jobText.parent(jobContainer);
  
  // Jobsuche-Link
  const jobLink = createButton('Kai Hüttenmüller CV');
  jobLink.style('width', '100%');
  jobLink.style('padding', '10px');
  jobLink.style('background-color', spaceColors.highlight);
  jobLink.style('color', spaceColors.background);
  jobLink.style('border', 'none');
  jobLink.style('border-radius', '5px');
  jobLink.style('cursor', 'pointer');
  jobLink.style('font-weight', 'bold');
  jobLink.style('font-family', 'Arial, sans-serif');
  jobLink.style('letter-spacing', '1px');
  jobLink.style('margin-top', '5px');
  jobLink.mouseOver(() => {
    jobLink.style('background-color', spaceColors.buttonHover);
    jobLink.style('transform', 'scale(1.02)');
    jobLink.style('transition', 'all 0.2s ease');
    jobLink.style('box-shadow', `0 0 10px ${spaceColors.highlight}80`);
  });
  jobLink.mouseOut(() => {
    jobLink.style('background-color', spaceColors.highlight);
    jobLink.style('transform', 'scale(1)');
    jobLink.style('box-shadow', 'none');
  });
  jobLink.mousePressed(() => {
    window.open('https://kai.huettenmueller.de/', '_blank');
  });
  jobLink.parent(jobContainer);
  
  // Event-Handler für den Button
  submitButton.mousePressed(submitPlayerInfo);
  
  formSubmitted = false;
}

// Funktion zum Entfernen des Formulars
function removeGameOverForm() {
  const formContainer = select('#formContainer');
  if (formContainer) {
    formContainer.remove();
  }
  
  if (playerNameInput) {
    playerNameInput.remove();
    playerNameInput = null;
  }
  
  if (submitButton) {
    submitButton.remove();
    submitButton = null;
  }
}

// Funktion zum Speichern der Spielerinformationen
function submitPlayerInfo() {
  const name = playerNameInput.value().trim();
  
  if (name) {
    window.localStorage.setItem('playerName', name);
    console.log('Name gespeichert:', name);
    
    // Aktualisiere den Spielernamen in Supabase
    if (window.SupabaseService && window.SupabaseService.isSupabaseInitialized()) {
      window.SupabaseService.saveHighScore(name, score, level)
        .then(result => {
          console.log('Spielerinformationen aktualisiert:', result);
          // Nach dem Speichern die globalen Top-Scores abrufen
          fetchGlobalHighScores();
        })
        .catch(error => {
          console.error('Fehler beim Aktualisieren der Spielerinformationen:', error);
        });
    }
    
    formSubmitted = true;
    
    // Anstatt das Formular zu entfernen, zeigen wir eine Erfolgsmeldung an
    showSuccessMessage();
  }
}

// Neue Funktion zum Anzeigen einer Erfolgsmeldung
function showSuccessMessage() {
  // Entferne Eingabefelder und Submit-Button
  if (playerNameInput) {
    playerNameInput.remove();
    playerNameInput = null;
  }
  if (submitButton) {
    submitButton.remove();
    submitButton = null;
  }
  
  // Finde den formContainer
  const formContainer = select('#formContainer');
  if (formContainer) {
    // Weltraum-Farbpalette (gleiche wie in createGameOverForm)
    const spaceColors = {
      background: '#0A0E17',
      accent1: '#3A1E7C',
      accent2: '#1E3A7C',
      highlight: '#4F8BFF',
      text: '#E6F0FF',
      success: '#50EEBB',
      warning: '#FF5A5A',
      border: '#2A3A66',
      buttonHover: '#2A4A8F'
    };
    
    // Container für die Erfolgsmeldung
    const successContainer = createDiv();
    successContainer.style('background-color', `${spaceColors.accent2}80`);
    successContainer.style('border-radius', '8px');
    successContainer.style('padding', '15px');
    successContainer.style('margin', '10px 0');
    successContainer.style('box-shadow', `0 0 15px ${spaceColors.success}60`);
    successContainer.style('border', `1px solid ${spaceColors.success}`);
    successContainer.parent(formContainer);
    
    // Erfolgsmeldung hinzufügen
    const successMessage = createP('Score successfully submitted!');
    successMessage.style('color', spaceColors.success);
    successMessage.style('text-align', 'center');
    successMessage.style('margin', '0 0 10px 0');
    successMessage.style('font-size', '18px');
    successMessage.style('font-weight', 'bold');
    successMessage.style('font-family', 'Arial, sans-serif');
    successMessage.style('text-shadow', `0 0 5px ${spaceColors.success}60`);
    successMessage.parent(successContainer);
    
    // Danke-Nachricht
    const thanksMessage = createP('Thanks for playing!');
    thanksMessage.style('color', spaceColors.text);
    thanksMessage.style('text-align', 'center');
    thanksMessage.style('margin', '0');
    thanksMessage.style('font-size', '16px');
    thanksMessage.style('font-family', 'Arial, sans-serif');
    thanksMessage.parent(successContainer);
    
    // Füge ein paar Sterne als Dekoration hinzu
    for (let i = 0; i < 3; i++) {
      const star = createP('✨');
      star.style('position', 'absolute');
      star.style('font-size', '24px');
      star.style('color', spaceColors.highlight);
      star.style('opacity', '0.8');
      star.style('top', `${Math.random() * 100}%`);
      star.style('left', `${Math.random() * 80 + 10}%`);
      star.style('transform', 'rotate(' + Math.random() * 360 + 'deg)');
      star.style('text-shadow', `0 0 5px ${spaceColors.highlight}`);
      star.parent(successContainer);
    }
  }
}

// Neue Funktion für Mausklicks
function mouseClicked() {
  if (gameState === "GAMEOVER") {
    // Prüfe, ob auf den Link geklickt wurde
    const linkText = "kai.huettenmueller.de";
    const linkWidth = textWidth(linkText);
    const linkX = width/2 - linkWidth/2;
    const linkY = height - 70;
    
    if (mouseX > linkX && mouseX < linkX + linkWidth && 
        mouseY > linkY - 10 && mouseY < linkY + 10) {
      // Öffne die Website in einem neuen Tab
      window.open("https://kai.huettenmueller.de/", "_blank");
    }
  }
}

// Funktion zum Bereinigen von Spielobjekten
function cleanupGameObjects() {
  console.log('Cleaning up game objects...');
  
  // Entferne Kugeln, die außerhalb des Bildschirms sind
  bullets = bullets.filter(b => !b.offScreen());
  
  // Entferne Power-Ups, die außerhalb des Bildschirms sind
  powerUps = powerUps.filter(p => !p.offScreen());
  
  // Entferne Gegner, die zu weit unten sind
  enemies = enemies.filter(e => e.y <= height + e.height * 2);
  
  // Entferne tote Partikel
  particles = particles.filter(p => !p.isDead());
  
  // Begrenze die Anzahl der Objekte
  if (enemies.length > MAX_ENEMIES) {
    enemies = enemies.slice(0, MAX_ENEMIES);
  }
  
  if (bullets.length > MAX_BULLETS) {
    bullets = bullets.slice(0, MAX_BULLETS);
  }
  
  if (powerUps.length > MAX_POWERUPS) {
    powerUps = powerUps.slice(0, MAX_POWERUPS);
  }
  
  if (particles.length > MAX_PARTICLES) {
    // Sortiere Partikel nach verbleibender Lebensdauer und behalte die neuesten
    particles.sort((a, b) => b.lifetime - a.lifetime);
    particles = particles.slice(0, MAX_PARTICLES);
  }
  
  // Versuche, den Speicher zu bereinigen
  if (window.gc) {
    window.gc();
  }
}

// Funktion zum Anzeigen des Verbindungsstatus
function displayConnectionStatus() {
  if (window.SupabaseService) {
    onlineLeaderboardStatus = window.SupabaseService.getConnectionStatus();
  }
}

// Neue Funktion zum Zeichnen des Controls-Tooltips
function drawControlsTooltip() {
  if (showControlsTooltip) {
    // Erhöhe den Timer
    tooltipFadeTimer++;
    
    // Beginne mit dem Ausblenden nach der Verzögerung
    if (tooltipFadeTimer > TOOLTIP_FADE_DELAY) {
      tooltipAlpha = max(0, tooltipAlpha - 0.5); // Langsam ausblenden
      
      // Wenn vollständig ausgeblendet, deaktiviere den Tooltip
      if (tooltipAlpha <= 0) {
        showControlsTooltip = false;
      }
    }
    
    // Zeichne die Steuerungsinformationen direkt ohne Rahmen
    noStroke();
    textAlign(RIGHT, TOP);
    textSize(10);
    
    // Halbtransparenter Text für die Steuerung
    fill(255, 255, 255, tooltipAlpha);
    text("Move: WASD", width - 10, 10);
    text("Shoot: SPACE", width - 10, 25);
  }
}

// Funktion zum Initialisieren des Sternenhintergrunds
function initStars() {
  stars = [];
  for (let i = 0; i < NUM_STARS; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(0.5, 2),
      brightness: random(100, 255),
      speed: random(0.1, 0.5)
    });
  }
}

// Funktion zum Zeichnen und Aktualisieren des Sternenhintergrunds
function drawStars() {
  noStroke();
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    
    // Zeichne den Stern
    fill(255, 255, 255, star.brightness);
    ellipse(star.x, star.y, star.size);
    
    // Bewege den Stern nach unten (Parallax-Effekt)
    star.y += star.speed;
    
    // Wenn der Stern unten aus dem Bildschirm verschwindet, setze ihn oben wieder ein
    if (star.y > height) {
      star.y = 0;
      star.x = random(width);
    }
  }
}

// Funktion zum Abrufen der Leaderboard-Daten aus Supabase
async function fetchLeaderboard() {
  console.log('Rufe Leaderboard-Daten ab...');
  
  // Wenn bereits globale Highscores geladen wurden, verwende diese
  if (globalHighScores && globalHighScores.length > 0) {
    console.log('Verwende bereits geladene Highscores:', globalHighScores);
    return globalHighScores;
  }
  
  // Ansonsten lade neue Daten
  try {
    if (typeof window.SupabaseService === 'undefined') {
      console.error('Supabase-Service nicht verfügbar');
      return [];
    }
    
    // Verwende die bestehende Funktion zum Laden der Highscores
    await fetchGlobalHighScores();
    
    // Warte kurz, bis die Daten geladen sind
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Gib die geladenen Daten zurück
    return globalHighScores || [];
  } catch (error) {
    console.error("Fehler beim Abrufen des Leaderboards:", error);
    return [];
  }
}

// Füge Mausrad-Unterstützung für das Scrollen hinzu
function mouseWheel(event) {
  if (gameState === "LEADERBOARD") {
    // Scrolle mit dem Mausrad
    // In p5.js ist event.delta manchmal ein Objekt, daher müssen wir sicherstellen, dass wir den richtigen Wert verwenden
    let deltaY = 0;
    
    if (typeof event.delta === 'number') {
      deltaY = event.delta;
    } else if (event.delta && typeof event.delta.y === 'number') {
      deltaY = event.delta.y;
    } else if (event.deltaY) {
      deltaY = event.deltaY;
    }
    
    leaderboardScrollY += deltaY * 0.5;
    
    // Begrenze den Scroll-Bereich
    leaderboardScrollY = constrain(leaderboardScrollY, 0, maxLeaderboardScroll);
    
    // Verhindere das Standard-Scrollverhalten der Seite
    return false;
  }
}

// Füge Drag-Unterstützung für das Scrollen hinzu
function mousePressed() {
  // Prüfe zuerst, ob wir im Leaderboard sind
  if (gameState === "LEADERBOARD") {
    // Prüfe, ob der Klick auf der Scrollbar ist
    const visibleAreaY = height / 4 + 20;
    const visibleAreaHeight = height / 2 + 40;
    
    if (mouseX > width * 3 / 4 + 45 && mouseX < width * 3 / 4 + 65 &&
        mouseY > visibleAreaY && mouseY < visibleAreaY + visibleAreaHeight) {
      isDragging = true;
      dragStartY = mouseY;
      dragStartScrollY = leaderboardScrollY;
    }
  }
}

function mouseDragged() {
  if (isDragging && gameState === "LEADERBOARD") {
    // Berechne die neue Scroll-Position basierend auf der Mausbewegung
    const visibleAreaHeight = height / 2 + 40;
    const dragDelta = mouseY - dragStartY;
    const scrollDelta = (dragDelta / visibleAreaHeight) * maxLeaderboardScroll;
    
    leaderboardScrollY = constrain(dragStartScrollY + scrollDelta, 0, maxLeaderboardScroll);
  }
}

function mouseReleased() {
  isDragging = false;
}
  