export type GameLevel = 'easy' | 'medium' | 'hard';

export type BossType = 'alien_cruiser' | 'asteroid_swarm' | 'mothership' | 'laser_satellite' | 'void_serpent';

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
};

export type Player = {
  position: Position;
  velocity: number;
  isAlive: boolean;
  skin?: string;
  lastFireTime?: number;
};

export type PowerUp = {
  id: string;
  type: 'shield' | 'fire' | 'candy' | 'double_laser';
  position: Position;
  collected: boolean;
};

export type Obstacle = {
  id: string;
  type: 'asteroid' | 'mine' | 'debris' | 'enemy_ship';
  position: Position;
  width: number;
  height: number;
  passed?: boolean;
  floatOffset?: number; 
  swimDirection?: number; 
  flapPhase?: number; 
  legPhase?: number; 
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
  type: 'alien_laser' | 'asteroid_chunk' | 'plasma_ball' | 'missile';
  position: Position;
  velocity: Position;
  size: number;
  active: boolean;
};

export type PlayerProjectile = {
  id: string;
  position: Position;
  velocity: Position;
  size: number;
  active: boolean;
  damage: number;
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
  playerProjectiles: PlayerProjectile[];
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
  doubleLaserActive: boolean;
  doubleLaserEndTime: number;
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
  alien_cruiser: {
    type: 'alien_cruiser',
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
  asteroid_swarm: {
    type: 'asteroid_swarm',
    triggerScore: 250,
    health: 15,
    position: { x: 300, y: 100 },
    size: { width: 100, height: 60 },
    projectileInterval: 1200,
    projectileSpeed: 2.5,
    projectileSize: 12,
    colors: {
      primary: '#696969',
      secondary: '#A9A9A9',
      glow: '#FF4500',
    },
  },
  mothership: {
    type: 'mothership',
    triggerScore: 100,
    health: 10,
    position: { x: 150, y: 200 },
    size: { width: 70, height: 60 },
    projectileInterval: 1400,
    projectileSpeed: 3.5,
    projectileSize: 12,
    colors: {
      primary: '#FF6B35',
      secondary: '#F7931E',
      glow: '#FFD700',
    },
  },
  laser_satellite: {
    type: 'laser_satellite',
    triggerScore: 250,
    health: 15,
    position: { x: 100, y: 200 },
    size: { width: 90, height: 50 },
    projectileInterval: 800,
    projectileSpeed: 5.5,
    projectileSize: 16,
    colors: {
      primary: '#2C3E50',
      secondary: '#E74C3C',
      glow: '#F39C12',
    },
  },
  void_serpent: {
    type: 'void_serpent',
    triggerScore: 600,
    health: 25,
    position: { x: 400, y: 300 },
    size: { width: 150, height: 100 },
    projectileInterval: 600,
    projectileSpeed: 4.5,
    projectileSize: 18,
    colors: {
      primary: '#0D0D0D',
      secondary: '#00FF00',
      glow: '#39FF14',
    },
  },
};

// Feature Flags
export const BOSS_BATTLES_ENABLED = true;
