export type GameLevel = 'easy' | 'medium' | 'hard';

export type BossType = 'octopus' | 'bat';

export type Position = {
  x: number;
  y: number;
};

export type Snake = {
  id: string;
  position: Position;
  direction: Position;
  speed: number;
  length: number;
  width: number;
  color?: string;
  pattern?: 'normal' | 'spinning';
  rotation?: number;
};

export type Player = {
  position: Position;
  velocity: number;
  isAlive: boolean;
  skin?: string;
};

export type PowerUp = {
  id: string;
  type: 'shield' | 'fire' | 'candy';
  position: Position;
  collected: boolean;
};

export type Obstacle = {
  id: string;
  type: 'pillar' | 'ghost' | 'fish' | 'eel' | 'shark' | 'coral';
  position: Position;
  width: number;
  height: number;
  passed?: boolean;
  floatOffset?: number; // For ghost/fish floating animation
  swimDirection?: number; // For fish/eel swimming pattern
};

export type BossConfig = {
  type: BossType;
  triggerScore: number;
  health: number;
  position: Position;
  size: { width: number; height: number };
  projectileInterval: number;
  projectileSpeed: number;
  projectileSize: number;
  colors: {
    primary: string;
    secondary: string;
    glow: string;
  };
};

export type Boss = {
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

export type Projectile = {
  id: string;
  type: 'inkBlob' | 'pumpkin';
  position: Position;
  velocity: Position;
  size: number;
  active: boolean;
};

export type BossState = {
  currentBoss: Boss | null;
  bossEncounterActive: boolean;
  bossTransitionPhase: 'entrance' | 'active' | 'victory' | null;
  transitionStartTime: number;
  projectiles: Projectile[];
  defeatedBosses: BossType[];
};

export type GameState = {
  player: Player;
  snakes: Snake[];
  obstacles: Obstacle[];
  powerUps: PowerUp[];
  score: number;
  level: GameLevel;
  isGameOver: boolean;
  isPlaying: boolean;
  shieldActive: boolean;
  shieldEndTime: number;
  fireActive: boolean;
  fireEndTime: number;
  bossState: BossState;
};

export type GameConfig = {
  gridWidth: number;
  gridHeight: number;
  playerSize: number;
  snakeSize: number;
  gravity: number;
  jumpForce: number;
  levelSpeeds: Record<GameLevel, number>;
  snakeCount: Record<GameLevel, number>;
  obstacleCount: Record<GameLevel, number>;
};

// Boss Configurations
export const BOSS_CONFIGS: Record<BossType, BossConfig> = {
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

// Feature Flags
export const BOSS_BATTLES_ENABLED = true;
