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
};

export type Player = {
  position: Position;
  velocity: number;
  isAlive: boolean;
};

export type GameState = {
  player: Player;
  snakes: Snake[];
  score: number;
  level: GameLevel;
  isGameOver: boolean;
  isPlaying: boolean;
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
};
