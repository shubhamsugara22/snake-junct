export type GameLevel = 'easy' | 'medium' | 'hard';

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
  type: 'pillar';
  position: Position;
  width: number;
  height: number;
  passed?: boolean;
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
