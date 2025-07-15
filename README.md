# Space Invader Clone

Ein pixeliges Space Invader Spiel, entwickelt mit p5.js und Supabase für die Online-Bestenliste.

## Beschreibung

Dieses Projekt ist ein moderner Klon des klassischen Arcade-Spiels Space Invaders mit pixeliger Retro-Grafik. Es wurde mit p5.js entwickelt und bietet ein unterhaltsames Spielerlebnis mit verschiedenen Gegnertypen, Power-ups und einem Levelsystem.

## Features

- Pixelige Retro-Grafik mit handgezeichneten Sprites
- Verschiedene Gegnertypen mit unterschiedlichen Bewegungsmustern:
  - Typ 1: Einfache Gegner, die gerade nach unten fliegen
  - Typ 2: Wellenförmig bewegende Gegner
  - Typ 3: Schießende Gegner
  - Bosse: Erscheinen alle 5 Level mit mehr Lebenspunkten und speziellen Angriffsmustern
- Power-up-System:
  - Schild: Absorbiert einen Treffer
  - Schnellfeuer: Erhöht die Feuerrate für begrenzte Zeit
- Fortschrittssystem mit steigender Schwierigkeit
- Highscore-Speicherung im lokalen Speicher des Browsers
- Online-Bestenliste mit Supabase
- Responsive Steuerung (Pfeiltasten/WASD und Leertaste/Z zum Schießen)
- Game-Over-Bildschirm mit Highscore-Liste

## Installation

```
# Klone das Repository
git clone https://github.com/KaiHuettenmueller/space-invader-clone.git

# Wechsle in das Projektverzeichnis
cd space-invader-clone
```

## Spielen

Du kannst das Spiel direkt hier spielen: [Space Invader Clone](https://kaihuettenmueller.github.io/space-invader-clone/)

Alternativ kannst du einen lokalen Webserver verwenden:
```
# Mit Python (falls installiert)
python -m http.server

# Dann im Browser öffnen
http://localhost:8000
```

## Steuerung

- **Bewegung**: Pfeiltasten oder WASD
- **Schießen**: Leertaste oder Z-Taste
- **Neustart nach Game Over**: Enter-Taste

## Spielmechanik

- Sammle Power-ups, die von besiegten Gegnern fallen gelassen werden
- Vermeide feindliche Schüsse und Kollisionen mit Gegnern
- Jedes Level wird schwieriger mit mehr und verschiedenen Gegnertypen
- Alle 5 Level erscheint ein Boss, der besiegt werden muss

## Technologien

- [p5.js](https://p5js.org/) für Grafik und Spielmechanik
- [Supabase](https://supabase.io/) für die Online-Bestenliste

## Lokale Entwicklung

Um das Spiel lokal zu entwickeln:

1. Klone das Repository
2. Öffne die `index.html` in deinem Browser oder verwende einen lokalen Webserver

```bash
# Mit Python (falls installiert)
python -m http.server

# Dann im Browser öffnen
http://localhost:8000
```

## Lizenz

MIT Lizenz 
