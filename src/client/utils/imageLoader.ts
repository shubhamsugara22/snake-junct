/**
 * Image Loader Utility for Snake Junct Game
 * Handles loading and caching of game images
 */

export type GameImages = {
  // Player sprites
  playerOrange?: HTMLImageElement;
  playerBlue?: HTMLImageElement;
  playerPink?: HTMLImageElement;
  playerGreen?: HTMLImageElement;
  playerPurple?: HTMLImageElement;
  playerRed?: HTMLImageElement;
  playerWitch?: HTMLImageElement;
  playerGhost?: HTMLImageElement;

  // Enemies
  snake?: HTMLImageElement;
  ghost?: HTMLImageElement;
  
  // Power-ups
  shieldIcon?: HTMLImageElement;
  fireIcon?: HTMLImageElement;
  
  // Backgrounds
  beachBg?: HTMLImageElement;
  nightBg?: HTMLImageElement;
  halloweenBg?: HTMLImageElement;
  
  // UI
  buttonBg?: HTMLImageElement;
  logo?: HTMLImageElement;
};

/**
 * Load a single image
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Load all game images
 * Returns a promise that resolves with all loaded images
 */
export const loadGameImages = async (): Promise<GameImages> => {
  const imageMap: Record<keyof GameImages, string> = {
    // Player sprites - add your actual image paths here
    // playerOrange: '/sprites/player-orange.png',
    // playerBlue: '/sprites/player-blue.png',
    
    // Power-ups
    // shieldIcon: '/icons/shield.png',
    // fireIcon: '/icons/fire.png',
    
    // Backgrounds
    // beachBg: '/backgrounds/beach.jpg',
  };

  const images: Partial<GameImages> = {};
  const loadPromises: Promise<void>[] = [];

  // Load each image
  for (const [key, src] of Object.entries(imageMap)) {
    const promise = loadImage(src)
      .then((img) => {
        images[key as keyof GameImages] = img;
      })
      .catch((error) => {
        console.warn(`Failed to load ${key}:`, error);
        // Continue loading other images even if one fails
      });
    
    loadPromises.push(promise);
  }

  // Wait for all images to load (or fail)
  await Promise.allSettled(loadPromises);

  return images as GameImages;
};

/**
 * Draw an image centered at a position
 */
export const drawImageCentered = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  ctx.drawImage(
    image,
    x - width / 2,
    y - height / 2,
    width,
    height
  );
};

/**
 * Draw a sprite from a sprite sheet
 */
export const drawSprite = (
  ctx: CanvasRenderingContext2D,
  spriteSheet: HTMLImageElement,
  frameIndex: number,
  x: number,
  y: number,
  frameWidth: number,
  frameHeight: number,
  scale: number = 1
) => {
  const framesPerRow = Math.floor(spriteSheet.width / frameWidth);
  const row = Math.floor(frameIndex / framesPerRow);
  const col = frameIndex % framesPerRow;

  const destWidth = frameWidth * scale;
  const destHeight = frameHeight * scale;

  ctx.drawImage(
    spriteSheet,
    col * frameWidth,
    row * frameHeight,
    frameWidth,
    frameHeight,
    x - destWidth / 2,
    y - destHeight / 2,
    destWidth,
    destHeight
  );
};
