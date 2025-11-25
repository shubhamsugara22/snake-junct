# How to Add Images to Your Game - Step by Step

## Step 1: Add Images to Your Project

Create this folder structure:
```
src/client/public/
  ├── sprites/
  │   ├── player-orange.png    (64x64px)
  │   ├── player-blue.png      (64x64px)
  │   ├── snake.png            (32x32px)
  │   └── ghost.png            (50x50px)
  ├── icons/
  │   ├── shield.png           (32x32px)
  │   └── fire.png             (32x32px)
  └── backgrounds/
      ├── beach.jpg            (600x400px)
      └── night.jpg            (600x400px)
```

## Step 2: Update Game.tsx to Load Images

Add this at the top of your Game component:

```typescript
import { useState, useEffect, useRef } from 'react';
import { loadGameImages, drawImageCentered, type GameImages } from '../utils/imageLoader';

export const Game = ({ username, onScoreUpdate }: GameProps) => {
  // Add image state
  const [images, setImages] = useState<GameImages>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Load images on mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        const loadedImages = await loadGameImages();
        setImages(loadedImages);
        setImagesLoaded(true);
        console.log('✅ Images loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load images:', error);
        setImagesLoaded(true); // Continue with fallback rendering
      }
    };

    loadImages();
  }, []);

  // ... rest of your component
```

## Step 3: Update Player Rendering

Find where you draw the player character and update it:

```typescript
// In your render function, replace the player drawing code:

// OLD CODE (keep as fallback):
// ctx.beginPath();
// ctx.arc(playerX, playerY, playerRadius, 0, 2 * Math.PI);
// ctx.fill();

// NEW CODE (with image):
const playerImage = images[`player${selectedSkin.charAt(0).toUpperCase() + selectedSkin.slice(1)}` as keyof GameImages];

if (imagesLoaded && playerImage) {
  // Draw player sprite
  drawImageCentered(
    ctx,
    playerImage,
    playerX,
    playerY,
    playerRadius * 2,
    playerRadius * 2
  );
} else {
  // Fallback: Use current canvas drawing
  const gradient = ctx.createRadialGradient(
    playerX - 3,
    playerY - 3,
    0,
    playerX,
    playerY,
    playerRadius
  );
  gradient.addColorStop(0, skinColors.primary);
  gradient.addColorStop(1, skinColors.secondary);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(playerX, playerY, playerRadius, 0, 2 * Math.PI);
  ctx.fill();
  
  // ... rest of current drawing code
}
```

## Step 4: Update imageLoader.ts with Your Images

Edit `src/client/utils/imageLoader.ts`:

```typescript
export const loadGameImages = async (): Promise<GameImages> => {
  const imageMap: Record<keyof GameImages, string> = {
    // Player sprites
    playerOrange: '/sprites/player-orange.png',
    playerBlue: '/sprites/player-blue.png',
    playerPink: '/sprites/player-pink.png',
    playerGreen: '/sprites/player-green.png',
    playerPurple: '/sprites/player-purple.png',
    playerRed: '/sprites/player-red.png',
    playerWitch: '/sprites/player-witch.png',
    playerGhost: '/sprites/player-ghost.png',
    
    // Enemies
    snake: '/sprites/snake.png',
    ghost: '/sprites/ghost.png',
    
    // Power-ups
    shieldIcon: '/icons/shield.png',
    fireIcon: '/icons/fire.png',
    
    // Backgrounds
    beachBg: '/backgrounds/beach.jpg',
    nightBg: '/backgrounds/night.jpg',
    halloweenBg: '/backgrounds/halloween.jpg',
  };

  // ... rest of the function stays the same
```

## Step 5: Add Background Image

In your render function, add background rendering:

```typescript
// At the start of your render function, after clearing:

if (imagesLoaded && images.beachBg && backgroundTheme === 'beach') {
  // Draw background image
  ctx.drawImage(images.beachBg, 0, 0, GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight);
} else {
  // Fallback: Use current gradient background
  // ... your current background code
}
```

## Step 6: Disable Image Smoothing for Pixel Art (Optional)

If using pixel art sprites, add this before drawing:

```typescript
// For crisp pixel art
ctx.imageSmoothingEnabled = false;

// Draw your sprites here

// Re-enable for other elements
ctx.imageSmoothingEnabled = true;
```

## Step 7: Test Your Implementation

1. **Start with one image**: Test player sprite first
2. **Check console**: Look for "✅ Images loaded successfully"
3. **Test fallback**: Remove image file to ensure fallback works
4. **Check performance**: Ensure 60 FPS is maintained

## Common Issues & Solutions

### Issue: Images not loading
```typescript
// Check the path is correct
console.log('Trying to load:', '/sprites/player-orange.png');

// Check if file exists in public folder
// File should be at: src/client/public/sprites/player-orange.png
```

### Issue: Images look blurry
```typescript
// Disable image smoothing
ctx.imageSmoothingEnabled = false;
```

### Issue: Images too large/small
```typescript
// Adjust the size when drawing
drawImageCentered(
  ctx,
  playerImage,
  playerX,
  playerY,
  playerRadius * 2.5,  // Make larger
  playerRadius * 2.5
);
```

### Issue: Performance drop
```typescript
// Make sure images are preloaded, not loaded every frame
// Images should be loaded once in useEffect
// Then reused from state/ref
```

## Example: Complete Player Rendering with Image

```typescript
// Complete example of player rendering with image support
const renderPlayer = (
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  playerRadius: number,
  selectedSkin: CharacterSkin,
  images: GameImages,
  imagesLoaded: boolean
) => {
  // Get the appropriate player image
  const skinKey = `player${selectedSkin.charAt(0).toUpperCase() + selectedSkin.slice(1)}` as keyof GameImages;
  const playerImage = images[skinKey];

  if (imagesLoaded && playerImage) {
    // Draw with image
    ctx.save();
    
    // Optional: Add glow effect
    ctx.shadowColor = SKIN_COLORS[selectedSkin].primary;
    ctx.shadowBlur = 10;
    
    drawImageCentered(
      ctx,
      playerImage,
      playerX,
      playerY,
      playerRadius * 2,
      playerRadius * 2
    );
    
    ctx.restore();
  } else {
    // Fallback: Draw with canvas
    const gradient = ctx.createRadialGradient(
      playerX - 3,
      playerY - 3,
      0,
      playerX,
      playerY,
      playerRadius
    );
    gradient.addColorStop(0, SKIN_COLORS[selectedSkin].primary);
    gradient.addColorStop(1, SKIN_COLORS[selectedSkin].secondary);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(playerX, playerY, playerRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add eyes, smile, etc.
    // ... your current drawing code
  }
};
```

## Quick Start Checklist

- [ ] Create `src/client/public/sprites/` folder
- [ ] Download sprites from Kenney.nl or itch.io
- [ ] Add at least one player sprite (64x64px PNG)
- [ ] Copy `imageLoader.ts` to `src/client/utils/`
- [ ] Add image loading to Game.tsx
- [ ] Update player rendering to use image
- [ ] Test that fallback works
- [ ] Rebuild and test: `npm run build`

## Performance Tips

1. **Preload all images** before game starts
2. **Use refs** to store images (avoid re-renders)
3. **Keep images small** (under 100KB each)
4. **Use sprite sheets** for animations
5. **Cache rendered frames** if possible

## Next Steps

Once player sprite works:
1. Add enemy sprites
2. Add power-up icons
3. Add background images
4. Add UI button backgrounds
5. Add particle effects

Good luck! 🎮
