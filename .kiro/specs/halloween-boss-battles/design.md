# Design Document

## Overview

This document provides the technical design for implementing Halloween-themed boss battles in Snake Junct. The system introduces two boss encounters (Octopus Boss and Bat Boss) that appear at score milestones (100 and 250 points respectively). Each boss has unique visual designs, attack patterns, and projectile mechanics that challenge players while maintaining the game's performance and accessibility standards.

## Architecture

### High-Level System Design

```
Game Loop
    ├── Boss State Manager
    │   ├── Boss Trigger System (monitors score milestones)
    │   ├── Boss Instance Manager (creates/destroys bosses)
    │   └── Boss Transition Controller (entrance/exit animations)
    │
    ├── Boss Entities
    │   ├── Octopus Boss
    │   │   ├── Tentacle Animation System
    │   │   ├── Ink Blob Projectile Spawner
    │   │   └── Health Management
    │   │
    │   └── Bat Boss
    │       ├── Figure-Eight Movement System
    │       ├── Pumpkin Projectile Spawner
    │       └── Health Management
    │
    ├── Projectile System
    │   ├── Projectile Pool (object pooling for performance)
    │   ├── Trajectory Calculator
    │   └── Collision Detector
    │
    └── Reward System
        ├── Victory Sequence Handler
        └── Power-Up Spawner
```

### State Machine

```
Normal Gameplay → Score Milestone Reached → Boss Entrance Animation → 
Boss Active → Boss Defeated → Victory Animation → Reward Spawn → Normal Gameplay
```

## Components and Interfaces

### Boss Configuration Type


```typescript
type BossType = 'octopus' | 'bat';

type BossConfig = {
  type: BossType;
  triggerScore: number;
  health: number;
  position: Position;
  size: { width: number; height: number };
  projectileInterval: number; // milliseconds
  projectileSpeed: number;
  projectileSize: number;
  colors: {
    primary: string;
    secondary: string;
    glow: string;
  };
};

type Boss = {
  id: string;
  type: BossType;
  position: Position;
  health: number;
  maxHealth: number;
  isActive: boolean;
  lastProjectileTime: number;
  animationPhase: number;
  hitFlashTime: number;
};

type Projectile = {
  id: string;
  type: 'inkBlob' | 'pumpkin';
  position: Position;
  velocity: Position;
  size: number;
  active: boolean;
};

type BossState = {
  currentBoss: Boss | null;
  bossEncounterActive: boolean;
  bossTransitionPhase: 'entrance' | 'active' | 'victory' | null;
  transitionStartTime: number;
  projectiles: Projectile[];
  defeatedBosses: BossType[];
};
```

### Boss Manager Component

The Boss Manager is responsible for triggering boss encounters and managing boss lifecycle.


```typescript
const BOSS_CONFIGS: Record<BossType, BossConfig> = {
  octopus: {
    type: 'octopus',
    triggerScore: 100,
    health: 10,
    position: { x: 500, y: 200 },
    size: { width: 80, height: 80 },
    projectileInterval: 1500,
    projectileSpeed: 3,
    projectileSize: 15,
    colors: {
      primary: '#4B0082',
      secondary: '#00FFFF',
      glow: '#00FFFF',
    },
  },
  bat: {
    type: 'bat',
    triggerScore: 250,
    health: 15,
    position: { x: 300, y: 100 },
    size: { width: 100, height: 60 },
    projectileInterval: 1200,
    projectileSpeed: 2.5,
    projectileSize: 12,
    colors: {
      primary: '#000000',
      secondary: '#FF0000',
      glow: '#FF0000',
    },
  },
};

const checkBossTrigger = (score: number, defeatedBosses: BossType[]): BossType | null => {
  if (score >= 250 && !defeatedBosses.includes('bat')) {
    return 'bat';
  }
  if (score >= 100 && !defeatedBosses.includes('octopus')) {
    return 'octopus';
  }
  return null;
};
```

### Octopus Boss Rendering

The Octopus Boss features 8 animated tentacles and throws ink blob projectiles.


```typescript
const renderOctopusBoss = (ctx: CanvasRenderingContext2D, boss: Boss, time: number) => {
  const config = BOSS_CONFIGS.octopus;
  const { x, y } = boss.position;
  
  // Flash white when hit
  const isFlashing = time - boss.hitFlashTime < 200;
  
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
    ctx.quadraticCurveTo(
      x + Math.cos(angle) * 20,
      y + Math.sin(angle) * 20 + wave,
      endX,
      endY
    );
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
```

### Bat Boss Rendering

The Bat Boss flies in a figure-eight pattern and has animated wings.


```typescript
const renderBatBoss = (ctx: CanvasRenderingContext2D, boss: Boss, time: number) => {
  const config = BOSS_CONFIGS.bat;
  const { x, y } = boss.position;
  
  // Flash white when hit
  const isFlashing = time - boss.hitFlashTime < 200;
  
  // Wing flap animation
  const wingFlap = Math.sin(time * 0.01) * 15;
  
  // Left wing
  ctx.fillStyle = isFlashing ? '#FFFFFF' : config.colors.primary;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 30, y - 20 + wingFlap, x - 50, y);
  ctx.quadraticCurveTo(x - 30, y + 15, x, y);
  ctx.closePath();
  ctx.fill();
  
  // Right wing
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 30, y - 20 + wingFlap, x + 50, y);
  ctx.quadraticCurveTo(x + 30, y + 15, x, y);
  ctx.closePath();
  ctx.fill();
  
  // Wing details
  ctx.strokeStyle = config.colors.secondary;
  ctx.lineWidth = 2;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - i * 15, y - 5 + wingFlap * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + i * 15, y - 5 + wingFlap * 0.5);
    ctx.stroke();
  }
  
  // Body
  ctx.fillStyle = isFlashing ? '#FFFFFF' : config.colors.primary;
  ctx.beginPath();
  ctx.ellipse(x, y, 15, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Head
  ctx.beginPath();
  ctx.arc(x, y - 15, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Ears
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 20);
  ctx.lineTo(x - 12, y - 30);
  ctx.lineTo(x - 6, y - 22);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(x + 8, y - 20);
  ctx.lineTo(x + 12, y - 30);
  ctx.lineTo(x + 6, y - 22);
  ctx.closePath();
  ctx.fill();
  
  // Eyes with glow
  ctx.fillStyle = config.colors.secondary;
  ctx.shadowColor = config.colors.secondary;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x - 5, y - 15, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 5, y - 15, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Fangs
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 10);
  ctx.lineTo(x - 5, y - 5);
  ctx.lineTo(x - 1, y - 10);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 10);
  ctx.lineTo(x + 5, y - 5);
  ctx.lineTo(x + 1, y - 10);
  ctx.closePath();
  ctx.fill();
};
```

## Data Models

### Boss State Integration


The existing GameState type needs to be extended to include boss state:

```typescript
type GameState = {
  // ... existing fields
  bossState: BossState;
};
```

### Projectile System

Projectiles use object pooling for performance:

```typescript
class ProjectilePool {
  private pool: Projectile[] = [];
  private maxSize = 20;
  
  acquire(type: 'inkBlob' | 'pumpkin', position: Position, velocity: Position, size: number): Projectile {
    let projectile = this.pool.find(p => !p.active);
    
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
    return this.pool.filter(p => p.active);
  }
}
```

## Movement and Attack Patterns

### Octopus Boss Behavior

The Octopus Boss remains stationary but rotates its tentacles:


```typescript
const updateOctopusBoss = (boss: Boss, time: number): void => {
  // Rotate tentacles slowly
  boss.animationPhase += 0.02;
  
  // Keep position fixed at center-right
  boss.position.x = 500;
  boss.position.y = 200;
};

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
```

### Bat Boss Behavior

The Bat Boss flies in a figure-eight pattern:

```typescript
const updateBatBoss = (boss: Boss, time: number): void => {
  // Figure-eight pattern using Lissajous curve
  const t = time * 0.001;
  const centerX = 300;
  const centerY = 150;
  const radiusX = 150;
  const radiusY = 80;
  
  boss.position.x = centerX + radiusX * Math.sin(t);
  boss.position.y = centerY + radiusY * Math.sin(2 * t);
  
  boss.animationPhase = t;
};

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
  
  // Determine attack pattern
  const tripleShot Chance = skillLevel > 0.7 ? 0.7 : 0.5;
  const useTripleShot = Math.random() < tripleShotChance;
  
  const projectiles: Projectile[] = [];
  
  if (useTripleShot) {
    // Triple shot with spread
    const angles = [-30, 0, 30];
    angles.forEach(angleOffset => {
      const dx = playerPos.x - boss.position.x;
      const dy = playerPos.y - boss.position.y;
      const baseAngle = Math.atan2(dy, dx);
      const angle = baseAngle + (angleOffset * Math.PI / 180);
      
      const velocity = {
        x: Math.cos(angle) * config.projectileSpeed,
        y: Math.sin(angle) * config.projectileSpeed,
      };
      
      projectiles.push(pool.acquire('pumpkin', boss.position, velocity, config.projectileSize));
    });
  } else {
    // Single shot
    const dx = playerPos.x - boss.position.x;
    const dy = playerPos.y - boss.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const velocity = {
      x: (dx / distance) * config.projectileSpeed,
      y: (dy / distance) * config.projectileSpeed,
    };
    
    projectiles.push(pool.acquire('pumpkin', boss.position, velocity, config.projectileSize));
  }
  
  return projectiles;
};
```

## Collision Detection

### Boss Hit Detection


```typescript
const checkBossCollision = (playerPos: Position, boss: Boss, playerRadius: number): boolean => {
  const bossRadius = boss.type === 'octopus' ? 40 : 30;
  
  const dx = playerPos.x - boss.position.x;
  const dy = playerPos.y - boss.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < (playerRadius + bossRadius);
};

const handleBossHit = (boss: Boss, playerVelocity: number): number => {
  boss.health -= 1;
  boss.hitFlashTime = Date.now();
  
  // Play hit sound
  playBossHitSound();
  
  // Bounce player away
  return boss.type === 'octopus' ? -8 : -7;
};
```

### Projectile Collision Detection

```typescript
const checkProjectileCollision = (
  playerPos: Position,
  projectile: Projectile,
  playerRadius: number
): boolean => {
  const dx = playerPos.x - projectile.position.x;
  const dy = playerPos.y - projectile.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < (playerRadius + projectile.size);
};

const handleProjectileHit = (
  projectile: Projectile,
  gameState: GameState,
  pool: ProjectilePool
): void => {
  if (gameState.shieldActive) {
    // Shield blocks projectile
    pool.release(projectile);
    playShieldBlockSound();
  } else if (gameState.fireActive) {
    // Fire destroys projectile
    pool.release(projectile);
    if (projectile.type === 'pumpkin') {
      gameState.score += 5;
    }
    playFireDestroySound();
  } else {
    // Player takes damage - game over
    gameState.isGameOver = true;
    gameState.isPlaying = false;
    playCollisionSound();
  }
};
```

## UI Components

### Boss Health Bar


```typescript
const renderBossHealthBar = (ctx: CanvasRenderingContext2D, boss: Boss): void => {
  const barWidth = 200;
  const barHeight = 20;
  const x = (GAME_CONFIG.gridWidth - barWidth) / 2;
  const y = 30;
  
  const config = BOSS_CONFIGS[boss.type];
  const healthPercent = boss.health / boss.maxHealth;
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
  
  // Empty bar
  ctx.fillStyle = '#333333';
  ctx.fillRect(x, y, barWidth, barHeight);
  
  // Health bar with gradient
  const gradient = ctx.createLinearGradient(x, y, x + barWidth * healthPercent, y);
  gradient.addColorStop(0, config.colors.secondary);
  gradient.addColorStop(1, config.colors.primary);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
  
  // Border
  ctx.strokeStyle = config.colors.glow;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barWidth, barHeight);
  
  // Boss name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const bossName = boss.type === 'octopus' ? 'OCTOPUS BOSS' : 'BAT BOSS';
  ctx.fillText(bossName, GAME_CONFIG.gridWidth / 2, y - 10);
  
  // Health text
  ctx.font = '12px Arial';
  ctx.fillText(`${boss.health} / ${boss.maxHealth}`, GAME_CONFIG.gridWidth / 2, y + barHeight / 2 + 4);
};
```

### Boss Entrance Animation

```typescript
const renderBossEntrance = (ctx: CanvasRenderingContext2D, boss: Boss, progress: number): void => {
  // progress: 0 to 1 over 2 seconds
  
  // Fade in background
  ctx.fillStyle = `rgba(0, 0, 0, ${progress * 0.5})`;
  ctx.fillRect(0, 0, GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight);
  
  // Boss name appears
  if (progress > 0.3) {
    const textAlpha = Math.min(1, (progress - 0.3) / 0.3);
    ctx.globalAlpha = textAlpha;
    
    ctx.fillStyle = BOSS_CONFIGS[boss.type].colors.glow;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = BOSS_CONFIGS[boss.type].colors.glow;
    ctx.shadowBlur = 20;
    
    const bossName = boss.type === 'octopus' ? 'OCTOPUS BOSS' : 'BAT BOSS';
    const y = GAME_CONFIG.gridHeight / 2 - 50 + (1 - textAlpha) * 30;
    ctx.fillText(bossName, GAME_CONFIG.gridWidth / 2, y);
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  
  // Boss slides in from right
  if (progress > 0.5) {
    const slideProgress = (progress - 0.5) / 0.5;
    const easedProgress = 1 - Math.pow(1 - slideProgress, 3); // Ease out cubic
    
    const startX = GAME_CONFIG.gridWidth + 100;
    const targetX = BOSS_CONFIGS[boss.type].position.x;
    boss.position.x = startX + (targetX - startX) * easedProgress;
  }
};
```

### Victory Animation


```typescript
const renderVictoryAnimation = (ctx: CanvasRenderingContext2D, boss: Boss, progress: number): void => {
  // progress: 0 to 1 over 1 second
  
  // Boss fades out and shrinks
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
  if (progress > 0.3) {
    const textAlpha = Math.min(1, (progress - 0.3) / 0.3);
    ctx.globalAlpha = textAlpha;
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 30;
    
    ctx.fillText('VICTORY!', GAME_CONFIG.gridWidth / 2, GAME_CONFIG.gridHeight / 2);
    
    ctx.font = 'bold 32px Arial';
    const bonusText = boss.type === 'octopus' ? '+50 POINTS' : '+100 POINTS';
    ctx.fillText(bonusText, GAME_CONFIG.gridWidth / 2, GAME_CONFIG.gridHeight / 2 + 50);
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
};
```

## Sound Effects

```typescript
const playBossHitSound = () => {
  playSound(800, 0.15, 'square');
  setTimeout(() => playSound(600, 0.1, 'square'), 50);
};

const playBossDefeatedSound = () => {
  playSound(1200, 0.2, 'sine');
  setTimeout(() => playSound(1400, 0.2, 'sine'), 100);
  setTimeout(() => playSound(1600, 0.3, 'sine'), 200);
};

const playProjectileThrowSound = () => {
  playSound(400, 0.1, 'sawtooth');
};

const playShieldBlockSound = () => {
  playSound(1000, 0.1, 'triangle');
};

const playFireDestroySound = () => {
  playSound(600, 0.15, 'sawtooth');
  setTimeout(() => playSound(500, 0.1, 'sawtooth'), 50);
};
```

## Error Handling

### Boss State Validation


```typescript
const validateBossState = (bossState: BossState): boolean => {
  if (!bossState) {
    console.error('Boss state is null or undefined');
    return false;
  }
  
  if (bossState.currentBoss) {
    if (bossState.currentBoss.health < 0) {
      console.warn('Boss health is negative, clamping to 0');
      bossState.currentBoss.health = 0;
    }
    
    if (bossState.currentBoss.health > bossState.currentBoss.maxHealth) {
      console.warn('Boss health exceeds max health, clamping');
      bossState.currentBoss.health = bossState.currentBoss.maxHealth;
    }
  }
  
  // Limit projectile count
  if (bossState.projectiles.length > 10) {
    console.warn('Too many projectiles, removing oldest');
    bossState.projectiles = bossState.projectiles.slice(-10);
  }
  
  return true;
};
```

### Graceful Degradation

```typescript
const BOSS_BATTLES_ENABLED = true; // Feature flag

const shouldTriggerBoss = (
  score: number,
  halloweenActive: boolean,
  bossesEnabled: boolean,
  defeatedBosses: BossType[]
): BossType | null => {
  if (!bossesEnabled || !halloweenActive) {
    return null;
  }
  
  try {
    return checkBossTrigger(score, defeatedBosses);
  } catch (error) {
    console.error('Error checking boss trigger:', error);
    return null;
  }
};
```

## Testing Strategy

### Unit Tests

1. **Boss Trigger Logic**
   - Test score milestone detection
   - Test defeated boss tracking
   - Test feature flag behavior

2. **Projectile System**
   - Test object pool acquire/release
   - Test trajectory calculation
   - Test collision detection

3. **Movement Patterns**
   - Test Octopus stationary behavior
   - Test Bat figure-eight pattern
   - Test animation phase updates

### Integration Tests

1. **Boss Lifecycle**
   - Test entrance animation sequence
   - Test active combat phase
   - Test victory animation and reward spawn

2. **Collision System**
   - Test player-boss collision
   - Test player-projectile collision
   - Test power-up interactions with projectiles

3. **Adaptive Difficulty**
   - Test projectile interval adjustment
   - Test health scaling
   - Test attack pattern changes

### Performance Tests

1. **Frame Rate**
   - Measure FPS during boss encounters
   - Test with maximum projectiles active
   - Profile rendering performance

2. **Memory**
   - Test projectile pool memory usage
   - Check for memory leaks during long sessions
   - Verify proper cleanup on boss defeat

## Performance Optimizations

### Rendering Optimizations


```typescript
// Cache boss sprites for reuse
const bossSpriteCacheCanvas = document.createElement('canvas');
const bossSpriteCacheCtx = bossSpriteCacheCanvas.getContext('2d');

const cacheBossSprite = (boss: Boss): void => {
  if (!bossSpriteCacheCtx) return;
  
  bossSpriteCacheCanvas.width = 200;
  bossSpriteCacheCanvas.height = 200;
  
  if (boss.type === 'octopus') {
    renderOctopusBoss(bossSpriteCacheCtx, boss, Date.now());
  } else {
    renderBatBoss(bossSpriteCacheCtx, boss, Date.now());
  }
};

// Use cached sprite when not animating
const renderCachedBoss = (ctx: CanvasRenderingContext2D, boss: Boss): void => {
  ctx.drawImage(
    bossSpriteCacheCanvas,
    boss.position.x - 100,
    boss.position.y - 100
  );
};
```

### Collision Optimizations

```typescript
// Spatial partitioning for projectiles
const getProjectilesNearPlayer = (
  projectiles: Projectile[],
  playerPos: Position,
  radius: number
): Projectile[] => {
  return projectiles.filter(p => {
    const dx = Math.abs(p.position.x - playerPos.x);
    const dy = Math.abs(p.position.y - playerPos.y);
    
    // Quick AABB check before expensive distance calculation
    return dx < radius && dy < radius;
  });
};
```

## Configuration and Feature Flags

```typescript
const BOSS_CONFIG_FLAGS = {
  BOSS_BATTLES_ENABLED: true,
  DEBUG_MODE: false,
  SHOW_HITBOXES: false,
  SKIP_ENTRANCE_ANIMATION: false,
  INVINCIBLE_MODE: false,
};

// Debug visualization
const renderBossHitbox = (ctx: CanvasRenderingContext2D, boss: Boss): void => {
  if (!BOSS_CONFIG_FLAGS.SHOW_HITBOXES) return;
  
  const radius = boss.type === 'octopus' ? 40 : 30;
  
  ctx.strokeStyle = '#FF00FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(boss.position.x, boss.position.y, radius, 0, Math.PI * 2);
  ctx.stroke();
};

const renderProjectileHitbox = (ctx: CanvasRenderingContext2D, projectile: Projectile): void => {
  if (!BOSS_CONFIG_FLAGS.SHOW_HITBOXES) return;
  
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(projectile.position.x, projectile.position.y, projectile.size, 0, Math.PI * 2);
  ctx.stroke();
};
```

## Integration Points

### Game State Updates

The boss system integrates into the existing game loop:


```typescript
const updateGameWithBoss = (prevState: GameState): GameState => {
  const newState = { ...prevState };
  
  // Check for boss trigger
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
      const adjustedHealth = 
        playerProfile.skillLevel > 0.7 
          ? config.health + (bossType === 'octopus' ? 2 : 3)
          : config.health;
      
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
      
      // Pause normal enemy spawning
      newState.snakes = [];
      newState.obstacles = [];
      
      playBossEntranceSound();
    }
  }
  
  // Update boss encounter
  if (newState.bossState.bossEncounterActive && newState.bossState.currentBoss) {
    const boss = newState.bossState.currentBoss;
    const timeSinceTransition = Date.now() - newState.bossState.transitionStartTime;
    
    // Handle transition phases
    if (newState.bossState.bossTransitionPhase === 'entrance') {
      if (timeSinceTransition > 2000) {
        newState.bossState.bossTransitionPhase = 'active';
        boss.isActive = true;
      }
    } else if (newState.bossState.bossTransitionPhase === 'victory') {
      if (timeSinceTransition > 1000) {
        // Spawn reward
        const rewardType = boss.type === 'octopus' ? 'shield' : 'candy';
        newState.powerUps.push({
          id: Math.random().toString(36).substring(2, 9),
          type: rewardType,
          position: { ...boss.position },
          collected: false,
        });
        
        // End boss encounter
        newState.bossState.bossEncounterActive = false;
        newState.bossState.bossTransitionPhase = null;
        newState.bossState.defeatedBosses.push(boss.type);
        newState.bossState.currentBoss = null;
        newState.bossState.projectiles = [];
      }
    } else if (newState.bossState.bossTransitionPhase === 'active') {
      // Update boss behavior
      if (boss.type === 'octopus') {
        updateOctopusBoss(boss, Date.now());
        
        const projectile = octopusThrowProjectile(
          boss,
          newState.player.position,
          projectilePool,
          playerProfile.skillLevel
        );
        
        if (projectile) {
          newState.bossState.projectiles.push(projectile);
          playProjectileThrowSound();
        }
      } else {
        updateBatBoss(boss, Date.now());
        
        const projectiles = batThrowProjectile(
          boss,
          newState.player.position,
          projectilePool,
          playerProfile.skillLevel
        );
        
        if (projectiles.length > 0) {
          newState.bossState.projectiles.push(...projectiles);
          playProjectileThrowSound();
        }
      }
      
      // Check boss collision
      if (checkBossCollision(newState.player.position, boss, GAME_CONFIG.playerSize / 2)) {
        newState.player.velocity = handleBossHit(boss, newState.player.velocity);
        
        // Check if boss defeated
        if (boss.health <= 0) {
          newState.bossState.bossTransitionPhase = 'victory';
          newState.bossState.transitionStartTime = Date.now();
          boss.isActive = false;
          
          const bonusPoints = boss.type === 'octopus' ? 50 : 100;
          newState.score += bonusPoints;
          
          playBossDefeatedSound();
        }
      }
    }
    
    // Update projectiles
    newState.bossState.projectiles = newState.bossState.projectiles.filter(projectile => {
      if (!projectile.active) return false;
      
      // Move projectile
      projectile.position.x += projectile.velocity.x;
      projectile.position.y += projectile.velocity.y;
      
      // Remove if off-screen
      if (
        projectile.position.x < -50 ||
        projectile.position.x > GAME_CONFIG.gridWidth + 50 ||
        projectile.position.y < -50 ||
        projectile.position.y > GAME_CONFIG.gridHeight + 50
      ) {
        projectilePool.release(projectile);
        return false;
      }
      
      // Check collision with player
      if (checkProjectileCollision(
        newState.player.position,
        projectile,
        GAME_CONFIG.playerSize / 2
      )) {
        handleProjectileHit(projectile, newState, projectilePool);
        return false;
      }
      
      return true;
    });
  }
  
  return newState;
};
```

## Accessibility Considerations

1. **Visual Clarity**
   - Boss sprites use high-contrast colors
   - Projectiles have glowing outlines
   - Health bar is large and clearly visible

2. **Difficulty Scaling**
   - Adaptive difficulty ensures fair challenge for all skill levels
   - Beginners get slower projectiles and more time between attacks
   - Advanced players get increased challenge

3. **Audio Feedback**
   - Distinct sounds for all boss actions
   - Victory and defeat have clear audio cues
   - Sound effects work without visual feedback

## Future Enhancements

1. **Additional Boss Types**
   - Giant Spider Boss (Score: 500)
   - Witch Queen Boss (Score: 750)

2. **Boss Phases**
   - Bosses change attack patterns at 50% health
   - Enraged mode with faster attacks

3. **Boss Achievements**
   - "No-Hit Boss" - Defeat boss without taking damage
   - "Speed Demon" - Defeat boss in under 30 seconds
   - "Boss Master" - Defeat all bosses in one run

4. **Boss Rush Mode**
   - Fight all bosses back-to-back
   - Leaderboard for fastest completion time
