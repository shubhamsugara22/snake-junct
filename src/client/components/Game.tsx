import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameState,
  GameLevel,
  Position,
  Snake,
  Obstacle,
  GameConfig,
  Projectile,
  BossType,
  Boss,
  BOSS_CONFIGS,
  BOSS_BATTLES_ENABLED,
} from '../../shared/types/game';
import { Tutorial } from './Tutorial';
import { PauseMenu } from './PauseMenu';
import { SettingsMenu } from './SettingsMenu';

// ProjectilePool class for performance optimization
class ProjectilePool {
  private pool: Projectile[] = [];
  private maxSize = 20;

  acquire(
    type: 'inkBlob' | 'pumpkin',
    position: Position,
    velocity: Position,
    size: number
  ): Projectile {
    let projectile = this.pool.find((p) => !p.active);

    if (!projectile) {
      projectile = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        position: { ...position },
        velocity: { ...velocity },
        size,
        active: true,
      };
      this.pool.push(projectile);
    } else {
      projectile.type = type;
      projectile.position = { ...position };
      projectile.velocity = { ...velocity };
      projectile.size = size;
      projectile.active = true;
    }

    return projectile;
  }

  release(projectile: Projectile): void {
    projectile.active = false;
  }

  getActive(): Projectile[] {
    return this.pool.filter((p) => p.active);
  }
}

// Boss trigger and lifecycle management functions
const checkBossTrigger = (score: number, defeatedBosses: BossType[]): BossType | null => {
  // Check for Bat Boss at score 250 (higher score first)
  if (score >= 250 && !defeatedBosses.includes('bat')) {
    return 'bat';
  }
  // Check for Octopus Boss at score 100
  if (score >= 100 && !defeatedBosses.includes('octopus')) {
    return 'octopus';
  }
  return null;
};

const shouldTriggerBoss = (
  score: number,
  halloweenActive: boolean,
  bossesEnabled: boolean,
  defeatedBosses: BossType[]
): BossType | null => {
  // Check feature flags
  if (!bossesEnabled || !halloweenActive) {
    return null;
  }

  // Call checkBossTrigger with error handling
  try {
    return checkBossTrigger(score, defeatedBosses);
  } catch (error) {
    console.error('Error checking boss trigger:', error);
    return null;
  }
};

// Octopus Boss rendering function
const renderOctopusBoss = (ctx: CanvasRenderingContext2D, boss: Boss, time: number) => {
  const config = BOSS_CONFIGS.octopus;
  const { x, y } = boss.position;

  // Flash white when hit
  const isFlashing = time - boss.hitFlashTime < 200;

  // Show damage number when hit
  if (isFlashing) {
    renderDamageNumber(ctx, x, y - 50, time - boss.hitFlashTime);
  }

  // Draw 8 tentacles with wave animation
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + boss.animationPhase;
    const tentacleLength = 40;
    const wave = Math.sin(time * 0.005 + i) * 5;

    ctx.strokeStyle = isFlashing ? '#FFFFFF' : config.colors.primary;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y);
    const endX = x + Math.cos(angle) * (tentacleLength + wave);
    const endY = y + Math.sin(angle) * (tentacleLength + wave);
    ctx.quadraticCurveTo(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20 + wave, endX, endY);
    ctx.stroke();

    // Tentacle sucker details
    ctx.fillStyle = config.colors.secondary;
    for (let j = 1; j <= 3; j++) {
      const suckerX = x + Math.cos(angle) * (j * 12);
      const suckerY = y + Math.sin(angle) * (j * 12);
      ctx.beginPath();
      ctx.arc(suckerX, suckerY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw main body with glow
  ctx.shadowColor = config.colors.glow;
  ctx.shadowBlur = 20;

  const gradient = ctx.createRadialGradient(x - 10, y - 10, 0, x, y, 40);
  gradient.addColorStop(0, config.colors.secondary);
  gradient.addColorStop(0.5, config.colors.primary);
  gradient.addColorStop(1, '#1a0033');

  ctx.fillStyle = isFlashing ? '#FFFFFF' : gradient;
  ctx.beginPath();
  ctx.arc(x, y, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw eyes
  ctx.fillStyle = '#FF0000';
  ctx.shadowColor = '#FF0000';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x - 12, y - 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 12, y - 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Eye pupils
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(x - 12, y - 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 12, y - 8, 3, 0, Math.PI * 2);
  ctx.fill();
};

// Octopus Boss update function
const updateOctopusBoss = (boss: Boss, time: number, playerY: number): Boss => {
  // Rotate tentacles slowly
  const newAnimationPhase = boss.animationPhase + 0.02;

  const t = time * 0.001; // Convert to seconds

  // INDEPENDENT MOVEMENT - Does NOT follow player
  // Horizontal: Wide oscillation from extreme left to extreme right
  const centerX = GAME_CONFIG.gridWidth / 2; // Center of screen (300)
  const horizontalRange = 220; // Move from ~80 to ~520 (almost full screen width)
  const newX = centerX + Math.sin(t * 0.5) * horizontalRange; // Slow horizontal wave

  // Vertical: Independent sine wave pattern
  const centerY = GAME_CONFIG.gridHeight / 2;
  const verticalRange = 120; // Larger vertical range too
  const newY = centerY + Math.sin(t * 0.7) * verticalRange; // Different frequency for variety

  return {
    ...boss,
    animationPhase: newAnimationPhase,
    position: { x: newX, y: newY },
  };
};

// Octopus Boss projectile throwing function
const octopusThrowProjectile = (
  boss: Boss,
  playerPos: Position,
  pool: ProjectilePool,
  skillLevel: number
): Projectile | null => {
  const config = BOSS_CONFIGS.octopus;
  const interval = skillLevel < 0.3 ? 2000 : config.projectileInterval;

  if (Date.now() - boss.lastProjectileTime < interval) {
    return null;
  }

  boss.lastProjectileTime = Date.now();

  // Calculate trajectory toward player
  const dx = playerPos.x - boss.position.x;
  const dy = playerPos.y - boss.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const velocity = {
    x: (dx / distance) * config.projectileSpeed,
    y: (dy / distance) * config.projectileSpeed,
  };

  return pool.acquire('inkBlob', boss.position, velocity, config.projectileSize);
};

// Render damage numbers
const renderDamageNumber = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  elapsedTime: number
) => {
  const duration = 800;
  const progress = Math.min(elapsedTime / duration, 1);

  // Float up and fade out
  const offsetY = progress * 30;
  const alpha = 1 - progress;

  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FF0000';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';

  ctx.strokeText('-1', x, y - offsetY);
  ctx.fillText('-1', x, y - offsetY);
  ctx.globalAlpha = 1;
};

// Bat Boss rendering function
const renderBatBoss = (ctx: CanvasRenderingContext2D, boss: Boss, time: number) => {
  const config = BOSS_CONFIGS.bat;
  const { x, y } = boss.position;

  // Flash white when hit
  const isFlashing = time - boss.hitFlashTime < 200;

  // Show damage number when hit
  if (isFlashing) {
    renderDamageNumber(ctx, x, y - 40, time - boss.hitFlashTime);
  }

  // Animated wing flapping
  const wingFlap = Math.sin(time * 0.01) * 15;

  // Draw wings with flapping motion
  ctx.fillStyle = isFlashing ? '#FFFFFF' : config.colors.primary;
  ctx.strokeStyle = config.colors.secondary;
  ctx.lineWidth = 2;

  // Left wing
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.quadraticCurveTo(x - 30, y - 20 + wingFlap, x - 40, y - 10 + wingFlap);
  ctx.quadraticCurveTo(x - 35, y + 5, x - 10, y + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wing detail lines (left)
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x - 25 - i * 5, y - 10 + wingFlap + i * 3);
    ctx.stroke();
  }

  // Right wing
  ctx.fillStyle = isFlashing ? '#FFFFFF' : config.colors.primary;
  ctx.strokeStyle = config.colors.secondary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, y);
  ctx.quadraticCurveTo(x + 30, y - 20 + wingFlap, x + 40, y - 10 + wingFlap);
  ctx.quadraticCurveTo(x + 35, y + 5, x + 10, y + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wing detail lines (right)
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + 25 + i * 5, y - 10 + wingFlap + i * 3);
    ctx.stroke();
  }

  // Draw body
  ctx.fillStyle = isFlashing ? '#FFFFFF' : config.colors.primary;
  ctx.beginPath();
  ctx.ellipse(x, y, 12, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = config.colors.secondary;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw head
  ctx.fillStyle = isFlashing ? '#FFFFFF' : config.colors.primary;
  ctx.beginPath();
  ctx.arc(x, y - 15, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw pointed ears
  ctx.fillStyle = isFlashing ? '#FFFFFF' : config.colors.primary;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 20);
  ctx.lineTo(x - 5, y - 28);
  ctx.lineTo(x - 2, y - 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 8, y - 20);
  ctx.lineTo(x + 5, y - 28);
  ctx.lineTo(x + 2, y - 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw glowing red eyes
  ctx.fillStyle = config.colors.secondary;
  ctx.shadowColor = config.colors.glow;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x - 4, y - 16, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 4, y - 16, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw white fangs
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 10);
  ctx.lineTo(x - 2, y - 6);
  ctx.lineTo(x - 1, y - 10);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 3, y - 10);
  ctx.lineTo(x + 2, y - 6);
  ctx.lineTo(x + 1, y - 10);
  ctx.closePath();
  ctx.fill();
};

// Bat Boss update function
const updateBatBoss = (boss: Boss, time: number, playerY: number): Boss => {
  // INDEPENDENT MOVEMENT - Does NOT follow player
  // Figure-eight pattern using Lissajous curve
  const t = time * 0.001; // Convert to seconds

  // Fixed center position
  const centerX = GAME_CONFIG.gridWidth / 2; // Center of screen
  const centerY = GAME_CONFIG.gridHeight / 2;
  const radiusX = 200; // Wider horizontal movement (100 to 500)
  const radiusY = 100; // Larger vertical movement

  // Pure figure-eight pattern - completely independent
  const newX = centerX + radiusX * Math.sin(t * 0.8);
  const newY = centerY + radiusY * Math.sin(2 * t * 0.8);

  // Update animation phase for wing flapping
  const newAnimationPhase = boss.animationPhase + 0.05;

  return {
    ...boss,
    animationPhase: newAnimationPhase,
    position: { x: newX, y: newY },
  };
};

// Bat Boss projectile throwing function
const batThrowProjectile = (
  boss: Boss,
  playerPos: Position,
  pool: ProjectilePool,
  skillLevel: number
): Projectile[] => {
  const config = BOSS_CONFIGS.bat;
  const interval = skillLevel < 0.3 ? 1500 : config.projectileInterval;

  if (Date.now() - boss.lastProjectileTime < interval) {
    return [];
  }

  boss.lastProjectileTime = Date.now();

  // Determine if triple-shot (50% base, 70% for skilled players)
  const tripleChance = skillLevel > 0.7 ? 0.7 : 0.5;
  const isTripleShot = Math.random() < tripleChance;

  const projectiles: Projectile[] = [];

  if (isTripleShot) {
    // Triple-shot with spread angles (-30°, 0°, 30°)
    const angles = [-30, 0, 30];

    angles.forEach((angleDeg) => {
      const angleRad = (angleDeg * Math.PI) / 180;

      // Calculate base direction toward player
      const dx = playerPos.x - boss.position.x;
      const dy = playerPos.y - boss.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Normalize and apply rotation
      const baseVx = (dx / distance) * config.projectileSpeed;
      const baseVy = (dy / distance) * config.projectileSpeed;

      // Rotate velocity by angle
      const velocity = {
        x: baseVx * Math.cos(angleRad) - baseVy * Math.sin(angleRad),
        y: baseVx * Math.sin(angleRad) + baseVy * Math.cos(angleRad),
      };

      const projectile = pool.acquire('pumpkin', boss.position, velocity, config.projectileSize);
      projectiles.push(projectile);
    });
  } else {
    // Single shot toward player
    const dx = playerPos.x - boss.position.x;
    const dy = playerPos.y - boss.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const velocity = {
      x: (dx / distance) * config.projectileSpeed,
      y: (dy / distance) * config.projectileSpeed,
    };

    const projectile = pool.acquire('pumpkin', boss.position, velocity, config.projectileSize);
    projectiles.push(projectile);
  }

  return projectiles;
};

// Projectile rendering functions
const renderInkBlob = (ctx: CanvasRenderingContext2D, projectile: Projectile, time: number) => {
  const { x, y } = projectile.position;
  const radius = projectile.size;

  // Outer glow (cyan)
  ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Dark purple blob
  ctx.fillStyle = '#4B0082';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Animated ripple effect
  const ripplePhase = (time * 0.01) % (Math.PI * 2);
  const rippleRadius = radius * 0.7 + Math.sin(ripplePhase) * 3;
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(x, y, rippleRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
};

const renderPumpkin = (ctx: CanvasRenderingContext2D, projectile: Projectile, time: number) => {
  const { x, y } = projectile.position;
  const radius = projectile.size;

  // Pumpkin body (orange)
  ctx.fillStyle = '#FF8C00';
  ctx.shadowColor = '#FF8C00';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Pumpkin ridges
  ctx.strokeStyle = '#D2691E';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * (radius * 0.4), y - radius);
    ctx.quadraticCurveTo(x + i * (radius * 0.4), y, x + i * (radius * 0.4), y + radius);
    ctx.stroke();
  }

  // Green stem
  ctx.fillStyle = '#228B22';
  ctx.fillRect(x - 2, y - radius - 4, 4, 4);

  // Jack-o-lantern face
  ctx.fillStyle = '#000000';

  // Left eye (triangle)
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.5, y - radius * 0.2);
  ctx.lineTo(x - radius * 0.3, y - radius * 0.4);
  ctx.lineTo(x - radius * 0.3, y);
  ctx.closePath();
  ctx.fill();

  // Right eye (triangle)
  ctx.beginPath();
  ctx.moveTo(x + radius * 0.5, y - radius * 0.2);
  ctx.lineTo(x + radius * 0.3, y - radius * 0.4);
  ctx.lineTo(x + radius * 0.3, y);
  ctx.closePath();
  ctx.fill();

  // Evil grin
  ctx.beginPath();
  ctx.arc(x, y + radius * 0.2, radius * 0.4, 0.2, Math.PI - 0.2);
  ctx.fill();

  // Teeth
  ctx.fillStyle = '#FF8C00';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(
      x - radius * 0.3 + i * (radius * 0.2),
      y + radius * 0.2,
      radius * 0.15,
      radius * 0.25
    );
  }
};

// Boss collision detection
const checkBossCollision = (playerPos: Position, boss: Boss): boolean => {
  const radius = boss.type === 'octopus' ? 40 : 30;
  const dx = playerPos.x - boss.position.x;
  const dy = playerPos.y - boss.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < radius + GAME_CONFIG.playerSize / 2;
};

// Handle boss hit
const handleBossHit = (boss: Boss): number => {
  boss.health -= 1;
  boss.hitFlashTime = Date.now();

  // Return bounce velocity based on boss type
  return boss.type === 'octopus' ? -8 : -7;
};

// Projectile collision detection
const checkProjectileCollision = (playerPos: Position, projectile: Projectile): boolean => {
  const dx = playerPos.x - projectile.position.x;
  const dy = playerPos.y - projectile.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < projectile.size + GAME_CONFIG.playerSize / 2;
};

// Handle projectile hit
const handleProjectileHit = (
  projectile: Projectile,
  shieldActive: boolean,
  fireActive: boolean,
  pool: ProjectilePool
): { gameOver: boolean; bonusPoints: number } => {
  let gameOver = false;
  let bonusPoints = 0;

  // Shield blocks projectile
  if (shieldActive) {
    pool.release(projectile);
    // Play shield sound (reuse power-up sound)
    playPowerUpSound();
    return { gameOver: false, bonusPoints: 0 };
  }

  // Fire destroys projectile and awards points for pumpkins
  if (fireActive) {
    pool.release(projectile);
    if (projectile.type === 'pumpkin') {
      bonusPoints = 5;
      playKillSound();
    }
    return { gameOver: false, bonusPoints };
  }

  // No protection - game over
  gameOver = true;
  pool.release(projectile);

  return { gameOver, bonusPoints };
};

// Custom CSS animations for interactive scorecard
const scorecardStyles = `
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes slide-in {
    from { 
      transform: translateX(100px);
      opacity: 0;
    }
    to { 
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 2s ease-in-out infinite;
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 3s ease-in-out infinite;
  }
  
  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }
  
  .animate-slide-in {
    animation: slide-in 0.5s ease-out;
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = scorecardStyles;
  document.head.appendChild(styleSheet);
}

const GAME_CONFIG: GameConfig = {
  gridWidth: 600,
  gridHeight: 400,
  playerSize: 20,
  snakeSize: 14,
  gravity: 0.4,
  jumpForce: -6,
  levelSpeeds: {
    easy: 1,
    medium: 2,
    hard: 3,
  },
  snakeCount: {
    easy: 3,
    medium: 6,
    hard: 9,
  },
  obstacleCount: {
    easy: 1,
    medium: 2,
    hard: 3,
  },
};

type BackgroundTheme = 'beach' | 'night' | 'retro' | 'desert' | 'halloween' | 'underwater';
type CharacterSkin = 'orange' | 'blue' | 'pink' | 'green' | 'purple' | 'witch' | 'ghost';

const BACKGROUND_THEMES: BackgroundTheme[] = ['beach', 'night', 'retro', 'desert'];

// UNDERWATER LEVEL - Currently disabled
const UNDERWATER_LEVEL_ENABLED = false; // Set to true to enable
const UNDERWATER_THEME: BackgroundTheme = 'underwater';

// ============================================
// 🎃 HALLOWEEN EVENT - TEMPORARY 🎃
// ============================================
// To disable: Set HALLOWEEN_EVENT_ACTIVE = false
// To remove completely: Search for "HALLOWEEN" and remove all related code
// ============================================
const HALLOWEEN_EVENT_ACTIVE = true; // Set to false to disable
const HALLOWEEN_THEME: BackgroundTheme = 'halloween';

// ML-based player profile for adaptive difficulty
type PlayerProfile = {
  totalGames: number;
  totalScore: number;
  averageScore: number;
  averageJumps: number;
  averageSurvivalTime: number;
  reactionTime: number; // Average time between jumps
  skillLevel: number; // 0-1 scale
  lastUpdated: number;
};

const getPlayerProfile = (username: string): PlayerProfile => {
  const stored = localStorage.getItem(`player_profile_${username}`);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    totalGames: 0,
    totalScore: 0,
    averageScore: 0,
    averageJumps: 0,
    averageSurvivalTime: 0,
    reactionTime: 500,
    skillLevel: 0.5,
    lastUpdated: Date.now(),
  };
};

const updatePlayerProfile = (
  username: string,
  gameData: {
    score: number;
    jumps: number;
    survivalTime: number;
    reactionTimes: number[];
  }
) => {
  const profile = getPlayerProfile(username);

  profile.totalGames += 1;
  profile.totalScore += gameData.score;
  profile.averageScore = profile.totalScore / profile.totalGames;

  // Exponential moving average for recent performance
  const alpha = 0.3; // Weight for new data
  profile.averageJumps = profile.averageJumps * (1 - alpha) + gameData.jumps * alpha;
  profile.averageSurvivalTime =
    profile.averageSurvivalTime * (1 - alpha) + gameData.survivalTime * alpha;

  // Calculate average reaction time
  if (gameData.reactionTimes.length > 0) {
    const avgReaction =
      gameData.reactionTimes.reduce((a, b) => a + b, 0) / gameData.reactionTimes.length;
    profile.reactionTime = profile.reactionTime * (1 - alpha) + avgReaction * alpha;
  }

  // Calculate skill level (0-1) based on multiple factors
  const scoreSkill = Math.min(profile.averageScore / 200, 1); // Max at 200 points
  const survivalSkill = Math.min(profile.averageSurvivalTime / 60000, 1); // Max at 60 seconds
  const reactionSkill = Math.max(0, 1 - profile.reactionTime / 1000); // Faster = better

  profile.skillLevel = scoreSkill * 0.4 + survivalSkill * 0.4 + reactionSkill * 0.2;
  profile.lastUpdated = Date.now();

  localStorage.setItem(`player_profile_${username}`, JSON.stringify(profile));
  return profile;
};

const SKIN_COLORS: Record<CharacterSkin, { primary: string; secondary: string }> = {
  orange: { primary: '#FFB347', secondary: '#FF8C00' },
  blue: { primary: '#87CEEB', secondary: '#4682B4' },
  pink: { primary: '#FFB6C1', secondary: '#FF69B4' },
  green: { primary: '#90EE90', secondary: '#32CD32' },
  purple: { primary: '#DDA0DD', secondary: '#9370DB' },
  // HALLOWEEN EVENT - Special skins
  witch: { primary: '#8B4513', secondary: '#654321' }, // Light brown witch hat for visibility
  ghost: { primary: '#FFFFFF', secondary: '#E6E6FA' }, // White ghost
};

// Sound effect functions
const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    // Silently fail if audio context not available
  }
};

const playJumpSound = () => playSound(400, 0.1, 'sine');
const playCollisionSound = () => {
  playSound(100, 0.3, 'sawtooth');
  setTimeout(() => playSound(80, 0.2, 'sawtooth'), 100);
};
const playPointSound = () => playSound(600, 0.1, 'square');
const playPowerUpSound = () => {
  playSound(800, 0.1, 'sine');
  setTimeout(() => playSound(1000, 0.1, 'sine'), 100);
};

// Halloween spooky sounds - temporary
const playSpookySound = () => {
  playSound(150, 0.3, 'sawtooth');
  setTimeout(() => playSound(120, 0.3, 'sawtooth'), 150);
  setTimeout(() => playSound(100, 0.4, 'sawtooth'), 300);
};
const playWitchCackle = () => {
  playSound(800, 0.05, 'square');
  setTimeout(() => playSound(600, 0.05, 'square'), 50);
  setTimeout(() => playSound(800, 0.05, 'square'), 100);
  setTimeout(() => playSound(600, 0.05, 'square'), 150);
};
const playFireSound = () => {
  playSound(200, 0.15, 'sawtooth');
  setTimeout(() => playSound(180, 0.15, 'sawtooth'), 50);
  setTimeout(() => playSound(220, 0.15, 'sawtooth'), 100);
};
const playKillSound = () => {
  playSound(1000, 0.1, 'square');
  setTimeout(() => playSound(800, 0.1, 'square'), 50);
};

// HALLOWEEN EVENT - Evil laughter on death
const playEvilLaugh = () => {
  // Evil descending laugh
  playSound(600, 0.15, 'sawtooth');
  setTimeout(() => playSound(550, 0.15, 'sawtooth'), 150);
  setTimeout(() => playSound(500, 0.15, 'sawtooth'), 300);
  setTimeout(() => playSound(450, 0.15, 'sawtooth'), 450);
  setTimeout(() => playSound(400, 0.2, 'sawtooth'), 600);
  setTimeout(() => playSound(350, 0.25, 'sawtooth'), 800);
};

// Boss sound effects
const playBossHitSound = () => playSound(800, 0.15, 'square');
const playBossDefeatedSound = () => {
  // Ascending victory tones
  playSound(1200, 0.1, 'sine');
  setTimeout(() => playSound(1300, 0.1, 'sine'), 100);
  setTimeout(() => playSound(1400, 0.1, 'sine'), 200);
  setTimeout(() => playSound(1500, 0.1, 'sine'), 300);
  setTimeout(() => playSound(1600, 0.15, 'sine'), 400);
};
const playProjectileThrowSound = () => playSound(400, 0.1, 'sawtooth');
const playBossEntranceSound = () => {
  // Dramatic low tone
  playSound(150, 0.3, 'sawtooth');
  setTimeout(() => playSound(120, 0.4, 'sawtooth'), 300);
};

// Boss UI rendering functions
const renderBossHealthBar = (ctx: CanvasRenderingContext2D, boss: Boss) => {
  const barWidth = 200;
  const barHeight = 20;
  const barX = (GAME_CONFIG.gridWidth - barWidth) / 2;
  const barY = 20;

  const healthPercent = boss.health / boss.maxHealth;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(barX - 5, barY - 25, barWidth + 10, 70);

  // Boss name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(
    boss.type === 'octopus' ? 'OCTOPUS BOSS' : 'BAT BOSS',
    GAME_CONFIG.gridWidth / 2,
    barY - 8
  );

  // Health bar border with glow
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 10;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  ctx.shadowBlur = 0;

  // Health bar background
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Health bar fill with gradient
  const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * healthPercent, barY);
  if (healthPercent > 0.5) {
    gradient.addColorStop(0, '#00FF00');
    gradient.addColorStop(1, '#7FFF00');
  } else if (healthPercent > 0.25) {
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
  } else {
    gradient.addColorStop(0, '#FF4500');
    gradient.addColorStop(1, '#FF0000');
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

  // Health text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${boss.health} / ${boss.maxHealth}`, GAME_CONFIG.gridWidth / 2, barY + 14);

  // Instruction text - pulsing
  const pulseAlpha = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
  ctx.globalAlpha = pulseAlpha;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 11px Arial';
  ctx.fillText(
    '⚔️ BOSS WILL CHASE YOU! COLLIDE TO ATTACK! ⚔️',
    GAME_CONFIG.gridWidth / 2,
    barY + 30
  );
  ctx.globalAlpha = 1;
};

const renderBossEntrance = (ctx: CanvasRenderingContext2D, boss: Boss, elapsedTime: number) => {
  const duration = 2000; // 2 seconds
  const progress = Math.min(elapsedTime / duration, 1);

  // Dark background overlay fade in
  ctx.fillStyle = `rgba(0, 0, 0, ${progress * 0.5})`;
  ctx.fillRect(0, 0, GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight);

  // Boss name appears after 0.3s
  if (elapsedTime > 300) {
    const textProgress = Math.min((elapsedTime - 300) / 500, 1);
    ctx.globalAlpha = textProgress;

    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      boss.type === 'octopus' ? 'OCTOPUS BOSS' : 'BAT BOSS',
      GAME_CONFIG.gridWidth / 2,
      GAME_CONFIG.gridHeight / 2 - 50
    );

    ctx.font = 'bold 24px Arial';
    ctx.fillText('APPEARS!', GAME_CONFIG.gridWidth / 2, GAME_CONFIG.gridHeight / 2);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Boss slides in from right after 0.5s
  if (elapsedTime > 500) {
    const slideProgress = Math.min((elapsedTime - 500) / 1500, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - slideProgress, 3);

    const startX = GAME_CONFIG.gridWidth + 100;
    const targetX = boss.type === 'octopus' ? 500 : 300;
    const currentX = startX + (targetX - startX) * eased;

    const tempBoss = { ...boss, position: { ...boss.position, x: currentX } };

    if (boss.type === 'octopus') {
      renderOctopusBoss(ctx, tempBoss, Date.now());
    } else {
      renderBatBoss(ctx, tempBoss, Date.now());
    }
  }
};

const renderVictoryAnimation = (ctx: CanvasRenderingContext2D, boss: Boss, elapsedTime: number) => {
  const duration = 1000; // 1 second
  const progress = Math.min(elapsedTime / duration, 1);

  // Fade out and shrink boss
  ctx.globalAlpha = 1 - progress;
  const scale = 1 - progress * 0.5;

  ctx.save();
  ctx.translate(boss.position.x, boss.position.y);
  ctx.scale(scale, scale);
  ctx.translate(-boss.position.x, -boss.position.y);

  if (boss.type === 'octopus') {
    renderOctopusBoss(ctx, boss, Date.now());
  } else {
    renderBatBoss(ctx, boss, Date.now());
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  // Victory text
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 30;
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', GAME_CONFIG.gridWidth / 2, GAME_CONFIG.gridHeight / 2 - 30);

  // Bonus points
  const bonusPoints = boss.type === 'octopus' ? 50 : 100;
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = '#00FF00';
  ctx.fillText(
    `+${bonusPoints} POINTS!`,
    GAME_CONFIG.gridWidth / 2,
    GAME_CONFIG.gridHeight / 2 + 20
  );
  ctx.shadowBlur = 0;
};

// HALLOWEEN EVENT - Spooky background music loop
let spookyMusicInterval: number | undefined;
const startSpookyMusic = () => {
  if (spookyMusicInterval) return; // Already playing

  const notes = [220, 233, 196, 185, 220, 233, 196, 185]; // Spooky melody
  let noteIndex = 0;

  spookyMusicInterval = window.setInterval(() => {
    const note = notes[noteIndex % notes.length];
    if (note) {
      playSound(note, 0.3, 'triangle');
    }
    noteIndex++;
  }, 800);
};

const stopSpookyMusic = () => {
  if (spookyMusicInterval !== undefined) {
    window.clearInterval(spookyMusicInterval);
    spookyMusicInterval = undefined;
  }
};

type GameProps = {
  username: string;
  onScoreUpdate: (score: number, level: GameLevel) => void;
};

export const Game = ({ username, onScoreUpdate }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const projectilePoolRef = useRef<ProjectilePool>(new ProjectilePool());
  const [selectedSkin, setSelectedSkin] = useState<CharacterSkin>('orange');

  // ML tracking refs
  const gameStartTime = useRef<number>(0);
  const jumpCount = useRef<number>(0);
  const lastJumpTime = useRef<number>(0);
  const reactionTimes = useRef<number[]>([]);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() =>
    getPlayerProfile(username)
  );

  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.3);
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if first-time user and load settings
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
    
    const savedVolume = localStorage.getItem('soundVolume');
    if (savedVolume) {
      setSoundVolume(parseFloat(savedVolume));
    }
  }, []);
  useEffect((=> {
    const hasSeenTutorial = localStorage.getItem('hasSeenTal');
    if (!hasSeenTu{
      setShowTutoria
    }
    
    // Load savs
    const savedVole');
    if (savedVolume) {
      setSoun
    }
  }, []);

  const [gameState, setGtate>({GameSseState<tate] = umeSalume));loat(savedVo(parseFdVolumeundVolum'soetItem(Storage.gme = localud settingetrue);l() torialutori) 
    player: {
      position: { x: 150, y: GAME_CONFIG.gridHeight / 2 },
      velocity: 0,
      isAlive: true,
      skin: 'orange',
    },
    snakes: [],
    obstacles: [],
    powerUps: [],
    score: 0,
    level: 'easy',
    isGameOver: false,
    isPlaying: false,
    shieldActive: false,
    shieldEndTime: 0,
    fireActive: false,
    fireEndTime: 0,
    bossState: {
      currentBoss: null,
      bossEncounterActive: false,
      bossTransitionPhase: null,
      transitionStartTime: 0,
      projectiles: [],
      defeatedBosses: [],
    },
  });

  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>('beach');
  const [showGameOverUI, setShowGameOverUI] = useState(false);

  // Handle delayed game over screen (5 seconds for screenshots)
  useEffect(() => {
    if (gameState.isGameOver && !showGameOverUI) {
      const timer = setTimeout(() => {
        setShowGameOverUI(true);
      }, 5000); // 5 second delay

      return () => clearTimeout(timer);
    } else if (!gameState.isGameOver) {
      setShowGameOverUI(false);
    }
  }, [gameState.isGameOver, showGameOverUI]);

  // HALLOWEEN EVENT - Spooky music control
  useEffect(() => {
    if (HALLOWEEN_EVENT_ACTIVE && gameState.isPlaying && !gameState.isGameOver) {
      startSpookyMusic();
    } else {
      stopSpookyMusic();
    }

    return () => stopSpookyMusic();
  }, [gameState.isPlaying, gameState.isGameOver]);

  const generateSnake = useCallback((level: GameLevel, profile: PlayerProfile): Snake => {
    const baseSpeed = GAME_CONFIG.levelSpeeds[level];

    // Adaptive speed based on player skill (±30% adjustment)
    const speedMultiplier = 0.85 + profile.skillLevel * 0.3;
    const speed = baseSpeed * speedMultiplier;

    const colors = ['#228B22', '#8B0000', '#4B0082', '#FF8C00', '#2F4F4F', '#8B4513'];
    const snakeColor = colors[Math.floor(Math.random() * colors.length)] || '#228B22';

    // Adaptive pattern: more coiling snakes for skilled players
    const coilingChance = 0.3 + profile.skillLevel * 0.3; // 30-60% based on skill
    const pattern = Math.random() < coilingChance ? 'spinning' : 'normal';

    return {
      id: Math.random().toString(36).substring(2, 9),
      position: {
        x: GAME_CONFIG.gridWidth + 50,
        y: Math.random() * (GAME_CONFIG.gridHeight - 60) + 30,
      },
      direction: { x: -1, y: Math.random() > 0.5 ? 0.5 : -0.5 },
      speed,
      length: pattern === 'spinning' ? 70 : 45 + Math.random() * 35,
      width: pattern === 'spinning' ? 14 : 10 + Math.random() * 6,
      color: snakeColor,
      pattern,
      rotation: 0,
    };
  }, []);

  const generateObstacle = useCallback((theme: BackgroundTheme): Obstacle => {
    // UNDERWATER LEVEL - Generate underwater obstacles
    if (theme === 'underwater' && UNDERWATER_LEVEL_ENABLED) {
      const obstacleTypes: Array<'fish' | 'eel' | 'shark' | 'coral'> = ['fish', 'eel', 'shark', 'coral'];
      const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      
      if (randomType === 'coral') {
        // Coral pillars (like normal pillars but underwater themed)
        return {
          id: Math.random().toString(36).substring(2, 9),
          type: 'coral',
          position: {
            x: GAME_CONFIG.gridWidth + Math.random() * 200 + 100,
            y: GAME_CONFIG.gridHeight - 60,
          },
          width: 25,
          height: 80,
        };
      } else if (randomType === 'fish') {
        return {
          id: Math.random().toString(36).substring(2, 9),
          type: 'fish',
          position: {
            x: GAME_CONFIG.gridWidth + Math.random() * 200 + 100,
            y: 80 + Math.random() * (GAME_CONFIG.gridHeight - 160),
          },
          width: 30,
          height: 20,
          floatOffset: Math.random() * Math.PI * 2,
          swimDirection: Math.random() > 0.5 ? 1 : -1,
        };
      } else if (randomType === 'eel') {
        return {
          id: Math.random().toString(36).substring(2, 9),
          type: 'eel',
          position: {
            x: GAME_CONFIG.gridWidth + Math.random() * 200 + 100,
            y: 100 + Math.random() * (GAME_CONFIG.gridHeight - 200),
          },
          width: 50,
          height: 15,
          floatOffset: Math.random() * Math.PI * 2,
          swimDirection: 1,
        };
      } else {
        // Shark
        return {
          id: Math.random().toString(36).substring(2, 9),
          type: 'shark',
          position: {
            x: GAME_CONFIG.gridWidth + Math.random() * 200 + 100,
            y: 120 + Math.random() * (GAME_CONFIG.gridHeight - 240),
          },
          width: 60,
          height: 30,
          floatOffset: Math.random() * Math.PI * 2,
          swimDirection: 1,
        };
      }
    }
    
    // HALLOWEEN EVENT - 50% chance to spawn ghost instead of pillar
    const isGhost = HALLOWEEN_EVENT_ACTIVE && Math.random() < 0.5;
    
    if (isGhost) {
      return {
        id: Math.random().toString(36).substring(2, 9),
        type: 'ghost',
        position: {
          x: GAME_CONFIG.gridWidth + Math.random() * 200 + 100,
          y: 80 + Math.random() * (GAME_CONFIG.gridHeight - 160), // Float anywhere in middle
        },
        width: 40,
        height: 50,
        floatOffset: Math.random() * Math.PI * 2, // Random starting phase for floating
      };
    }
    
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'pillar',
      position: {
        x: GAME_CONFIG.gridWidth + Math.random() * 200 + 100,
        y: GAME_CONFIG.gridHeight - 60,
      },
      width: 20,
      height: 60,
    };
  }, []);

  const initializeGame = useCallback(
    (level: GameLevel) => {
      const profile = getPlayerProfile(username);
      const snakes: Snake[] = [];
      const obstacles: Obstacle[] = [];

      // Adaptive obstacle count based on player skill
      const baseSnakeCount = GAME_CONFIG.snakeCount[level];
      const baseObstacleCount = GAME_CONFIG.obstacleCount[level];

      // Adjust counts: beginners get fewer, skilled players get more
      const snakeCount = Math.max(1, Math.round(baseSnakeCount * (0.7 + profile.skillLevel * 0.6)));
      const obstacleCount = Math.max(
        1,
        Math.round(baseObstacleCount * (0.7 + profile.skillLevel * 0.6))
      );

      // Randomly select background theme (or force special themes if active)
      let randomTheme: BackgroundTheme;
      if (UNDERWATER_LEVEL_ENABLED) {
        randomTheme = UNDERWATER_THEME;
      } else if (HALLOWEEN_EVENT_ACTIVE) {
        randomTheme = HALLOWEEN_THEME;
      } else {
        randomTheme = BACKGROUND_THEMES[Math.floor(Math.random() * BACKGROUND_THEMES.length)] || 'beach';
      }
      setBackgroundTheme(randomTheme);

      // Create a combined array of all obstacles with proper spacing
      // Ensure snakes and obstacles NEVER spawn together - strict separation
      const allObstacles: Array<{ type: 'snake' | 'pillar' | 'tree'; position: number }> = [];

      // Strategy: Alternate between snakes and pillars with buffer zones
      // Pattern: Snake -> Buffer -> Pillar -> Buffer -> Snake -> ...

      let snakeIndex = 0;
      let pillarIndex = 0;

      // Alternate placement with guaranteed separation
      let position = 0;
      while (snakeIndex < snakeCount || pillarIndex < obstacleCount) {
        // Add snake if available
        if (snakeIndex < snakeCount) {
          allObstacles.push({ type: 'snake', position: position });
          position += 2; // Move to next slot
          snakeIndex++;
        }

        // Add pillar if available (with buffer from snake)
        if (pillarIndex < obstacleCount) {
          allObstacles.push({ type: 'pillar', position: position });
          position += 2; // Move to next slot
          pillarIndex++;
        }
      }

      // Sort by position to ensure proper order
      allObstacles.sort((a, b) => a.position - b.position);

      // Adaptive spacing: skilled players get tighter spacing
      const baseSpacing = 250;
      const spacing = Math.max(180, baseSpacing - profile.skillLevel * 70);

      // Generate obstacles with adaptive spacing
      let currentX = GAME_CONFIG.gridWidth + 100;

      allObstacles.forEach((item) => {
        if (item.type === 'snake') {
          const snake = generateSnake(level, profile);
          snake.position.x = currentX;
          snakes.push(snake);
          currentX += spacing;
        } else if (item.type === 'pillar') {
          const obstacle = generateObstacle(randomTheme);
          obstacle.position.x = currentX;
          obstacles.push(obstacle);
          currentX += spacing;
        }
      });

      // Generate multiple shields at random positions throughout the level
      // Beginners get more shields
      const shieldCount = level === 'easy' ? 3 : level === 'medium' ? 2 : 1;
      const adaptiveShieldCount = Math.max(
        1,
        Math.round(shieldCount * (1.5 - profile.skillLevel * 0.5))
      );
      const powerUps = [];

      for (let i = 0; i < adaptiveShieldCount; i++) {
        powerUps.push({
          id: Math.random().toString(36).substring(2, 9),
          type: 'shield' as const,
          position: {
            x: GAME_CONFIG.gridWidth + 300 + Math.random() * 800 + i * 600,
            y: 80 + Math.random() * (GAME_CONFIG.gridHeight - 160),
          },
          collected: false,
        });
      }

      // HALLOWEEN EVENT - Add rare fire power-up (only during Halloween)
      if (HALLOWEEN_EVENT_ACTIVE) {
        // 30% chance to spawn fire power-up (rare)
        if (Math.random() < 0.3) {
          powerUps.push({
            id: Math.random().toString(36).substring(2, 9),
            type: 'fire' as const,
            position: {
              x: GAME_CONFIG.gridWidth + 1000 + Math.random() * 1500,
              y: 80 + Math.random() * (GAME_CONFIG.gridHeight - 160),
            },
            collected: false,
          });
        }

        // HALLOWEEN EVENT - Add super rare candy power-up (10% chance)
        if (Math.random() < 0.1) {
          powerUps.push({
            id: Math.random().toString(36).substring(2, 9),
            type: 'candy' as const,
            position: {
              x: GAME_CONFIG.gridWidth + 1500 + Math.random() * 2000,
              y: 80 + Math.random() * (GAME_CONFIG.gridHeight - 160),
            },
            collected: false,
          });
        }
      }

      // Reset ML tracking
      gameStartTime.current = Date.now();
      jumpCount.current = 0;
      lastJumpTime.current = 0;
      reactionTimes.current = [];

      setGameState({
        player: {
          position: { x: 150, y: GAME_CONFIG.gridHeight / 2 },
          velocity: 0,
          isAlive: true,
          skin: selectedSkin,
        },
        snakes,
        obstacles,
        powerUps,
        score: 0,
        level,
        isGameOver: false,
        isPlaying: true,
        shieldActive: false,
        shieldEndTime: 0,
        fireActive: false,
        fireEndTime: 0,
        bossState: {
          currentBoss: null,
          bossEncounterActive: false,
          bossTransitionPhase: null,
          transitionStartTime: 0,
          projectiles: [],
          defeatedBosses: [],
        },
      });
    },
    [generateSnake, generateObstacle, selectedSkin, username]
  );

  const checkSnakeCollision = useCallback((playerPos: Position, snake: Snake): boolean => {
    const playerRadius = GAME_CONFIG.playerSize / 2;
    const snakeLeft = snake.position.x - snake.length / 2;
    const snakeRight = snake.position.x + snake.length / 2;
    const snakeTop = snake.position.y - snake.width / 2;
    const snakeBottom = snake.position.y + snake.width / 2;

    const closestX = Math.max(snakeLeft, Math.min(playerPos.x, snakeRight));
    const closestY = Math.max(snakeTop, Math.min(playerPos.y, snakeBottom));

    const distance = Math.sqrt(
      Math.pow(playerPos.x - closestX, 2) + Math.pow(playerPos.y - closestY, 2)
    );

    return distance < playerRadius;
  }, []);

  const checkObstacleCollision = useCallback((playerPos: Position, obstacle: Obstacle): boolean => {
    const playerRadius = GAME_CONFIG.playerSize / 2;

    if (obstacle.type === 'pillar') {
      const gapHeight = 100;
      const gapCenter = GAME_CONFIG.gridHeight / 2;
      const topPillarHeight = gapCenter - gapHeight / 2;
      const bottomPillarStart = gapCenter + gapHeight / 2;

      const obstacleLeft = obstacle.position.x - obstacle.width / 2;
      const obstacleRight = obstacle.position.x + obstacle.width / 2;

      if (playerPos.x + playerRadius > obstacleLeft && playerPos.x - playerRadius < obstacleRight) {
        if (playerPos.y - playerRadius < topPillarHeight) {
          return true;
        }
        if (playerPos.y + playerRadius > bottomPillarStart) {
          return true;
        }
      }
      return false;
    } else if (obstacle.type === 'ghost') {
      // HALLOWEEN EVENT - Ghost collision (circular)
      const dx = playerPos.x - obstacle.position.x;
      const dy = playerPos.y - obstacle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const ghostRadius = obstacle.width / 2;
      
      return distance < (playerRadius + ghostRadius);
    } else if (obstacle.type === 'fish' || obstacle.type === 'eel' || obstacle.type === 'shark') {
      // UNDERWATER LEVEL - Fish/eel/shark collision (elliptical)
      const dx = playerPos.x - obstacle.position.x;
      const dy = playerPos.y - obstacle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const creatureRadius = Math.max(obstacle.width, obstacle.height) / 2;
      
      return distance < (playerRadius + creatureRadius);
    } else if (obstacle.type === 'coral') {
      // UNDERWATER LEVEL - Coral collision (same as pillar)
      const gapHeight = 100;
      const gapCenter = GAME_CONFIG.gridHeight / 2;
      const topCoralHeight = gapCenter - gapHeight / 2;
      const bottomCoralStart = gapCenter + gapHeight / 2;

      const obstacleLeft = obstacle.position.x - obstacle.width / 2;
      const obstacleRight = obstacle.position.x + obstacle.width / 2;

      if (playerPos.x + playerRadius > obstacleLeft && playerPos.x - playerRadius < obstacleRight) {
        if (playerPos.y - playerRadius < topCoralHeight) {
          return true;
        }
        if (playerPos.y + playerRadius > bottomCoralStart) {
          return true;
        }
      }
      return false;
    } else {
      const obstacleLeft = obstacle.position.x - obstacle.width / 2;
      const obstacleRight = obstacle.position.x + obstacle.width / 2;
      const obstacleTop = obstacle.position.y - obstacle.height;
      const obstacleBottom = obstacle.position.y;

      const closestX = Math.max(obstacleLeft, Math.min(playerPos.x, obstacleRight));
      const closestY = Math.max(obstacleTop, Math.min(playerPos.y, obstacleBottom));

      const distance = Math.sqrt(
        Math.pow(playerPos.x - closestX, 2) + Math.pow(playerPos.y - closestY, 2)
      );

      return distance < playerRadius;
    }
  }, []);

  const updateGame = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState.isPlaying || prevState.isGameOver) return prevState;

      const newState = { ...prevState };

      // Check for boss trigger when not in boss encounter
      if (!newState.bossState.bossEncounterActive && !newState.isGameOver) {
        const bossType = shouldTriggerBoss(
          newState.score,
          HALLOWEEN_EVENT_ACTIVE,
          BOSS_BATTLES_ENABLED,
          newState.bossState.defeatedBosses
        );

        if (bossType) {
          // Start boss encounter
          newState.bossState.bossEncounterActive = true;
          newState.bossState.bossTransitionPhase = 'entrance';
          newState.bossState.transitionStartTime = Date.now();

          const config = BOSS_CONFIGS[bossType];

          // Apply skill-based health scaling
          const adjustedHealth =
            playerProfile.skillLevel > 0.7
              ? config.health + (bossType === 'octopus' ? 2 : 3)
              : config.health;

          // Create boss instance
          newState.bossState.currentBoss = {
            id: Math.random().toString(36).substring(2, 9),
            type: bossType,
            position: { ...config.position },
            health: adjustedHealth,
            maxHealth: adjustedHealth,
            isActive: false,
            lastProjectileTime: 0,
            animationPhase: 0,
            hitFlashTime: 0,
          };

          // Clear normal enemies (snakes and obstacles)
          newState.snakes = [];
          newState.obstacles = [];

          // Play boss entrance sound
          playBossEntranceSound();

          console.log(`Boss encounter started: ${bossType} at score ${newState.score}`);
        }
      }

      // Handle boss encounter phases
      if (newState.bossState.bossEncounterActive && newState.bossState.currentBoss) {
        const boss = newState.bossState.currentBoss;
        const elapsedTime = Date.now() - newState.bossState.transitionStartTime;

        if (newState.bossState.bossTransitionPhase === 'entrance') {
          // Entrance phase lasts 2 seconds
          if (elapsedTime >= 2000) {
            newState.bossState.bossTransitionPhase = 'active';
            boss.isActive = true;
          }
        } else if (newState.bossState.bossTransitionPhase === 'active') {
          // Update boss position
          let updatedBoss: Boss;
          if (boss.type === 'octopus') {
            updatedBoss = updateOctopusBoss(boss, Date.now(), newState.player.position.y);
          } else {
            updatedBoss = updateBatBoss(boss, Date.now(), newState.player.position.y);
          }
          newState.bossState.currentBoss = updatedBoss;

          // Throw projectiles
          if (updatedBoss.type === 'octopus') {
            const projectile = octopusThrowProjectile(
              updatedBoss,
              newState.player.position,
              projectilePoolRef.current,
              playerProfile.skillLevel
            );
            if (projectile) {
              newState.bossState.projectiles.push(projectile);
              playProjectileThrowSound();
            }
          } else {
            const projectiles = batThrowProjectile(
              updatedBoss,
              newState.player.position,
              projectilePoolRef.current,
              playerProfile.skillLevel
            );
            if (projectiles.length > 0) {
              newState.bossState.projectiles.push(...projectiles);
              playProjectileThrowSound();
            }
          }

          // Check boss collision with player
          if (checkBossCollision(newState.player.position, updatedBoss)) {
            const bounceVelocity = handleBossHit(updatedBoss);
            newState.player.velocity = bounceVelocity;
            playBossHitSound();

            // Award points for hitting boss
            newState.score += 5;

            console.log(`💥 Boss hit! Health: ${updatedBoss.health}/${updatedBoss.maxHealth}`);

            // Check if boss defeated
            if (updatedBoss.health <= 0) {
              console.log('🎉 Boss defeated!');
              newState.bossState.bossTransitionPhase = 'victory';
              newState.bossState.transitionStartTime = Date.now();
              updatedBoss.isActive = false;
              playBossDefeatedSound();
            }
          }
        } else if (newState.bossState.bossTransitionPhase === 'victory') {
          // Victory phase lasts 1 second
          if (elapsedTime >= 1000) {
            // Award bonus points
            const bonusPoints = boss.type === 'octopus' ? 50 : 100;
            newState.score += bonusPoints;

            // Spawn reward power-up
            const rewardType = boss.type === 'octopus' ? 'shield' : 'candy';
            newState.powerUps.push({
              id: Math.random().toString(36).substring(2, 9),
              type: rewardType,
              position: {
                x: boss.position.x,
                y: boss.position.y,
              },
              collected: false,
            });

            // Mark boss as defeated
            newState.bossState.defeatedBosses.push(boss.type);

            // End boss encounter
            newState.bossState.bossEncounterActive = false;
            newState.bossState.currentBoss = null;
            newState.bossState.bossTransitionPhase = null;
            newState.bossState.projectiles = [];

            // Resume normal enemy spawning - regenerate snakes and obstacles
            console.log('🎮 Boss defeated! Respawning enemies...');
            
            // Regenerate snakes
            const profile = getPlayerProfile(username);
            const baseSnakeCount = GAME_CONFIG.snakeCount[newState.level];
            const snakeCount = Math.max(1, Math.round(baseSnakeCount * (0.7 + profile.skillLevel * 0.6)));
            
            for (let i = 0; i < snakeCount; i++) {
              const snake = generateSnake(newState.level, profile);
              snake.position.x = GAME_CONFIG.gridWidth + 100 + i * 250;
              newState.snakes.push(snake);
            }
            
            // Regenerate obstacles
            const baseObstacleCount = GAME_CONFIG.obstacleCount[newState.level];
            const obstacleCount = Math.max(1, Math.round(baseObstacleCount * (0.7 + profile.skillLevel * 0.6)));
            
            for (let i = 0; i < obstacleCount; i++) {
              const obstacle = generateObstacle(backgroundTheme);
              obstacle.position.x = GAME_CONFIG.gridWidth + 200 + i * 300;
              newState.obstacles.push(obstacle);
            }
          }
        }
      }

      // Update projectiles during boss encounter
      if (newState.bossState.bossEncounterActive) {
        const activeProjectiles = projectilePoolRef.current.getActive();

        // Limit to 10 active projectiles
        if (activeProjectiles.length > 10) {
          const excess = activeProjectiles.slice(10);
          excess.forEach((p) => projectilePoolRef.current.release(p));
        }

        // Update projectile positions
        newState.bossState.projectiles = newState.bossState.projectiles.filter((projectile) => {
          if (!projectile.active) return false;

          // Move projectile
          projectile.position.x += projectile.velocity.x;
          projectile.position.y += projectile.velocity.y;

          // Check if off-screen
          if (
            projectile.position.x < -50 ||
            projectile.position.x > GAME_CONFIG.gridWidth + 50 ||
            projectile.position.y < -50 ||
            projectile.position.y > GAME_CONFIG.gridHeight + 50
          ) {
            projectilePoolRef.current.release(projectile);
            return false;
          }

          // Check collision with player
          if (checkProjectileCollision(newState.player.position, projectile)) {
            const result = handleProjectileHit(
              projectile,
              newState.shieldActive,
              newState.fireActive,
              projectilePoolRef.current
            );

            if (result.gameOver) {
              newState.isGameOver = true;
              newState.isPlaying = false;

              if (HALLOWEEN_EVENT_ACTIVE) {
                playEvilLaugh();
              } else {
                playCollisionSound();
              }

              // Update ML profile on game over
              const survivalTime = Date.now() - gameStartTime.current;
              const updatedProfile = updatePlayerProfile(username, {
                score: newState.score,
                jumps: jumpCount.current,
                survivalTime,
                reactionTimes: reactionTimes.current,
              });
              setPlayerProfile(updatedProfile);

              onScoreUpdate(newState.score, newState.level);
            }

            if (result.bonusPoints > 0) {
              newState.score += result.bonusPoints;
            }

            return false;
          }

          return true;
        });
      }

      // Check if shield expired
      if (newState.shieldActive && Date.now() > newState.shieldEndTime) {
        newState.shieldActive = false;
      }

      // Check if fire expired (HALLOWEEN EVENT)
      if (newState.fireActive && Date.now() > newState.fireEndTime) {
        newState.fireActive = false;
      }

      // Update player physics
      newState.player.velocity += GAME_CONFIG.gravity;
      newState.player.position.y += newState.player.velocity;

      // Keep player in bounds
      if (newState.player.position.y < 0) {
        newState.player.position.y = 0;
        newState.player.velocity = 0;
      }
      if (newState.player.position.y > GAME_CONFIG.gridHeight - GAME_CONFIG.playerSize) {
        newState.player.position.y = GAME_CONFIG.gridHeight - GAME_CONFIG.playerSize;
        newState.player.velocity = 0;
        if (!newState.shieldActive) {
          newState.isGameOver = true;
          newState.isPlaying = false;
          playCollisionSound();

          // Update ML profile on game over
          const survivalTime = Date.now() - gameStartTime.current;
          const updatedProfile = updatePlayerProfile(username, {
            score: newState.score,
            jumps: jumpCount.current,
            survivalTime,
            reactionTimes: reactionTimes.current,
          });
          setPlayerProfile(updatedProfile);

          onScoreUpdate(newState.score, newState.level);
        }
        return newState;
      }

      // Update power-ups
      newState.powerUps = newState.powerUps.map((powerUp) => {
        if (powerUp.collected) return powerUp;

        const newPowerUp = { ...powerUp };
        newPowerUp.position.x -= 1;

        // Check collision with player
        const distance = Math.sqrt(
          Math.pow(newState.player.position.x - newPowerUp.position.x, 2) +
            Math.pow(newState.player.position.y - newPowerUp.position.y, 2)
        );

        if (distance < 20 && !newPowerUp.collected) {
          newPowerUp.collected = true;

          if (newPowerUp.type === 'shield') {
            newState.shieldActive = true;
            newState.shieldEndTime = Date.now() + 20000; // 20 seconds
            playPowerUpSound();
          } else if (newPowerUp.type === 'fire') {
            // HALLOWEEN EVENT - Fire power-up
            newState.fireActive = true;
            newState.fireEndTime = Date.now() + 10000; // 10 seconds
            playFireSound();
          } else if (newPowerUp.type === 'candy') {
            // HALLOWEEN EVENT - Candy power-up (BOTH fire AND shield!)
            newState.shieldActive = true;
            newState.shieldEndTime = Date.now() + 10000; // 10 seconds
            newState.fireActive = true;
            newState.fireEndTime = Date.now() + 10000; // 10 seconds
            playPowerUpSound();
            setTimeout(() => playFireSound(), 100);
          }
        }

        // Reset if off screen at random positions
        if (newPowerUp.position.x < -50 && !newPowerUp.collected) {
          newPowerUp.position.x = GAME_CONFIG.gridWidth + Math.random() * 600 + 300;
          newPowerUp.position.y = 80 + Math.random() * (GAME_CONFIG.gridHeight - 160);
        }

        return newPowerUp;
      });

      // Update snakes
      newState.snakes = newState.snakes.filter((snake) => {
        const newSnake = { ...snake };
        newSnake.position.x += newSnake.direction.x * newSnake.speed;

        // Spinning snakes move in circular pattern
        if (newSnake.pattern === 'spinning') {
          newSnake.rotation = (newSnake.rotation || 0) + 0.1;
          newSnake.position.y += Math.sin(newSnake.rotation) * 2;
        } else {
          newSnake.position.y += newSnake.direction.y * 0.5;
        }

        if (newSnake.position.y <= 0 || newSnake.position.y >= GAME_CONFIG.gridHeight) {
          newSnake.direction.y *= -1;
        }

        // HALLOWEEN EVENT - Fire power-up kills snakes
        if (newState.fireActive && checkSnakeCollision(newState.player.position, newSnake)) {
          newState.score += 10; // 10 points for each kill
          playKillSound();
          return false; // Remove snake
        }

        if (newSnake.position.x < -50) {
          newSnake.position.x = GAME_CONFIG.gridWidth + 50;
          newSnake.position.y = Math.random() * (GAME_CONFIG.gridHeight - 100) + 50;
          newState.score += 10;
          // Halloween event - play spooky sound
          if (HALLOWEEN_EVENT_ACTIVE) {
            playSpookySound();
          } else {
            playPointSound();
          }
        }

        if (
          checkSnakeCollision(newState.player.position, newSnake) &&
          !newState.shieldActive &&
          !newState.fireActive
        ) {
          newState.isGameOver = true;
          newState.isPlaying = false;

          // Halloween event - play evil laugh on collision
          if (HALLOWEEN_EVENT_ACTIVE) {
            playEvilLaugh();
          } else {
            playCollisionSound();
          }

          // Update ML profile on game over
          const survivalTime = Date.now() - gameStartTime.current;
          const updatedProfile = updatePlayerProfile(username, {
            score: newState.score,
            jumps: jumpCount.current,
            survivalTime,
            reactionTimes: reactionTimes.current,
          });
          setPlayerProfile(updatedProfile);

          onScoreUpdate(newState.score, newState.level);
        }

        // Update the snake in the array
        const index = newState.snakes.findIndex((s) => s.id === newSnake.id);
        if (index !== -1) {
          newState.snakes[index] = newSnake;
        }

        return true; // Keep snake
      });

      // Update obstacles
      newState.obstacles = newState.obstacles.map((obstacle) => {
        const newObstacle = { ...obstacle };
        newObstacle.position.x -= 1;
        
        // HALLOWEEN EVENT - Ghosts float up and down
        if (newObstacle.type === 'ghost' && newObstacle.floatOffset !== undefined) {
          newObstacle.floatOffset += 0.05;
          newObstacle.position.y += Math.sin(newObstacle.floatOffset) * 1.5;
        }
        
        // UNDERWATER LEVEL - Fish, eels, and sharks swim with wave motion
        if ((newObstacle.type === 'fish' || newObstacle.type === 'eel' || newObstacle.type === 'shark') && 
            newObstacle.floatOffset !== undefined) {
          newObstacle.floatOffset += 0.04;
          newObstacle.position.y += Math.sin(newObstacle.floatOffset) * 2;
        }

        // Check if player passed the obstacle (for scoring)
        if (
          !newObstacle.passed &&
          newObstacle.position.x < newState.player.position.x &&
          newObstacle.position.x > newState.player.position.x - 10
        ) {
          newObstacle.passed = true;
          newState.score += 5;
          playPointSound();
        }

        if (newObstacle.position.x < -50) {
          newObstacle.position.x = GAME_CONFIG.gridWidth + Math.random() * 200 + 100;
          newObstacle.passed = false;
          
          // Reset ghost position if it's a ghost
          if (newObstacle.type === 'ghost') {
            newObstacle.position.y = 80 + Math.random() * (GAME_CONFIG.gridHeight - 160);
            newObstacle.floatOffset = Math.random() * Math.PI * 2;
          }
        }

        if (
          checkObstacleCollision(newState.player.position, newObstacle) &&
          !newState.shieldActive
        ) {
          newState.isGameOver = true;
          newState.isPlaying = false;
          playCollisionSound();

          // Update ML profile on game over
          const survivalTime = Date.now() - gameStartTime.current;
          const updatedProfile = updatePlayerProfile(username, {
            score: newState.score,
            jumps: jumpCount.current,
            survivalTime,
            reactionTimes: reactionTimes.current,
          });
          setPlayerProfile(updatedProfile);

          onScoreUpdate(newState.score, newState.level);
        }

        return newObstacle;
      });

      return newState;
    });
  }, [checkSnakeCollision, checkObstacleCollision, onScoreUpdate]);

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    playJumpSound();

    // Track jump for ML
    jumpCount.current += 1;
    const now = Date.now();
    if (lastJumpTime.current > 0) {
      const reactionTime = now - lastJumpTime.current;
      reactionTimes.current.push(reactionTime);
    }
    lastJumpTime.current = now;

    setGameState((prevState) => ({
      ...prevState,
      player: {
        ...prevState.player,
        velocity: GAME_CONFIG.jumpForce,
      },
    }));
  }, [gameState.isPlaying, gameState.isGameOver]);

  const startGame = useCallback(
    (level: GameLevel) => {
      initializeGame(level);
    },
    [initializeGame]
  );

  const restartGame = useCallback(() => {
    initializeGame(gameState.level);
  }, [initializeGame, gameState.level]);

  // Game loop
  useEffect(() => {
    if (gameState.isPlaying && !isPaused) {
      gameLoopRef.current = window.setInterval(updateGame, 16);
    } else {
      if (gameLoopRef.current !== undefined) {
        window.clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current !== undefined) {
        window.clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, isPaused, updateGame]);

  // Render game with Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = GAME_CONFIG.gridWidth;
    const displayHeight = GAME_CONFIG.gridHeight;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    ctx.scale(dpr, dpr);

    // Draw background based on theme
    if (backgroundTheme === 'halloween') {
      // HALLOWEEN SPECIAL EVENT - Dark spooky background
      const halloweenGradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.gridHeight);
      halloweenGradient.addColorStop(0, '#1a0a2e');
      halloweenGradient.addColorStop(0.5, '#2d1b3d');
      halloweenGradient.addColorStop(1, '#0f0519');
      ctx.fillStyle = halloweenGradient;
      ctx.fillRect(0, 0, GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight);

      // Red blood moon
      ctx.fillStyle = '#8B0000';
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(GAME_CONFIG.gridWidth - 80, 70, 35, 0, 2 * Math.PI);
      ctx.fill();

      // Moon craters
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#660000';
      ctx.beginPath();
      ctx.arc(GAME_CONFIG.gridWidth - 90, 65, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(GAME_CONFIG.gridWidth - 75, 75, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Flying bats
      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      const batPositions = [
        { x: 100, y: 60 },
        { x: 250, y: 90 },
        { x: 400, y: 50 },
        { x: 500, y: 80 },
      ];

      batPositions.forEach((bat, i) => {
        const wingFlap = Math.sin(Date.now() * 0.01 + i) * 5;
        // Bat body
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(bat.x, bat.y, 4, 3, 0, 0, 2 * Math.PI);
        ctx.fill();

        // Bat wings
        ctx.beginPath();
        ctx.moveTo(bat.x, bat.y);
        ctx.quadraticCurveTo(bat.x - 8, bat.y - 5 + wingFlap, bat.x - 12, bat.y);
        ctx.quadraticCurveTo(bat.x - 8, bat.y + 3, bat.x, bat.y);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(bat.x, bat.y);
        ctx.quadraticCurveTo(bat.x + 8, bat.y - 5 + wingFlap, bat.x + 12, bat.y);
        ctx.quadraticCurveTo(bat.x + 8, bat.y + 3, bat.x, bat.y);
        ctx.fill();
      });

      // HALLOWEEN EVENT - Zombies walking on ground
      const zombiePositions = [
        { x: 100, sway: 0 },
        { x: 300, sway: 1 },
        { x: 500, sway: 2 },
      ];

      zombiePositions.forEach((zombie, i) => {
        const zombieX = zombie.x + Math.sin(Date.now() * 0.001 + zombie.sway) * 10;
        const zombieY = GAME_CONFIG.gridHeight - 60;

        // Zombie body
        ctx.fillStyle = '#4a5a4a';
        ctx.fillRect(zombieX - 10, zombieY, 20, 40);

        // Torn clothes
        ctx.fillStyle = '#2a3a2a';
        ctx.fillRect(zombieX - 10, zombieY + 10, 20, 5);
        ctx.fillRect(zombieX - 10, zombieY + 25, 20, 5);

        // Zombie head
        ctx.fillStyle = '#6a8a6a';
        ctx.fillRect(zombieX - 8, zombieY - 15, 16, 15);

        // Glowing eyes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 5;
        ctx.fillRect(zombieX - 5, zombieY - 10, 3, 3);
        ctx.fillRect(zombieX + 2, zombieY - 10, 3, 3);
        ctx.shadowBlur = 0;

        // Mouth
        ctx.fillStyle = '#000000';
        ctx.fillRect(zombieX - 4, zombieY - 5, 8, 2);

        // Arms reaching out
        ctx.strokeStyle = '#6a8a6a';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        const armSway = Math.sin(Date.now() * 0.002 + i) * 5;
        ctx.beginPath();
        ctx.moveTo(zombieX - 10, zombieY + 10);
        ctx.lineTo(zombieX - 20, zombieY + 5 + armSway);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(zombieX + 10, zombieY + 10);
        ctx.lineTo(zombieX + 20, zombieY + 5 - armSway);
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.moveTo(zombieX - 5, zombieY + 40);
        ctx.lineTo(zombieX - 5, zombieY + 55);
        ctx.moveTo(zombieX + 5, zombieY + 40);
        ctx.lineTo(zombieX + 5, zombieY + 55);
        ctx.stroke();
      });

      // Spooky fog at bottom
      const fogGradient = ctx.createLinearGradient(
        0,
        GAME_CONFIG.gridHeight - 80,
        0,
        GAME_CONFIG.gridHeight
      );
      fogGradient.addColorStop(0, 'rgba(100, 100, 120, 0)');
      fogGradient.addColorStop(0.5, 'rgba(100, 100, 120, 0.3)');
      fogGradient.addColorStop(1, 'rgba(100, 100, 120, 0.5)');
      ctx.fillStyle = fogGradient;
      ctx.fillRect(0, GAME_CONFIG.gridHeight - 80, GAME_CONFIG.gridWidth, 80);

      // Spooky stars
      ctx.fillStyle = '#9370DB';
      for (let i = 0; i < 20; i++) {
        const starX = (i * 53 + 27) % GAME_CONFIG.gridWidth;
        const starY = (i * 37 + 19) % (GAME_CONFIG.gridHeight * 0.6);
        const twinkle = Math.sin(Date.now() * 0.003 + i) * 0.5 + 0.5;
        ctx.globalAlpha = twinkle;
        ctx.beginPath();
        ctx.arc(starX, starY, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (backgroundTheme === 'beach') {
      // Simple beach: Sky, Sand, Palm Trees

      // Sky (top 70%)
      const skyGradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.gridHeight * 0.7);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(1, '#B0E0E6');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight * 0.7);

      // Sand (bottom 30%)
      const sandGradient = ctx.createLinearGradient(
        0,
        GAME_CONFIG.gridHeight * 0.7,
        0,
        GAME_CONFIG.gridHeight
      );
      sandGradient.addColorStop(0, '#F4E4BC');
      sandGradient.addColorStop(0.5, '#DEB887');
      sandGradient.addColorStop(1, '#D2B48C');
      ctx.fillStyle = sandGradient;
      ctx.fillRect(
        0,
        GAME_CONFIG.gridHeight * 0.7,
        GAME_CONFIG.gridWidth,
        GAME_CONFIG.gridHeight * 0.3
      );

      // Simple palm trees on sand
      for (let i = 0; i < 3; i++) {
        const palmX = 100 + i * 200;
        const sandLevel = GAME_CONFIG.gridHeight * 0.7;

        // Palm trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(palmX - 4, sandLevel, 8, 60);

        // Palm fronds (simple)
        ctx.fillStyle = '#228B22';
        for (let j = 0; j < 6; j++) {
          const angle = (j / 6) * Math.PI * 2;
          ctx.save();
          ctx.translate(palmX, sandLevel);
          ctx.rotate(angle);
          ctx.fillRect(-18, -3, 18, 6);
          ctx.restore();
        }
      }

      // Sun
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(GAME_CONFIG.gridWidth - 60, 60, 25, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Seagulls
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const birdX = 80 + i * 160;
        const birdY = 80 + i * 20;
        ctx.beginPath();
        ctx.moveTo(birdX - 8, birdY);
        ctx.quadraticCurveTo(birdX, birdY - 4, birdX + 8, birdY);
        ctx.stroke();
      }
    } else if (backgroundTheme === 'night') {
      const nightGradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.gridHeight);
      nightGradient.addColorStop(0, '#191970');
      nightGradient.addColorStop(0.5, '#2F2F4F');
      nightGradient.addColorStop(1, '#1C1C1C');
      ctx.fillStyle = nightGradient;
      ctx.fillRect(0, 0, GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight);

      // Stars
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 25; i++) {
        const starX = (i * 47 + 23) % GAME_CONFIG.gridWidth;
        const starY = (i * 31 + 15) % (GAME_CONFIG.gridHeight * 0.6);
        const starSize = i % 3 === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.arc(starX, starY, starSize, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Moon
      ctx.fillStyle = '#F0F8FF';
      ctx.shadowColor = '#F0F8FF';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(GAME_CONFIG.gridWidth - 60, 50, 25, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Moon craters
      ctx.fillStyle = '#E6E6FA';
      ctx.beginPath();
      ctx.arc(GAME_CONFIG.gridWidth - 65, 45, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(GAME_CONFIG.gridWidth - 55, 55, 2, 0, 2 * Math.PI);
      ctx.fill();
    } else if (backgroundTheme === 'retro') {
      const retroGradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.gridHeight);
      retroGradient.addColorStop(0, '#FF1493');
      retroGradient.addColorStop(0.3, '#9932CC');
      retroGradient.addColorStop(0.7, '#4B0082');
      retroGradient.addColorStop(1, '#000000');
      ctx.fillStyle = retroGradient;
      ctx.fillRect(0, 0, GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight);

      // Grid
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < GAME_CONFIG.gridWidth; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, GAME_CONFIG.gridHeight);
        ctx.stroke();
      }
      for (let i = 0; i < GAME_CONFIG.gridHeight; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(GAME_CONFIG.gridWidth, i);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Neon sun
      ctx.fillStyle = '#FFFF00';
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(GAME_CONFIG.gridWidth - 80, 60, 20, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (backgroundTheme === 'desert') {
      const desertGradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.gridHeight);
      desertGradient.addColorStop(0, '#FFE4B5');
      desertGradient.addColorStop(0.3, '#DEB887');
      desertGradient.addColorStop(0.7, '#D2B48C');
      desertGradient.addColorStop(1, '#BC9A6A');
      ctx.fillStyle = desertGradient;
      ctx.fillRect(0, 0, GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight);

      // Sand dunes
      ctx.fillStyle = '#F4A460';
      ctx.beginPath();
      ctx.moveTo(0, GAME_CONFIG.gridHeight * 0.8);
      for (let x = 0; x <= GAME_CONFIG.gridWidth; x += 50) {
        const duneHeight = Math.sin(x * 0.01) * 30 + GAME_CONFIG.gridHeight * 0.8;
        ctx.lineTo(x, duneHeight);
      }
      ctx.lineTo(GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight);
      ctx.lineTo(0, GAME_CONFIG.gridHeight);
      ctx.closePath();
      ctx.fill();

      // Detailed sun with rays
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(GAME_CONFIG.gridWidth - 70, 70, 30, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Sun rays
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const startX = GAME_CONFIG.gridWidth - 70 + Math.cos(angle) * 35;
        const startY = 70 + Math.sin(angle) * 35;
        const endX = GAME_CONFIG.gridWidth - 70 + Math.cos(angle) * 45;
        const endY = 70 + Math.sin(angle) * 45;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // Cacti
      ctx.fillStyle = '#228B22';
      for (let i = 0; i < 4; i++) {
        const cactusX = 100 + i * 140;
        const cactusHeight = 60 + (i % 3) * 20;

        // Main cactus body
        ctx.fillRect(cactusX - 8, GAME_CONFIG.gridHeight - cactusHeight, 16, cactusHeight);

        // Cactus arms
        if (i % 2 === 0) {
          ctx.fillRect(cactusX - 20, GAME_CONFIG.gridHeight - cactusHeight + 20, 12, 8);
          ctx.fillRect(cactusX - 20, GAME_CONFIG.gridHeight - cactusHeight + 20, 8, 25);
        }
        if (i % 3 === 0) {
          ctx.fillRect(cactusX + 8, GAME_CONFIG.gridHeight - cactusHeight + 30, 12, 8);
          ctx.fillRect(cactusX + 16, GAME_CONFIG.gridHeight - cactusHeight + 30, 8, 20);
        }

        // Cactus spines
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 1;
        for (let j = 0; j < cactusHeight; j += 8) {
          ctx.beginPath();
          ctx.moveTo(cactusX - 8, GAME_CONFIG.gridHeight - cactusHeight + j);
          ctx.lineTo(cactusX - 12, GAME_CONFIG.gridHeight - cactusHeight + j);
          ctx.moveTo(cactusX + 8, GAME_CONFIG.gridHeight - cactusHeight + j);
          ctx.lineTo(cactusX + 12, GAME_CONFIG.gridHeight - cactusHeight + j);
          ctx.stroke();
        }
      }
    } else if (backgroundTheme === 'underwater') {
      // UNDERWATER LEVEL - Ocean background
      const waterGradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.gridHeight);
      waterGradient.addColorStop(0, '#1E90FF'); // Deep blue at top
      waterGradient.addColorStop(0.5, '#4682B4'); // Steel blue middle
      waterGradient.addColorStop(1, '#2F4F4F'); // Dark slate gray at bottom
      ctx.fillStyle = waterGradient;
      ctx.fillRect(0, 0, GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight);
      
      // Animated bubbles
      const bubbleCount = 15;
      for (let i = 0; i < bubbleCount; i++) {
        const bubbleX = (i * 47 + Date.now() * 0.02) % GAME_CONFIG.gridWidth;
        const bubbleY = (i * 31 + Date.now() * 0.05) % GAME_CONFIG.gridHeight;
        const bubbleSize = 2 + (i % 3);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Sea floor
      const seaFloorY = GAME_CONFIG.gridHeight - 60;
      ctx.fillStyle = '#8B7355'; // Sandy brown
      ctx.fillRect(0, seaFloorY, GAME_CONFIG.gridWidth, 60);
      
      // Sand texture
      ctx.fillStyle = '#A0826D';
      for (let x = 0; x < GAME_CONFIG.gridWidth; x += 20) {
        const waveHeight = Math.sin(x * 0.1) * 3;
        ctx.fillRect(x, seaFloorY + waveHeight, 15, 3);
      }
      
      // Shells on sea floor
      ctx.fillStyle = '#FFE4C4';
      const shellPositions = [80, 200, 350, 480];
      shellPositions.forEach((shellX) => {
        // Shell body
        ctx.beginPath();
        ctx.arc(shellX, seaFloorY + 10, 6, 0, Math.PI);
        ctx.fill();
        
        // Shell ridges
        ctx.strokeStyle = '#DEB887';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(shellX - 6 + i * 4, seaFloorY + 10);
          ctx.lineTo(shellX - 6 + i * 4, seaFloorY + 4);
          ctx.stroke();
        }
      });
      
      // Coral decorations on sea floor
      ctx.fillStyle = '#FF6B6B';
      const coralPositions = [120, 280, 420];
      coralPositions.forEach((coralX, idx) => {
        const coralHeight = 20 + (idx % 2) * 10;
        
        // Coral branches
        ctx.beginPath();
        ctx.moveTo(coralX, seaFloorY);
        ctx.lineTo(coralX - 5, seaFloorY - coralHeight * 0.6);
        ctx.lineTo(coralX - 8, seaFloorY - coralHeight);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(coralX, seaFloorY);
        ctx.lineTo(coralX + 5, seaFloorY - coralHeight * 0.7);
        ctx.lineTo(coralX + 8, seaFloorY - coralHeight);
        ctx.stroke();
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.moveTo(coralX, seaFloorY);
        ctx.lineTo(coralX, seaFloorY - coralHeight);
        ctx.stroke();
      });
      
      // Seaweed swaying
      ctx.strokeStyle = '#2E8B57';
      ctx.lineWidth = 4;
      const seaweedPositions = [50, 180, 320, 500];
      seaweedPositions.forEach((seaweedX, idx) => {
        const sway = Math.sin(Date.now() * 0.002 + idx) * 10;
        const seaweedHeight = 40 + (idx % 3) * 15;
        
        ctx.beginPath();
        ctx.moveTo(seaweedX, seaFloorY);
        ctx.quadraticCurveTo(
          seaweedX + sway,
          seaFloorY - seaweedHeight / 2,
          seaweedX + sway * 1.5,
          seaFloorY - seaweedHeight
        );
        ctx.stroke();
      });
      
      // Light rays from surface
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 30;
      for (let i = 0; i < 3; i++) {
        const rayX = 100 + i * 200;
        ctx.beginPath();
        ctx.moveTo(rayX, 0);
        ctx.lineTo(rayX + 50, GAME_CONFIG.gridHeight);
        ctx.stroke();
      }
    }

    // Draw power-ups
    gameState.powerUps.forEach((powerUp) => {
      if (powerUp.collected) return;

      if (powerUp.type === 'shield') {
        // Shield icon
        ctx.strokeStyle = '#00FFFF';
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(powerUp.position.x, powerUp.position.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Shield symbol
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(powerUp.position.x, powerUp.position.y - 8);
        ctx.lineTo(powerUp.position.x - 6, powerUp.position.y - 4);
        ctx.lineTo(powerUp.position.x - 6, powerUp.position.y + 4);
        ctx.lineTo(powerUp.position.x, powerUp.position.y + 8);
        ctx.lineTo(powerUp.position.x + 6, powerUp.position.y + 4);
        ctx.lineTo(powerUp.position.x + 6, powerUp.position.y - 4);
        ctx.closePath();
        ctx.stroke();
      } else if (powerUp.type === 'fire') {
        // HALLOWEEN EVENT - Fire power-up icon
        const fireX = powerUp.position.x;
        const fireY = powerUp.position.y;

        // Outer glow
        ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(fireX, fireY, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Fire flame shape
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(fireX, fireY - 10);
        ctx.quadraticCurveTo(fireX + 8, fireY - 5, fireX + 6, fireY + 5);
        ctx.quadraticCurveTo(fireX + 3, fireY + 8, fireX, fireY + 10);
        ctx.quadraticCurveTo(fireX - 3, fireY + 8, fireX - 6, fireY + 5);
        ctx.quadraticCurveTo(fireX - 8, fireY - 5, fireX, fireY - 10);
        ctx.fill();

        // Inner flame
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(fireX, fireY - 6);
        ctx.quadraticCurveTo(fireX + 5, fireY - 2, fireX + 4, fireY + 3);
        ctx.quadraticCurveTo(fireX + 2, fireY + 5, fireX, fireY + 6);
        ctx.quadraticCurveTo(fireX - 2, fireY + 5, fireX - 4, fireY + 3);
        ctx.quadraticCurveTo(fireX - 5, fireY - 2, fireX, fireY - 6);
        ctx.fill();

        // Hot core
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(fireX, fireY - 3);
        ctx.quadraticCurveTo(fireX + 3, fireY, fireX + 2, fireY + 2);
        ctx.quadraticCurveTo(fireX, fireY + 3, fireX - 2, fireY + 2);
        ctx.quadraticCurveTo(fireX - 3, fireY, fireX, fireY - 3);
        ctx.fill();

        // Animated sparkles
        const sparkleOffset = Math.sin(Date.now() * 0.01) * 3;
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(fireX - 8 + sparkleOffset, fireY - 8, 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fireX + 8 - sparkleOffset, fireY - 8, 2, 0, 2 * Math.PI);
        ctx.fill();
      } else if (powerUp.type === 'candy') {
        // HALLOWEEN EVENT - Candy power-up icon (super rare!)
        const candyX = powerUp.position.x;
        const candyY = powerUp.position.y;

        // Rainbow glow
        ctx.shadowColor = '#FF69B4';
        ctx.shadowBlur = 20;

        // Candy wrapper (striped)
        ctx.fillStyle = '#FF1493';
        ctx.fillRect(candyX - 10, candyY - 6, 20, 12);

        // Stripes
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(candyX - 10 + i * 5, candyY - 6, 2, 12);
        }

        // Wrapper twists
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.moveTo(candyX - 10, candyY);
        ctx.lineTo(candyX - 15, candyY - 5);
        ctx.lineTo(candyX - 15, candyY + 5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(candyX + 10, candyY);
        ctx.lineTo(candyX + 15, candyY - 5);
        ctx.lineTo(candyX + 15, candyY + 5);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // Sparkles (animated)
        const candySparkle = Math.sin(Date.now() * 0.01) * 2;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(candyX - 12 + candySparkle, candyY - 10, 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(candyX + 12 - candySparkle, candyY - 10, 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(candyX, candyY + 12, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw super cute chibi character
    const playerX = gameState.player.position.x;
    const playerY = gameState.player.position.y;
    const playerRadius = GAME_CONFIG.playerSize / 2;
    const skinColors = SKIN_COLORS[selectedSkin];

    // Shield effect
    if (gameState.shieldActive) {
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(playerX, playerY, playerRadius + 5, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // HALLOWEEN EVENT - Fire effect
    if (gameState.fireActive) {
      ctx.strokeStyle = '#FF4500';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF6600';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(playerX, playerY, playerRadius + 8, 0, 2 * Math.PI);
      ctx.stroke();

      // Flame particles around player
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.005;
        const distance = playerRadius + 10 + Math.sin(Date.now() * 0.01 + i) * 3;
        const fx = playerX + Math.cos(angle) * distance;
        const fy = playerY + Math.sin(angle) * distance;

        ctx.fillStyle = i % 2 === 0 ? '#FF4500' : '#FF8C00';
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // Body with gradient using selected skin
    const gradient = ctx.createRadialGradient(
      playerX - 2,
      playerY - 2,
      0,
      playerX,
      playerY,
      playerRadius
    );
    gradient.addColorStop(0, skinColors.primary);
    gradient.addColorStop(1, skinColors.secondary);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = skinColors.secondary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerX, playerY, playerRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Cute blush cheeks
    ctx.fillStyle = '#FF69B4';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(playerX - 6, playerY + 1, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(playerX + 6, playerY + 1, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Big sparkly eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(playerX - 3, playerY - 2, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(playerX + 3, playerY - 2, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Eye pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(playerX - 3, playerY - 2, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(playerX + 3, playerY - 2, 2, 0, 2 * Math.PI);
    ctx.fill();

    // Eye sparkles
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(playerX - 2, playerY - 3, 0.8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(playerX + 4, playerY - 3, 0.8, 0, 2 * Math.PI);
    ctx.fill();

    // Cute smile
    ctx.strokeStyle = '#FF1493';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerX, playerY + 3, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Tiny arms
    ctx.strokeStyle = '#FF6347';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(playerX - playerRadius + 1, playerY);
    ctx.lineTo(playerX - playerRadius - 3, playerY - 3);
    ctx.moveTo(playerX + playerRadius - 1, playerY);
    ctx.lineTo(playerX + playerRadius + 3, playerY - 3);
    ctx.stroke();

    // Tiny hands
    ctx.fillStyle = skinColors.primary;
    ctx.beginPath();
    ctx.arc(playerX - playerRadius - 3, playerY - 3, 1.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(playerX + playerRadius + 3, playerY - 3, 1.5, 0, 2 * Math.PI);
    ctx.fill();

    // HALLOWEEN EVENT - Special skin rendering
    if (selectedSkin === 'witch') {
      // Large witch hat (drawn AFTER body so it's on top) - LIGHT BROWN for visibility
      ctx.fillStyle = '#8B4513'; // Light brown
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;

      // Hat cone (larger and more visible)
      ctx.beginPath();
      ctx.moveTo(playerX - 12, playerY - playerRadius - 2);
      ctx.lineTo(playerX, playerY - playerRadius - 18);
      ctx.lineTo(playerX + 12, playerY - playerRadius - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Hat brim (wider)
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(playerX - 14, playerY - playerRadius - 2, 28, 4);
      ctx.strokeRect(playerX - 14, playerY - playerRadius - 2, 28, 4);

      // Hat buckle (gold)
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(playerX - 3, playerY - playerRadius - 10, 6, 4);
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 1;
      ctx.strokeRect(playerX - 3, playerY - playerRadius - 10, 6, 4);

      // Witch stars on hat
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(playerX - 8, playerY - playerRadius - 12, 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(playerX + 8, playerY - playerRadius - 12, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    } else if (selectedSkin === 'ghost') {
      // HALLOWEEN EVENT - Ghost chibi character (similar to normal chibi but ghostly)
      // Override the normal body with ghost styling

      // Ghost body - semi-transparent white with ethereal glow
      ctx.globalAlpha = 0.85;
      ctx.shadowColor = '#E6E6FA';
      ctx.shadowBlur = 15;

      const ghostGradient = ctx.createRadialGradient(
        playerX - 2,
        playerY - 2,
        0,
        playerX,
        playerY,
        playerRadius
      );
      ghostGradient.addColorStop(0, '#FFFFFF');
      ghostGradient.addColorStop(0.7, '#F0F8FF');
      ghostGradient.addColorStop(1, '#E6E6FA');

      ctx.fillStyle = ghostGradient;
      ctx.strokeStyle = '#E6E6FA';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(playerX, playerY, playerRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Pulsing ethereal aura
      const glowIntensity = 0.2 + Math.sin(Date.now() * 0.003) * 0.15;
      ctx.globalAlpha = glowIntensity;
      ctx.fillStyle = '#E6E6FA';
      ctx.beginPath();
      ctx.arc(playerX, playerY, playerRadius + 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Ghost eyes - hollow and spooky but still cute
      ctx.fillStyle = '#4B0082';
      ctx.beginPath();
      ctx.arc(playerX - 3, playerY - 2, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(playerX + 3, playerY - 2, 3, 0, 2 * Math.PI);
      ctx.fill();

      // Eye glow
      ctx.fillStyle = '#9370DB';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(playerX - 3, playerY - 2, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(playerX + 3, playerY - 2, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Eye sparkles (ghostly)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(playerX - 2, playerY - 3, 0.8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(playerX + 4, playerY - 3, 0.8, 0, 2 * Math.PI);
      ctx.fill();

      // Cute ghost smile (wavy)
      ctx.strokeStyle = '#9370DB';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playerX - 4, playerY + 3);
      ctx.quadraticCurveTo(playerX, playerY + 5, playerX + 4, playerY + 3);
      ctx.stroke();

      // Ghostly arms (semi-transparent)
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#E6E6FA';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(playerX - playerRadius + 1, playerY);
      ctx.lineTo(playerX - playerRadius - 3, playerY - 3);
      ctx.moveTo(playerX + playerRadius - 1, playerY);
      ctx.lineTo(playerX + playerRadius + 3, playerY - 3);
      ctx.stroke();

      // Ghostly hands
      ctx.fillStyle = '#F0F8FF';
      ctx.beginPath();
      ctx.arc(playerX - playerRadius - 3, playerY - 3, 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(playerX + playerRadius + 3, playerY - 3, 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Floating sparkles around ghost
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const floatOffset = Math.sin(Date.now() * 0.005) * 3;
      ctx.beginPath();
      ctx.arc(playerX - 14, playerY - 8 + floatOffset, 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(playerX + 14, playerY - 8 - floatOffset, 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(playerX, playerY - 15 + floatOffset * 0.5, 1, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw snakes (or Halloween creatures)
    gameState.snakes.forEach((snake, snakeIndex) => {
      const segments = Math.floor(snake.length / 6);
      const undulationOffset = snakeIndex * 2;
      const undulationSpeed = 0.005;
      const undulationAmplitude = 3;
      const baseColor = snake.color || '#228B22';
      const isSpinning = snake.pattern === 'spinning';

      // HALLOWEEN EVENT - Replace snakes with pumpkins and witches
      if (backgroundTheme === 'halloween') {
        const isWitch = snakeIndex % 2 === 0; // Alternate between witch and pumpkin

        if (isWitch) {
          // Draw flying witch
          const witchX = snake.position.x;
          const witchY = snake.position.y + Math.sin(Date.now() * 0.003 + snakeIndex) * 5;

          // Witch hat
          ctx.fillStyle = '#1a0a2e';
          ctx.beginPath();
          ctx.moveTo(witchX - 8, witchY - 10);
          ctx.lineTo(witchX, witchY - 20);
          ctx.lineTo(witchX + 8, witchY - 10);
          ctx.closePath();
          ctx.fill();

          // Hat brim
          ctx.fillRect(witchX - 10, witchY - 10, 20, 3);

          // Witch face
          ctx.fillStyle = '#90EE90';
          ctx.beginPath();
          ctx.arc(witchX, witchY, 8, 0, 2 * Math.PI);
          ctx.fill();

          // Evil eyes
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(witchX - 3, witchY - 2, 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(witchX + 3, witchY - 2, 2, 0, 2 * Math.PI);
          ctx.fill();

          // Wicked smile
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(witchX, witchY + 2, 4, 0.2, Math.PI - 0.2);
          ctx.stroke();

          // Broomstick
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(witchX + 8, witchY + 5);
          ctx.lineTo(witchX + 25, witchY + 8);
          ctx.stroke();

          // Broom bristles
          ctx.strokeStyle = '#DAA520';
          ctx.lineWidth = 1;
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(witchX + 22, witchY + 8);
            ctx.lineTo(witchX + 28, witchY + 6 + i * 2);
            ctx.stroke();
          }

          // Cape flowing
          ctx.fillStyle = '#4B0082';
          ctx.beginPath();
          ctx.moveTo(witchX - 8, witchY);
          ctx.quadraticCurveTo(witchX - 15, witchY + 5, witchX - 12, witchY + 12);
          ctx.lineTo(witchX - 5, witchY + 8);
          ctx.closePath();
          ctx.fill();
        } else {
          // Draw floating pumpkin
          const pumpkinX = snake.position.x;
          const pumpkinY = snake.position.y + Math.sin(Date.now() * 0.004 + snakeIndex) * 4;
          const pumpkinSize = 15;

          // Pumpkin body
          ctx.fillStyle = '#FF8C00';
          ctx.shadowColor = '#FF8C00';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.ellipse(pumpkinX, pumpkinY, pumpkinSize, pumpkinSize * 0.9, 0, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Pumpkin ridges
          ctx.strokeStyle = '#D2691E';
          ctx.lineWidth = 2;
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(pumpkinX + i * 5, pumpkinY - pumpkinSize * 0.9);
            ctx.quadraticCurveTo(
              pumpkinX + i * 5,
              pumpkinY,
              pumpkinX + i * 5,
              pumpkinY + pumpkinSize * 0.9
            );
            ctx.stroke();
          }

          // Stem
          ctx.fillStyle = '#228B22';
          ctx.fillRect(pumpkinX - 2, pumpkinY - pumpkinSize * 0.9 - 5, 4, 5);

          // Evil jack-o-lantern face
          ctx.fillStyle = '#000000';
          // Left eye
          ctx.beginPath();
          ctx.moveTo(pumpkinX - 8, pumpkinY - 5);
          ctx.lineTo(pumpkinX - 4, pumpkinY - 8);
          ctx.lineTo(pumpkinX - 4, pumpkinY - 2);
          ctx.closePath();
          ctx.fill();

          // Right eye
          ctx.beginPath();
          ctx.moveTo(pumpkinX + 8, pumpkinY - 5);
          ctx.lineTo(pumpkinX + 4, pumpkinY - 8);
          ctx.lineTo(pumpkinX + 4, pumpkinY - 2);
          ctx.closePath();
          ctx.fill();

          // Evil grin
          ctx.beginPath();
          ctx.arc(pumpkinX, pumpkinY + 3, 6, 0.2, Math.PI - 0.2);
          ctx.fill();

          // Teeth
          ctx.fillStyle = '#FF8C00';
          for (let i = 0; i < 4; i++) {
            ctx.fillRect(pumpkinX - 5 + i * 3, pumpkinY + 3, 2, 4);
          }

          // Glow effect
          ctx.fillStyle = 'rgba(255, 140, 0, 0.3)';
          ctx.beginPath();
          ctx.arc(pumpkinX, pumpkinY, pumpkinSize + 5, 0, 2 * Math.PI);
          ctx.fill();
        }
        return; // Skip normal snake rendering
      }

      // Spinning snakes coil in a circle - HIGHLY DETAILED & COLORFUL
      if (isSpinning) {
        const rotation = snake.rotation || 0;
        const coilRadius = 35; // Even larger for more presence

        // Multi-layer outer glow for dramatic effect
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 12;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(snake.position.x, snake.position.y, coilRadius + 15, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(snake.position.x, snake.position.y, coilRadius + 10, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Draw coiled snake with enhanced segments
        for (let i = 0; i < segments; i++) {
          const angle = rotation + (i / segments) * Math.PI * 6; // Even more coils
          const spiralRadius = coilRadius + Math.sin(i * 0.5) * 3; // Spiral effect
          const segmentX = snake.position.x + Math.cos(angle) * spiralRadius;
          const segmentY = snake.position.y + Math.sin(angle) * spiralRadius;
          const segmentSize = snake.width * 1.3; // Even larger segments

          // Enhanced shadow with blur
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 3;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.arc(segmentX + 2, segmentY + 2, segmentSize / 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Multi-color gradient for vibrant look
          const segGradient = ctx.createRadialGradient(
            segmentX - 2,
            segmentY - 2,
            0,
            segmentX,
            segmentY,
            segmentSize / 2
          );

          // Create color variations along the body
          const colorShift = Math.sin(i * 0.3) * 30;
          const r = parseInt(baseColor.slice(1, 3), 16);
          const g = parseInt(baseColor.slice(3, 5), 16);
          const b = parseInt(baseColor.slice(5, 7), 16);

          const brightColor = `rgb(${Math.min(255, r + colorShift + 40)}, ${Math.min(255, g + colorShift + 40)}, ${Math.min(255, b + colorShift + 40)})`;
          const midColor = baseColor;
          const darkColor = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;

          segGradient.addColorStop(0, brightColor);
          segGradient.addColorStop(0.5, midColor);
          segGradient.addColorStop(1, darkColor);

          ctx.fillStyle = segGradient;
          ctx.beginPath();
          ctx.arc(segmentX, segmentY, segmentSize / 2, 0, 2 * Math.PI);
          ctx.fill();

          // Detailed scale pattern with multiple layers
          if (i % 2 === 0) {
            // Outer scale ring
            ctx.strokeStyle = brightColor;
            ctx.globalAlpha = 0.6;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(segmentX, segmentY, segmentSize / 2.5, 0, 2 * Math.PI);
            ctx.stroke();

            // Inner scale detail
            ctx.strokeStyle = darkColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(segmentX, segmentY, segmentSize / 4, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }

          // Add diamond-shaped scale highlights
          if (i % 3 === 0) {
            ctx.fillStyle = brightColor;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(segmentX, segmentY - 2);
            ctx.lineTo(segmentX + 1.5, segmentY);
            ctx.lineTo(segmentX, segmentY + 2);
            ctx.lineTo(segmentX - 1.5, segmentY);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        // Draw spinning snake head with enhanced details
        const headAngle = rotation + Math.PI * 6;
        const headX = snake.position.x + Math.cos(headAngle) * coilRadius;
        const headY = snake.position.y + Math.sin(headAngle) * coilRadius;

        // Multi-layer head glow
        ctx.fillStyle = baseColor;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(headX, headY, snake.width * 1.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(headX, headY, snake.width * 1.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Head shape with gradient
        const headGradient = ctx.createRadialGradient(
          headX - 2,
          headY - 2,
          0,
          headX,
          headY,
          snake.width
        );
        headGradient.addColorStop(0, '#FFD700');
        headGradient.addColorStop(0.3, baseColor);
        headGradient.addColorStop(1, '#000000');
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(headX, headY, snake.width, 0, 2 * Math.PI);
        ctx.fill();

        // Glowing eyes with pupils
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(headX - 2, headY - 1.5, 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX + 2, headY + 1.5, 2, 0, 2 * Math.PI);
        ctx.fill();

        // Eye pupils
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(headX - 2, headY - 1.5, 0.8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX + 2, headY + 1.5, 0.8, 0, 2 * Math.PI);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(headX - 1.5, headY - 2, 0.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX + 2.5, headY + 1, 0.5, 0, 2 * Math.PI);
        ctx.fill();

        // Forked tongue with animation
        const tongueExtend = Math.sin(Date.now() * 0.01) * 2 + 4;
        ctx.strokeStyle = '#FF1493';
        ctx.shadowColor = '#FF1493';
        ctx.shadowBlur = 3;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(headX + snake.width - 2, headY);
        ctx.lineTo(headX + snake.width + tongueExtend, headY - 2);
        ctx.moveTo(headX + snake.width - 2, headY);
        ctx.lineTo(headX + snake.width + tongueExtend, headY + 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Normal slithering snakes
        // Draw shadow first
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        for (let i = 0; i < segments; i++) {
          const segmentX = snake.position.x - snake.length / 2 + i * 6 + 3;
          const segmentY =
            snake.position.y +
            Math.sin(i * 0.3 + Date.now() * undulationSpeed + undulationOffset) *
              undulationAmplitude +
            3;
          const segmentSize = Math.max(2, snake.width - i * 0.2);
          ctx.beginPath();
          ctx.arc(segmentX, segmentY, segmentSize / 2, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Draw snake body segments
        for (let i = 0; i < segments; i++) {
          const segmentX = snake.position.x - snake.length / 2 + i * 6;
          const segmentY =
            snake.position.y +
            Math.sin(i * 0.3 + Date.now() * undulationSpeed + undulationOffset) *
              undulationAmplitude;
          const segmentSize = Math.max(2, snake.width - i * 0.2);

          // Segment gradient for 3D effect
          const segGradient = ctx.createRadialGradient(
            segmentX - 1,
            segmentY - 1,
            0,
            segmentX,
            segmentY,
            segmentSize / 2
          );
          segGradient.addColorStop(0, baseColor + 'CC');
          segGradient.addColorStop(0.7, baseColor);
          segGradient.addColorStop(1, baseColor + '88');

          ctx.fillStyle = segGradient;
          ctx.beginPath();
          ctx.arc(segmentX, segmentY, segmentSize / 2, 0, 2 * Math.PI);
          ctx.fill();

          // Add scale pattern
          if (i % 2 === 0 && segmentSize > 4) {
            ctx.strokeStyle = baseColor + '66';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(segmentX, segmentY, segmentSize / 3, 0, 2 * Math.PI);
            ctx.stroke();
          }
        }

        // Draw detailed head (last segment)
        const headX = snake.position.x + snake.length / 2 - 3;
        const headY =
          snake.position.y +
          Math.sin((segments - 1) * 0.3 + Date.now() * undulationSpeed + undulationOffset) *
            undulationAmplitude;

        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(headX - 1, headY - 1.5, 1.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX - 1, headY + 1.5, 1.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eye pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(headX - 1, headY - 1.5, 0.6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX - 1, headY + 1.5, 0.6, 0, 2 * Math.PI);
        ctx.fill();

        // Forked tongue
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(headX + 2, headY);
        ctx.lineTo(headX + 6, headY - 1);
        ctx.moveTo(headX + 2, headY);
        ctx.lineTo(headX + 6, headY + 1);
        ctx.stroke();
      }
    });

    // Draw realistic obstacles
    gameState.obstacles.forEach((obstacle) => {
      if (obstacle.type === 'pillar') {
        const gapHeight = 100;
        const gapCenter = GAME_CONFIG.gridHeight / 2;
        const topPillarHeight = gapCenter - gapHeight / 2;
        const bottomPillarHeight = GAME_CONFIG.gridHeight - (gapCenter + gapHeight / 2);

        // Pillar gradient for 3D effect
        const pillarGradient = ctx.createLinearGradient(
          obstacle.position.x - obstacle.width / 2,
          0,
          obstacle.position.x + obstacle.width / 2,
          0
        );
        pillarGradient.addColorStop(0, '#D3D3D3');
        pillarGradient.addColorStop(0.3, '#A9A9A9');
        pillarGradient.addColorStop(0.7, '#808080');
        pillarGradient.addColorStop(1, '#696969');

        ctx.fillStyle = pillarGradient;
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;

        // Top pillar
        ctx.fillRect(obstacle.position.x - obstacle.width / 2, 0, obstacle.width, topPillarHeight);
        ctx.strokeRect(
          obstacle.position.x - obstacle.width / 2,
          0,
          obstacle.width,
          topPillarHeight
        );

        // Bottom pillar
        ctx.fillRect(
          obstacle.position.x - obstacle.width / 2,
          gapCenter + gapHeight / 2,
          obstacle.width,
          bottomPillarHeight
        );
        ctx.strokeRect(
          obstacle.position.x - obstacle.width / 2,
          gapCenter + gapHeight / 2,
          obstacle.width,
          bottomPillarHeight
        );

        // Add stone texture lines
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        for (let i = 15; i < topPillarHeight - 10; i += 12) {
          ctx.beginPath();
          ctx.moveTo(obstacle.position.x - obstacle.width / 2, i);
          ctx.lineTo(obstacle.position.x + obstacle.width / 2, i);
          ctx.stroke();
        }
        for (let i = gapCenter + gapHeight / 2 + 15; i < GAME_CONFIG.gridHeight - 15; i += 12) {
          ctx.beginPath();
          ctx.moveTo(obstacle.position.x - obstacle.width / 2, i);
          ctx.lineTo(obstacle.position.x + obstacle.width / 2, i);
          ctx.stroke();
        }

        // Pillar caps
        ctx.fillStyle = '#E5E5E5';
        ctx.fillRect(obstacle.position.x - obstacle.width / 2 - 3, 0, obstacle.width + 6, 8);
        ctx.fillRect(
          obstacle.position.x - obstacle.width / 2 - 3,
          GAME_CONFIG.gridHeight - 8,
          obstacle.width + 6,
          8
        );
      } else if (obstacle.type === 'ghost') {
        // HALLOWEEN EVENT - Draw flying ghost
        const ghostX = obstacle.position.x;
        const ghostY = obstacle.position.y;
        const ghostSize = obstacle.width / 2;
        
        // Pulsing ethereal glow
        const glowIntensity = 0.3 + Math.sin(Date.now() * 0.005 + (obstacle.floatOffset || 0)) * 0.2;
        ctx.globalAlpha = 0.85;
        ctx.shadowColor = '#E6E6FA';
        ctx.shadowBlur = 20;
        
        // Ghost body - semi-transparent white
        const ghostGradient = ctx.createRadialGradient(
          ghostX,
          ghostY - 5,
          0,
          ghostX,
          ghostY,
          ghostSize
        );
        ghostGradient.addColorStop(0, '#FFFFFF');
        ghostGradient.addColorStop(0.7, '#F0F8FF');
        ghostGradient.addColorStop(1, 'rgba(230, 230, 250, 0.5)');
        
        ctx.fillStyle = ghostGradient;
        ctx.beginPath();
        ctx.arc(ghostX, ghostY, ghostSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Wavy bottom edge
        ctx.beginPath();
        ctx.moveTo(ghostX - ghostSize, ghostY);
        for (let i = 0; i <= 4; i++) {
          const waveX = ghostX - ghostSize + (i * ghostSize / 2);
          const waveY = ghostY + ghostSize / 2 + Math.sin(Date.now() * 0.01 + i) * 3;
          ctx.lineTo(waveX, waveY);
        }
        ctx.lineTo(ghostX + ghostSize, ghostY);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Spooky eyes
        ctx.fillStyle = '#4B0082';
        ctx.beginPath();
        ctx.arc(ghostX - 8, ghostY - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ghostX + 8, ghostY - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye glow
        ctx.fillStyle = '#9370DB';
        ctx.globalAlpha = glowIntensity;
        ctx.beginPath();
        ctx.arc(ghostX - 8, ghostY - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ghostX + 8, ghostY - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Spooky mouth
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(ghostX, ghostY + 5, 3, 0, Math.PI);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      } else if (obstacle.type === 'fish') {
        // UNDERWATER LEVEL - Draw fish
        const fishX = obstacle.position.x;
        const fishY = obstacle.position.y;
        const fishWidth = obstacle.width;
        const fishHeight = obstacle.height;
        
        // Fish body (oval)
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(fishX, fishY, fishWidth / 2, fishHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Fish tail
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(fishX - fishWidth / 2, fishY);
        ctx.lineTo(fishX - fishWidth / 2 - 10, fishY - 8);
        ctx.lineTo(fishX - fishWidth / 2 - 10, fishY + 8);
        ctx.closePath();
        ctx.fill();
        
        // Fish eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(fishX + fishWidth / 4, fishY - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Fish scales
        ctx.strokeStyle = '#FF6347';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(fishX - 5 + i * 5, fishY, 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (obstacle.type === 'eel') {
        // UNDERWATER LEVEL - Draw eel
        const eelX = obstacle.position.x;
        const eelY = obstacle.position.y;
        const eelLength = obstacle.width;
        
        // Eel body (wavy line)
        ctx.strokeStyle = '#4B0082';
        ctx.lineWidth = obstacle.height;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(eelX - eelLength / 2, eelY);
        for (let i = 0; i <= 5; i++) {
          const segX = eelX - eelLength / 2 + (i * eelLength) / 5;
          const segY = eelY + Math.sin(Date.now() * 0.005 + i) * 5;
          ctx.lineTo(segX, segY);
        }
        ctx.stroke();
        
        // Eel head
        ctx.fillStyle = '#4B0082';
        ctx.beginPath();
        ctx.arc(eelX + eelLength / 2, eelY, obstacle.height / 2 + 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eel eyes (glowing)
        ctx.fillStyle = '#FFFF00';
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(eelX + eelLength / 2 - 3, eelY - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eelX + eelLength / 2 + 3, eelY - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obstacle.type === 'shark') {
        // UNDERWATER LEVEL - Draw shark
        const sharkX = obstacle.position.x;
        const sharkY = obstacle.position.y;
        const sharkWidth = obstacle.width;
        const sharkHeight = obstacle.height;
        
        // Shark body
        ctx.fillStyle = '#708090';
        ctx.beginPath();
        ctx.ellipse(sharkX, sharkY, sharkWidth / 2, sharkHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shark fin (dorsal)
        ctx.fillStyle = '#556B2F';
        ctx.beginPath();
        ctx.moveTo(sharkX, sharkY - sharkHeight / 2);
        ctx.lineTo(sharkX - 8, sharkY - sharkHeight / 2 - 12);
        ctx.lineTo(sharkX + 5, sharkY - sharkHeight / 2);
        ctx.closePath();
        ctx.fill();
        
        // Shark tail
        ctx.fillStyle = '#708090';
        ctx.beginPath();
        ctx.moveTo(sharkX - sharkWidth / 2, sharkY);
        ctx.lineTo(sharkX - sharkWidth / 2 - 15, sharkY - 10);
        ctx.lineTo(sharkX - sharkWidth / 2 - 15, sharkY + 10);
        ctx.closePath();
        ctx.fill();
        
        // Shark eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(sharkX + sharkWidth / 3, sharkY - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Shark teeth
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(sharkX + sharkWidth / 4 + i * 4, sharkY + 5);
          ctx.lineTo(sharkX + sharkWidth / 4 + i * 4 - 2, sharkY + 10);
          ctx.lineTo(sharkX + sharkWidth / 4 + i * 4 + 2, sharkY + 10);
          ctx.closePath();
          ctx.fill();
        }
      } else if (obstacle.type === 'coral') {
        // UNDERWATER LEVEL - Draw coral pillars
        const gapHeight = 100;
        const gapCenter = GAME_CONFIG.gridHeight / 2;
        const topCoralHeight = gapCenter - gapHeight / 2;
        const bottomCoralHeight = GAME_CONFIG.gridHeight - (gapCenter + gapHeight / 2);
        
        // Coral gradient
        const coralGradient = ctx.createLinearGradient(
          obstacle.position.x - obstacle.width / 2,
          0,
          obstacle.position.x + obstacle.width / 2,
          0
        );
        coralGradient.addColorStop(0, '#FF6B6B');
        coralGradient.addColorStop(0.5, '#FF8787');
        coralGradient.addColorStop(1, '#FFA5A5');
        
        ctx.fillStyle = coralGradient;
        
        // Top coral
        ctx.fillRect(obstacle.position.x - obstacle.width / 2, 0, obstacle.width, topCoralHeight);
        
        // Bottom coral
        ctx.fillRect(
          obstacle.position.x - obstacle.width / 2,
          gapCenter + gapHeight / 2,
          obstacle.width,
          bottomCoralHeight
        );
        
        // Coral texture (bumpy)
        ctx.fillStyle = '#FF5252';
        for (let y = 10; y < topCoralHeight; y += 15) {
          for (let side = 0; side < 2; side++) {
            const bumpX = obstacle.position.x + (side === 0 ? -obstacle.width / 2 : obstacle.width / 2);
            ctx.beginPath();
            ctx.arc(bumpX, y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        for (let y = gapCenter + gapHeight / 2 + 10; y < GAME_CONFIG.gridHeight; y += 15) {
          for (let side = 0; side < 2; side++) {
            const bumpX = obstacle.position.x + (side === 0 ? -obstacle.width / 2 : obstacle.width / 2);
            ctx.beginPath();
            ctx.arc(bumpX, y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    });

    // Draw boss encounter elements
    if (gameState.bossState.bossEncounterActive && gameState.bossState.currentBoss) {
      const boss = gameState.bossState.currentBoss;
      const elapsedTime = Date.now() - gameState.bossState.transitionStartTime;

      if (gameState.bossState.bossTransitionPhase === 'entrance') {
        renderBossEntrance(ctx, boss, elapsedTime);
      } else if (gameState.bossState.bossTransitionPhase === 'active') {
        // Render boss
        if (boss.type === 'octopus') {
          renderOctopusBoss(ctx, boss, Date.now());
        } else {
          renderBatBoss(ctx, boss, Date.now());
        }

        // Render boss health bar
        renderBossHealthBar(ctx, boss);

        // Render projectiles
        gameState.bossState.projectiles.forEach((projectile) => {
          if (projectile.active) {
            if (projectile.type === 'inkBlob') {
              renderInkBlob(ctx, projectile, Date.now());
            } else {
              renderPumpkin(ctx, projectile, Date.now());
            }
          }
        });
      } else if (gameState.bossState.bossTransitionPhase === 'victory') {
        renderVictoryAnimation(ctx, boss, elapsedTime);
      }
    }
  }, [gameState, backgroundTheme]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Pause/Resume with ESC or P key
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState.isPlaying && !gameState.isGameOver) {
          e.preventDefault();
          setIsPaused(prev => !prev);
        }
      }
      
      // Jump with Space or Arrow Up (only if not paused)
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !isPaused) {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump, isPaused, gameState.isPlaying, gameState.isGameOver]);

  return (
    <div className="flex flex-col items-center gap-4 p-2 sm:p-4 w-full">
      <div className="flex flex-col items-center gap-3 w-full">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center animate-fade-in">
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Snake Dodge
          </span>
          <span className="text-gray-700"> - {username}</span>
        </h1>

        {/* Interactive Scorecard */}
        <div className="flex gap-3 text-base sm:text-lg flex-wrap justify-center">
          {/* Score Card - Animated on change */}
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
            <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-2 rounded-lg border-2 border-blue-400 shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce-slow">🎯</span>
                <div className="flex flex-col">
                  <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                    Score
                  </span>
                  <span className="text-blue-900 font-black text-xl tabular-nums">
                    {gameState.score}
                  </span>
                </div>
              </div>
              {/* Sparkle effect on hover */}
              <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
            </div>
          </div>

          {/* Level Card - With difficulty indicator */}
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
            <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 px-4 py-2 rounded-lg border-2 border-purple-400 shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {gameState.level === 'easy' ? '🟢' : gameState.level === 'medium' ? '🟡' : '🔴'}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs text-purple-600 font-semibold uppercase tracking-wide">
                    Level
                  </span>
                  <span className="text-purple-900 font-black text-xl uppercase">
                    {gameState.level}
                  </span>
                </div>
              </div>
              {/* Progress bar indicator */}
              <div
                className="absolute bottom-0 left-0 h-1 bg-purple-600 transition-all duration-500"
                style={{
                  width:
                    gameState.level === 'easy'
                      ? '33%'
                      : gameState.level === 'medium'
                        ? '66%'
                        : '100%',
                }}
              ></div>
            </div>
          </div>

          {/* Skill Card - AI Indicator with animated progress */}
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
            <div
              className="relative bg-gradient-to-br from-green-50 to-green-100 px-4 py-2 rounded-lg border-2 border-green-400 shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 cursor-pointer"
              title="AI adapts difficulty to your skill"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-pulse-slow">🤖</span>
                <div className="flex flex-col">
                  <span className="text-xs text-green-600 font-semibold uppercase tracking-wide">
                    AI Skill
                  </span>
                  <span className="text-green-900 font-black text-xl tabular-nums">
                    {Math.round(playerProfile.skillLevel * 100)}%
                  </span>
                </div>
              </div>
              {/* Skill level progress bar */}
              <div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-1000"
                style={{ width: `${playerProfile.skillLevel * 100}%` }}
              ></div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Shield Card - Animated countdown */}
          {gameState.shieldActive && (
            <div className="group relative overflow-hidden animate-slide-in">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 animate-pulse-glow rounded-lg"></div>
              <div className="relative bg-gradient-to-br from-cyan-50 to-cyan-100 px-4 py-2 rounded-lg border-2 border-cyan-400 shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-spin-slow">🛡️</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-cyan-600 font-semibold uppercase tracking-wide">
                      Shield
                    </span>
                    <span className="text-cyan-900 font-black text-xl tabular-nums">
                      {Math.ceil((gameState.shieldEndTime - Date.now()) / 1000)}s
                    </span>
                  </div>
                </div>
                {/* Countdown progress bar */}
                <div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-1000"
                  style={{
                    width: `${((gameState.shieldEndTime - Date.now()) / 20000) * 100}%`,
                  }}
                ></div>
                {/* Pulsing glow */}
                <div className="absolute inset-0 bg-cyan-400 opacity-20 blur-lg animate-pulse"></div>
              </div>
            </div>
          )}

          {/* HALLOWEEN EVENT - Fire Card - Animated countdown */}
          {gameState.fireActive && (
            <div className="group relative overflow-hidden animate-slide-in">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-600 animate-pulse-glow rounded-lg"></div>
              <div className="relative bg-gradient-to-br from-orange-50 to-red-100 px-4 py-2 rounded-lg border-2 border-orange-400 shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-orange-600 font-semibold uppercase tracking-wide">
                      Fire Power
                    </span>
                    <span className="text-orange-900 font-black text-xl tabular-nums">
                      {Math.ceil((gameState.fireEndTime - Date.now()) / 1000)}s
                    </span>
                  </div>
                </div>
                {/* Countdown progress bar */}
                <div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-orange-400 to-red-600 transition-all duration-1000"
                  style={{
                    width: `${((gameState.fireEndTime - Date.now()) / 10000) * 100}%`,
                  }}
                ></div>
                {/* Pulsing glow */}
                <div className="absolute inset-0 bg-orange-400 opacity-20 blur-lg animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary - Shows during gameplay */}
        {gameState.isPlaying && (
          <div className="flex gap-2 text-xs text-gray-600 animate-fade-in">
            <span className="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-300">
              ⏱️ Games: {playerProfile.totalGames}
            </span>
            <span className="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-300">
              📊 Avg: {Math.round(playerProfile.averageScore)}
            </span>
            <span className="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-300">
              ⚡ Reaction: {Math.round(playerProfile.reactionTime)}ms
            </span>
          </div>
        )}
      </div>

      {!gameState.isPlaying && !gameState.isGameOver && (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex flex-col items-center gap-2 w-full">
            <p className="text-center text-gray-600 text-sm sm:text-base font-semibold">
              Choose your character:
            </p>
            <div className="flex gap-2 justify-center">
              {(Object.keys(SKIN_COLORS) as CharacterSkin[]).map((skin) => (
                <button
                  key={skin}
                  onClick={() => setSelectedSkin(skin)}
                  className={`w-12 h-12 rounded-full border-4 transition-all ${
                    selectedSkin === skin
                      ? 'border-blue-500 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${SKIN_COLORS[skin].primary}, ${SKIN_COLORS[skin].secondary})`,
                  }}
                  title={skin.charAt(0).toUpperCase() + skin.slice(1)}
                />
              ))}
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm sm:text-base">
            Choose your difficulty level:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => startGame('easy')}
              className="group relative px-6 py-3 bg-gradient-to-r from-green-400 to-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300 border-2 border-green-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center gap-2">
                <span className="text-lg">🟢</span>
                <span>EASY</span>
              </div>
            </button>
            <button
              onClick={() => startGame('medium')}
              className="group relative px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-300 border-2 border-yellow-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center gap-2">
                <span className="text-lg">🟡</span>
                <span>MEDIUM</span>
              </div>
            </button>
            <button
              onClick={() => startGame('hard')}
              className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/50 transform hover:scale-105 transition-all duration-300 border-2 border-red-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center gap-2">
                <span className="text-lg">🔴</span>
                <span>HARD</span>
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-4xl mx-auto">
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.gridWidth}
          height={GAME_CONFIG.gridHeight}
          className="game-canvas border-2 border-gray-400 cursor-pointer w-full h-auto rounded-lg shadow-lg"
          onClick={jump}
          onTouchStart={(e) => {
            e.preventDefault();
            jump();
          }}
        />

        {gameState.isGameOver && !showGameOverUI && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
            <div className="text-center animate-fade-in">
              {HALLOWEEN_EVENT_ACTIVE ? (
                <>
                  <p className="text-3xl font-bold text-red-600 mb-4 animate-pulse">
                    💀 YOU HAVE FALLEN 💀
                  </p>
                  <p className="text-xl text-orange-400 mb-2">📸 Capture your doom...</p>
                  <p className="text-lg text-gray-300">The darkness awaits...</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-yellow-400 mb-2">📸 Screenshot Time!</p>
                  <p className="text-lg text-gray-300">
                    Menu appears in {Math.ceil((5000 - (Date.now() % 5000)) / 1000)}s...
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {gameState.isGameOver && showGameOverUI && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center text-white p-4 animate-fade-in">
            {HALLOWEEN_EVENT_ACTIVE ? (
              <>
                <div className="text-center mb-6 animate-pulse">
                  <h2 className="text-4xl sm:text-5xl font-black mb-4 text-red-600 drop-shadow-lg">
                    💀 GAME OVER 💀
                  </h2>
                  <p className="text-2xl sm:text-3xl font-bold text-red-500 mb-4 animate-bounce">
                    🩸 I AM COMING FOR YOU!!! 🩸
                  </p>
                  <p className="text-lg text-orange-400">The spirits are not pleased...</p>
                </div>
              </>
            ) : (
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-center text-red-400">
                Game Over!
              </h2>
            )}
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-white border-opacity-30">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-300 mb-2">{username}'s Final Score</p>
                <p className="text-4xl font-black text-yellow-400 mb-2">{gameState.score}</p>
                <p className="text-sm text-gray-300">Level: {gameState.level.toUpperCase()}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 items-center">
              <button
                onClick={restartGame}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 border-4 border-white"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative flex items-center gap-3">
                  <span className="text-2xl">🔄</span>
                  <span>RESTART SAME LEVEL</span>
                  <span className="text-2xl">🎮</span>
                </div>
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-300 mb-3">Or choose a different level:</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => startGame('easy')}
                    className="group relative px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300 border-2 border-green-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative flex items-center gap-2">
                      <span>🟢</span>
                      <span>EASY</span>
                    </div>
                  </button>
                  <button
                    onClick={() => startGame('medium')}
                    className="group relative px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-300 border-2 border-yellow-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative flex items-center gap-2">
                      <span>🟡</span>
                      <span>MEDIUM</span>
                    </div>
                  </button>
                  <button
                    onClick={() => startGame('hard')}
                    className="group relative px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/50 transform hover:scale-105 transition-all duration-300 border-2 border-red-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative flex items-center gap-2">
                      <span>🔴</span>
                      <span>HARD</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs sm:text-sm text-gray-600 max-w-md px-2 sm:px-4">
        {HALLOWEEN_EVENT_ACTIVE ? (
          <>
            <p className="mb-1 text-orange-600 font-bold">🎃 HALLOWEEN SPECIAL EVENT! 🎃</p>
            <p className="mb-1">
              Avoid flying witches, evil pumpkins, and spooky ghosts! Collect shields for protection!
            </p>
            <p className="mb-1 text-red-600 font-semibold">
              🐙 OCTOPUS BOSS at 100 pts! 🦇 BAT BOSS at 250 pts!
            </p>
            <p className="mb-1 text-yellow-600 font-bold">
              ⚔️ BOSS CHASES YOU! Collide to attack! Dodge projectiles!
            </p>
            <p className="text-purple-600 font-semibold">
              👻 Spooky sounds and blood moon included! 🌕
            </p>
          </>
        ) : (
          <>
            <p className="mb-1">
              Tap the game area or press SPACE/UP arrow to make the chibi jump!
            </p>
            <p className="mb-1">
              Avoid snakes (watch for coiling ones!) and obstacles. Collect shields for protection!
            </p>
            <p className="text-green-600 font-semibold">
              🤖 AI adapts difficulty based on your performance!
            </p>
          </>
        )}
      </div>

      {/* Tutorial Modal */}
      <Tutorial isVisible={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Pause Menu */}
      <PauseMenu
        isVisible={isPaused && gameState.isPlaying && !gameState.isGameOver}
        onResume={() => setIsPaused(false)}
        onRestart={() => {
          setIsPaused(false);
          restartGame();
        }}
        onSettings={() => {
          setShowSettings(true);
        }}
        onQuit={() => {
          setIsPaused(false);
          setGameState(prev => ({ ...prev, isPlaying: false, isGameOver: true }));
        }}
      />

      {/* Settings Menu */}
      <SettingsMenu
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        soundVolume={soundVolume}
        onVolumeChange={setSoundVolume}
      />

      {/* Pause Button - Floating */}
      {gameState.isPlaying && !gameState.isGameOver && (
        <button
          onClick={() => setIsPaused(prev => !prev)}
          className="fixed top-4 right-4 z-40 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
        >
          {isPaused ? '▶️ Resume' : '⏸️ Pause'}
        </button>
      )}

      {/* Settings Button - Floating */}
      {!gameState.isPlaying && !gameState.isGameOver && (
        <button
          onClick={() => setShowSettings(true)}
          className="fixed top-4 right-4 z-40 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
        >
          ⚙️ Settings
        </button>
      )}
    </div>
  );
};
