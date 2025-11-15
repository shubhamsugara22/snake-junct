# Sprite Sheet Resources & Guide

## 📚 What Are Sprite Sheets?

A sprite sheet is a single image file containing multiple frames of animation arranged in a grid. Instead of loading many separate images, you load one image and display different parts of it.

**Example:**
```
[Frame1][Frame2][Frame3][Frame4]
[Frame5][Frame6][Frame7][Frame8]
```

## 🎨 Where to Find Sprite Sheets

### Free Resources:

1. **OpenGameArt.org** ⭐ BEST
   - https://opengameart.org/
   - Thousands of free game assets
   - Search: "sprite sheet", "character", "enemy"
   - License: CC0, CC-BY (check each asset)

2. **Itch.io**
   - https://itch.io/game-assets/free
   - Filter by "Sprites" and "Free"
   - Great for pixel art and 2D games

3. **Kenney.nl** ⭐ HIGHLY RECOMMENDED
   - https://kenney.nl/assets
   - All CC0 (public domain)
   - Professional quality
   - Pre-made sprite sheets

4. **CraftPix.net**
   - https://craftpix.net/freebies/
   - Free section with sprite sheets
   - Good for platformers

5. **GameArt2D.com**
   - https://www.gameart2d.com/freebies.html
   - Free sprite packs
   - Various themes

### Paid Resources (High Quality):

1. **Humble Bundle** - Game asset bundles
2. **Unity Asset Store** - Many work outside Unity
3. **GameDev Market** - Professional assets

## 🛠️ Tools to Create Your Own

### Pixel Art Tools:

1. **Aseprite** ($19.99) ⭐ BEST
   - https://www.aseprite.org/
   - Industry standard for pixel art
   - Built-in animation tools
   - Export sprite sheets directly

2. **Piskel** (Free, Web-based)
   - https://www.piskelapp.com/
   - Create pixel art in browser
   - Export as sprite sheet
   - Great for beginners

3. **GraphicsGale** (Free)
   - https://graphicsgale.com/
   - Windows only
   - Good for pixel art animation

4. **Krita** (Free)
   - https://krita.org/
   - Professional painting software
   - Has animation features

### AI Tools (Generate Sprites):

1. **Stable Diffusion** + ControlNet
   - Generate consistent character sprites
   - Requires setup

2. **Midjourney** / **DALL-E**
   - Generate individual frames
   - Combine into sprite sheet

## 📖 Tutorials & Learning

### Video Tutorials:

1. **"How to Make Sprite Sheets"** - YouTube
   - Search: "sprite sheet tutorial"
   - Recommended: Brackeys, GameMaker tutorials

2. **Pixel Art Animation Basics**
   - MortMort on YouTube
   - Brandon James Greer

### Written Guides:

1. **Sprite Sheet Format Guide**
   - https://www.codeandweb.com/what-is-a-sprite-sheet

2. **Animation Principles**
   - 12 Principles of Animation (Disney)
   - Apply to sprite animation

## 🎮 Sprite Sheet Examples for Your Game

### For Snake Dodge Game:

#### Player Character:
- **Idle**: 2-4 frames (breathing animation)
- **Jump**: 3-5 frames (crouch, jump, peak, fall)
- **Fall**: 2-3 frames
- **Death**: 4-6 frames (explosion/fade)

#### Snake Enemy:
- **Slither**: 4-8 frames (wave motion)
- **Attack**: 3-4 frames (lunge)

#### Obstacles:
- **Pillar**: Static or slight wobble (2 frames)
- **Ghost**: 4-6 frames (floating, transparency)

#### Bosses:
- **Idle**: 4-6 frames (breathing, floating)
- **Attack**: 6-8 frames (wind-up, attack, recover)
- **Hurt**: 2-3 frames (flash, recoil)
- **Death**: 8-12 frames (explosion sequence)

#### Effects:
- **Explosion**: 6-8 frames
- **Power-up glow**: 4 frames (pulse)
- **Shield**: 4 frames (rotating)

## 💻 How to Use Sprite Sheets in Konva

### Basic Setup:

```javascript
// Load sprite sheet image
const image = new Image();
image.src = '/path/to/spritesheet.png';

image.onload = () => {
  // Create Konva sprite
  const sprite = new Konva.Sprite({
    x: 100,
    y: 100,
    image: image,
    animation: 'idle',
    animations: {
      idle: [
        0, 0, 32, 32,    // x, y, width, height of frame 1
        32, 0, 32, 32,   // frame 2
        64, 0, 32, 32,   // frame 3
      ],
      run: [
        0, 32, 32, 32,   // frame 1 of run animation
        32, 32, 32, 32,  // frame 2
        64, 32, 32, 32,  // frame 3
      ]
    },
    frameRate: 10,
    frameIndex: 0,
  });

  layer.add(sprite);
  sprite.start(); // Start animation
};
```

### Advanced: Animation Controller

```javascript
class SpriteAnimator {
  constructor(sprite, animations) {
    this.sprite = sprite;
    this.animations = animations;
    this.currentAnimation = null;
  }

  play(animationName, loop = true) {
    if (this.currentAnimation === animationName) return;
    
    this.sprite.animation(animationName);
    this.currentAnimation = animationName;
    
    if (!loop) {
      this.sprite.on('frameIndexChange', (e) => {
        if (e.newVal === this.sprite.frameCount() - 1) {
          this.sprite.stop();
        }
      });
    }
    
    this.sprite.start();
  }
}
```

## 📐 Sprite Sheet Specifications

### Recommended Sizes:

- **Character**: 32x32, 64x64, or 128x128 per frame
- **Boss**: 128x128 or 256x256 per frame
- **Effects**: 32x32 or 64x64 per frame

### Format:
- **PNG** with transparency
- **Power of 2** dimensions (256x256, 512x512, 1024x1024)
- **Consistent frame sizes** within each sheet

### Layout:
- **Horizontal strip**: All frames in one row
- **Grid**: Multiple rows and columns
- **Packed**: Irregular layout (use TexturePacker)

## 🔧 Tools to Pack Sprites

1. **TexturePacker** (Paid, has free version)
   - https://www.codeandweb.com/texturepacker
   - Automatically pack sprites efficiently
   - Generate JSON with coordinates

2. **Shoebox** (Free)
   - http://renderhjs.net/shoebox/
   - Pack sprites, extract sprites
   - Generate sprite sheets

3. **Free Texture Packer** (Free)
   - http://free-tex-packer.com/
   - Web-based
   - Export for various engines

## 🎯 Quick Start for Your Game

### Option 1: Use Kenney Assets (Easiest)
1. Go to https://kenney.nl/assets
2. Download "Platformer Pack" or "Pixel Platformer"
3. Use pre-made sprite sheets
4. Implement in Konva (see code above)

### Option 2: Create Simple Sprites (Learning)
1. Use Piskel (web-based, free)
2. Create 32x32 character
3. Make 4 frames of animation
4. Export as sprite sheet
5. Implement in your game

### Option 3: Commission/Generate (Professional)
1. Hire artist on Fiverr ($20-100)
2. Use AI to generate consistent sprites
3. Get exactly what you need

## 📝 Sprite Sheet Naming Convention

```
character_idle_32x32.png
character_run_32x32.png
enemy_snake_slither_64x32.png
boss_octopus_attack_128x128.png
effect_explosion_64x64.png
```

## 🚀 Next Steps for Your Game

1. **Start Simple**: Use basic shapes (current approach)
2. **Add One Sprite**: Replace player with sprite animation
3. **Test Performance**: Ensure 60 FPS maintained
4. **Expand**: Add enemy sprites, effects
5. **Polish**: Add particle effects, trails

---

**Ready to implement?** 
- Download a sprite sheet from Kenney.nl
- Test with Konva.Sprite
- Replace one game element at a time
