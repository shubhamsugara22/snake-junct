# Snake Dodge - Development Resources

## 📚 Table of Contents
1. [Sprite Sheets & Graphics](#sprite-sheets--graphics)
2. [Konva.js Integration](#konvajs-integration)
3. [Recent Updates](#recent-updates)
4. [Boss Battle System](#boss-battle-system)
5. [Event System](#event-system)

---

## 🎨 Sprite Sheets & Graphics

### What Are Sprite Sheets?
A sprite sheet is a single image containing multiple animation frames arranged in a grid. Instead of loading many files, you load one image and display different parts.

### Free Resources

**Best Sources:**
1. **Kenney.nl** ⭐ HIGHLY RECOMMENDED
   - https://kenney.nl/assets
   - All CC0 (public domain)
   - Professional quality sprite sheets

2. **OpenGameArt.org**
   - https://opengameart.org/
   - Thousands of free assets
   - Search: "sprite sheet", "character", "enemy"

3. **Itch.io**
   - https://itch.io/game-assets/free
   - Filter by "Sprites" and "Free"
   - Great for pixel art

### Tools to Create Sprites

**Pixel Art Tools:**
1. **Aseprite** ($19.99) - Industry standard
2. **Piskel** (Free, Web) - https://www.piskelapp.com/
3. **GraphicsGale** (Free, Windows)

### Sprite Specifications for This Game

**Player Character:**
- Size: 32x32 or 64x64 pixels
- Frames needed: Idle (2-4), Jump (3-5), Fall (2-3)

**Snake Enemy:**
- Size: 16x64 to 32x128 pixels
- Frames needed: Slither (4-8 frames)

**Bosses:**
- Size: 128x128 or 256x256 pixels
- Frames needed: Idle (4-6), Attack (6-8), Hurt (2-3)

**Effects:**
- Size: 32x32 or 64x64 pixels
- Explosion (6-8 frames), Power-up glow (4 frames)

### Using Sprites in Konva

```javascript
// Load sprite sheet
const image = new Image();
image.src = '/path/to/spritesheet.png';

image.onload = () => {
  const sprite = new Konva.Sprite({
    x: 100,
    y: 100,
    image: image,
    animation: 'idle',
    animations: {
      idle: [0, 0, 32, 32, 32, 0, 32, 32],  // x, y, width, height
      run: [0, 32, 32, 32, 32, 32, 32, 32]
    },
    frameRate: 10
  });
  
  layer.add(sprite);
  sprite.start();
};
```

---

## 🎮 Konva.js Integration

### What is Konva?
Konva.js is a 2D canvas library that provides:
- Built-in animation system (tweening)
- Sprite support
- Layer management
- Better performance than raw Canvas 2D

### Current Status
✅ **Installed**: Konva is added to the project
✅ **Basic Component**: GameKonva.tsx created with:
- Player movement with gravity
- Jump animation (squash & stretch)
- Keyboard controls
- Snakes with sine wave movement
- Obstacles (pillars)
- Collision detection
- Score system

### How to Test Konva Version

**Option 1: Temporary Switch**
In `src/client/App.tsx`:
```typescript
// Change:
import { Game } from './components/Game';

// To:
import { GameKonva as Game } from './components/GameKonva';
```

**Option 2: Keep Both**
Add a toggle button to switch between versions

### Konva Advantages

**Animation System:**
```javascript
// Smooth tweening
player.to({
  x: 100,
  y: 200,
  rotation: 45,
  duration: 1,
  easing: Konva.Easings.EaseInOut
});
```

**Performance:**
- Automatic dirty region detection
- Layer caching
- Better with many objects
- Consistent 60 FPS

### Next Steps for Konva
1. Add sprite sheet support
2. Implement particle effects
3. Migrate boss battles
4. Add smooth transitions
5. Optimize for mobile

---

## 📝 Recent Updates

### Version 2.10.0 - Halloween Boss Battles (Current)

**🎃 Halloween Event Features:**
- Spooky background music during gameplay
- Evil laughter on death
- Bloody death messages
- Witch hat and ghost skins
- Fire & candy power-ups

**🐙 Boss Battle System:**
- **Octopus Boss** (100 points) - Throws ink blobs
- **Bat Boss** (250 points) - Throws pumpkins
- **Cat Boss** (100 points, Normal mode) - Throws fireballs
- **Missile Boss** (250 points, Normal mode) - Throws rockets

**⚙️ Settings Menu:**
- Volume control slider
- Event mode toggle (Halloween ↔ Normal)
- Pause button during gameplay

**🎨 Visual Improvements:**
- Simplified retro background (better performance)
- Fixed boss health system
- Enhanced collision detection
- Loading page with animated snake

### Key Features

**ML-Powered Adaptive Difficulty:**
- Tracks player skill (score, survival, reaction time)
- Adjusts obstacle count and spacing
- Modifies snake speed ±30%
- Adapts shield count inversely

**Power-Up System:**
- 🛡️ Shield (20s invincibility)
- 🔥 Fire (10s, kills enemies)
- 🍬 Candy (10s, both effects)

**Character Skins:**
- 5 regular colors (orange, blue, pink, green, purple)
- 🧙 Witch (Halloween)
- 👻 Ghost (Halloween)

---

## 👾 Boss Battle System

### Boss Types

**Halloween Mode (Default):**
1. **Octopus Boss** (Score: 100)
   - Health: 10
   - Projectile: Ink blobs
   - Movement: Sine wave pattern

2. **Bat Boss** (Score: 250)
   - Health: 15
   - Projectile: Pumpkins (2 at once)
   - Movement: Erratic flying

**Normal Mode:**
1. **Cat Boss** (Score: 100)
   - Health: 10
   - Projectile: Fireballs
   - Movement: Chases player

2. **Missile Boss** (Score: 250)
   - Health: 15
   - Projectile: Rockets
   - Movement: Aggressive tracking

### Boss Mechanics

**Triggering:**
- Bosses appear at specific score thresholds
- Only one boss active at a time
- Must defeat to continue

**Combat:**
- Bounce on boss to deal damage (-1 health per hit)
- Boss flashes white when hit
- Health bar shows above boss
- Avoid projectiles

**Phases:**
1. **Entrance** (2s) - Boss appears with animation
2. **Active** - Boss attacks and moves
3. **Victory** (1s) - Boss defeated, rewards spawn

**Rewards:**
- Bonus points (50 for first boss, 100 for second)
- Power-up drop (shield or candy)
- Enemies respawn after victory

---

## 🎪 Event System

### Halloween Event (Active)

**Toggle:** Settings menu → Event Mode checkbox

**Features When Active:**
- 🎵 Spooky background music
- 😈 Evil laughter on death
- 🩸 Horror-themed death messages
- 🧙 Witch & 👻 Ghost skins available
- 🔥 Fire power-up spawns
- 🍬 Candy power-up spawns
- 👻 Flying ghost obstacles
- 🎃 Halloween background theme
- 🐙 Octopus & 🦇 Bat bosses

**Features When Disabled (Normal Mode):**
- Regular sound effects
- Standard death messages
- Only 5 regular skins
- 🛡️ Shield power-up only
- Regular obstacles
- Beach/Night/Retro/Desert themes
- 🐱 Cat & 🚀 Missile bosses

### Adding New Events

**To create a new event:**

1. Add event flag:
```typescript
let NEW_EVENT_ACTIVE = false;
```

2. Add event-specific content:
```typescript
if (NEW_EVENT_ACTIVE) {
  // Event-specific rendering
  // Event-specific sounds
  // Event-specific obstacles
}
```

3. Add toggle in settings menu

4. Document in CHANGELOG.md

---

## 🔧 Technical Notes

### File Structure
```
src/
├── client/
│   ├── components/
│   │   ├── Game.tsx              # Main Canvas 2D game
│   │   ├── GameKonva.tsx         # Konva version (ready)
│   │   ├── LoadingPage.tsx       # Loading screen
│   │   ├── SettingsButton.tsx    # Settings menu
│   │   └── ...
│   └── ...
├── shared/
│   └── types/
│       └── game.ts               # Game types & configs
└── server/
    └── index.ts                  # API endpoints
```

### Key Configuration

**Game Constants** (`src/client/components/Game.tsx`):
```typescript
const GAME_CONFIG = {
  gridWidth: 600,
  gridHeight: 400,
  playerSize: 20,
  gravity: 0.4,
  jumpForce: -6,
  snakeCount: { easy: 3, medium: 6, hard: 9 },
  obstacleCount: { easy: 3, medium: 5, hard: 7 }
};
```

**Boss Configs** (`src/shared/types/game.ts`):
```typescript
export const BOSS_CONFIGS: Record<BossType, BossConfig> = {
  octopus: { triggerScore: 100, health: 10, ... },
  bat: { triggerScore: 250, health: 15, ... },
  cat: { triggerScore: 100, health: 10, ... },
  missile: { triggerScore: 250, health: 15, ... }
};
```

### Performance Tips
- Use `requestAnimationFrame` for smooth 60 FPS
- Implement object pooling for projectiles
- Cache frequently used calculations
- Use layers in Konva for optimization
- Minimize state updates

---

## 🚀 Quick Start Guide

### Running the Game
```bash
npm install
npm run dev
```

### Testing Features
1. **Boss Battles**: Play until score 100 or 250
2. **Event Toggle**: Click settings (⚙️) → Toggle event mode
3. **Konva Version**: Modify App.tsx import (see above)
4. **Power-ups**: Collect shields, fire, or candy during gameplay

### Common Issues

**Boss health not decreasing:**
- Fixed in v2.10.0 - boss state now properly immutable

**Retro level freezing:**
- Fixed in v2.10.0 - simplified animations

**Wrong boss appearing:**
- Check event mode in settings
- Halloween mode: Octopus/Bat
- Normal mode: Cat/Missile

---

## 📞 Support

For issues or questions:
1. Check CHANGELOG.md for recent changes
2. Review this RESOURCES.md
3. Check console logs for debug info
4. Test with different browsers

---

**Last Updated:** November 2024
**Current Version:** 2.10.0
**Game Engine:** Canvas 2D (Konva ready for migration)
