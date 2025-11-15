import { useEffect, useRef, useState, useCallback } from 'react';
import Konva from 'konva';
import { GameLevel } from '../../shared/types/game';

type GameKonvaProps = {
  username: string;
  onScoreUpdate: (score: number, level: GameLevel) => void;
};

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;

export const GameKonva = ({ username, onScoreUpdate }: GameKonvaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const playerRef = useRef<Konva.Circle | null>(null);
  const animationRef = useRef<number | null>(null);

  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [level, setLevel] = useState<GameLevel>('easy');

  // Player state
  const playerState = useRef({
    y: GAME_HEIGHT / 2,
    velocityY: 0,
    isAlive: true,
  });

  // Game objects
  const snakesRef = useRef<Konva.Group[]>([]);
  const obstaclesRef = useRef<Konva.Group[]>([]);
  const timeRef = useRef(0);

  // Game constants
  const GRAVITY = 0.4;
  const JUMP_FORCE = -6;
  const PLAYER_SIZE = 20;
  const SNAKE_SIZE = 14;
  const SCROLL_SPEED = 2;

  // Initialize Konva stage and layers
  useEffect(() => {
    if (!containerRef.current) return;

    // Create stage
    const stage = new Konva.Stage({
      container: containerRef.current,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    });

    // Create main game layer
    const layer = new Konva.Layer();
    stage.add(layer);

    // Create player
    const player = new Konva.Circle({
      x: 150,
      y: GAME_HEIGHT / 2,
      radius: PLAYER_SIZE / 2,
      fill: '#FF6B35',
      stroke: '#F7931E',
      strokeWidth: 2,
      shadowColor: '#FFD700',
      shadowBlur: 10,
      shadowOpacity: 0.5,
    });

    layer.add(player);
    layer.draw();

    stageRef.current = stage;
    layerRef.current = layer;
    playerRef.current = player;

    return () => {
      stage.destroy();
    };
  }, []);

  // Create snake
  const createSnake = useCallback((x: number, y: number) => {
    const layer = layerRef.current;
    if (!layer) return null;

    const snakeGroup = new Konva.Group({ x, y });

    // Snake head
    const head = new Konva.Circle({
      x: 0,
      y: 0,
      radius: SNAKE_SIZE / 2,
      fill: '#228B22',
      stroke: '#006400',
      strokeWidth: 2,
    });

    // Snake body segments
    for (let i = 1; i <= 3; i++) {
      const segment = new Konva.Circle({
        x: -i * SNAKE_SIZE,
        y: 0,
        radius: SNAKE_SIZE / 2 - i,
        fill: '#32CD32',
        stroke: '#228B22',
        strokeWidth: 1,
      });
      snakeGroup.add(segment);
    }

    snakeGroup.add(head);
    layer.add(snakeGroup);
    return snakeGroup;
  }, []);

  // Create obstacle (pillar)
  const createObstacle = useCallback((x: number) => {
    const layer = layerRef.current;
    if (!layer) return null;

    const obstacleGroup = new Konva.Group({ x, y: 0 });
    const gapHeight = 100;
    const gapCenter = GAME_HEIGHT / 2;
    const pillarWidth = 20;

    // Top pillar
    const topPillar = new Konva.Rect({
      x: -pillarWidth / 2,
      y: 0,
      width: pillarWidth,
      height: gapCenter - gapHeight / 2,
      fill: '#808080',
      stroke: '#2F2F2F',
      strokeWidth: 2,
    });

    // Bottom pillar
    const bottomPillar = new Konva.Rect({
      x: -pillarWidth / 2,
      y: gapCenter + gapHeight / 2,
      width: pillarWidth,
      height: GAME_HEIGHT - (gapCenter + gapHeight / 2),
      fill: '#808080',
      stroke: '#2F2F2F',
      strokeWidth: 2,
    });

    obstacleGroup.add(topPillar, bottomPillar);
    layer.add(obstacleGroup);
    return obstacleGroup;
  }, []);

  // Check collision
  const checkCollision = useCallback((playerX: number, playerY: number) => {
    const playerRadius = PLAYER_SIZE / 2;

    // Check snake collisions
    for (const snake of snakesRef.current) {
      const snakeX = snake.x();
      const snakeY = snake.y();
      const distance = Math.sqrt(
        Math.pow(playerX - snakeX, 2) + Math.pow(playerY - snakeY, 2)
      );
      if (distance < playerRadius + SNAKE_SIZE / 2) {
        return true;
      }
    }

    // Check obstacle collisions
    for (const obstacle of obstaclesRef.current) {
      const obstacleX = obstacle.x();
      const pillarWidth = 20;
      const gapHeight = 100;
      const gapCenter = GAME_HEIGHT / 2;

      // Check if player is within pillar X range
      if (
        playerX + playerRadius > obstacleX - pillarWidth / 2 &&
        playerX - playerRadius < obstacleX + pillarWidth / 2
      ) {
        // Check if player hits top or bottom pillar
        if (
          playerY - playerRadius < gapCenter - gapHeight / 2 ||
          playerY + playerRadius > gapCenter + gapHeight / 2
        ) {
          return true;
        }
      }
    }

    return false;
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isPlaying || !playerState.current.isAlive) return;

    const player = playerRef.current;
    const layer = layerRef.current;
    if (!player || !layer) return;

    timeRef.current += 1;

    // Apply gravity
    playerState.current.velocityY += GRAVITY;
    playerState.current.y += playerState.current.velocityY;

    // Ground collision
    if (playerState.current.y > GAME_HEIGHT - PLAYER_SIZE / 2) {
      playerState.current.y = GAME_HEIGHT - PLAYER_SIZE / 2;
      playerState.current.velocityY = 0;
    }

    // Ceiling collision
    if (playerState.current.y < PLAYER_SIZE / 2) {
      playerState.current.y = PLAYER_SIZE / 2;
      playerState.current.velocityY = 0;
    }

    // Update player position
    player.y(playerState.current.y);

    // Add rotation based on velocity
    const rotation = playerState.current.velocityY * 2;
    player.rotation(rotation);

    // Update snakes
    snakesRef.current.forEach((snake, index) => {
      const currentX = snake.x();
      const newX = currentX - SCROLL_SPEED;

      // Sine wave movement
      const amplitude = 50;
      const frequency = 0.02;
      const newY = GAME_HEIGHT / 2 + Math.sin(timeRef.current * frequency + index) * amplitude;

      snake.x(newX);
      snake.y(newY);

      // Remove if off screen and respawn
      if (newX < -50) {
        snake.x(GAME_WIDTH + 100);
        setScore((prev) => prev + 10);
      }
    });

    // Update obstacles
    obstaclesRef.current.forEach((obstacle) => {
      const currentX = obstacle.x();
      const newX = currentX - SCROLL_SPEED;
      obstacle.x(newX);

      // Respawn if off screen
      if (newX < -50) {
        obstacle.x(GAME_WIDTH + 200);
        setScore((prev) => prev + 10);
      }
    });

    // Check collisions
    const playerX = player.x();
    const playerY = player.y();
    if (checkCollision(playerX, playerY)) {
      playerState.current.isAlive = false;
      setIsGameOver(true);
      setIsPlaying(false);
      
      // Death animation
      player.to({
        scaleX: 0,
        scaleY: 0,
        rotation: 360,
        duration: 0.5,
      });
    }

    layer.batchDraw();

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, checkCollision]);

  // Start game loop
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, gameLoop]);

  // Jump function
  const jump = useCallback(() => {
    if (!isPlaying || !playerState.current.isAlive) return;
    playerState.current.velocityY = JUMP_FORCE;

    // Add jump animation
    if (playerRef.current) {
      playerRef.current.to({
        scaleX: 1.2,
        scaleY: 0.8,
        duration: 0.1,
        onFinish: () => {
          playerRef.current?.to({
            scaleX: 1,
            scaleY: 1,
            duration: 0.1,
          });
        },
      });
    }
  }, [isPlaying]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump]);

  // Start game
  const startGame = (selectedLevel: GameLevel) => {
    const layer = layerRef.current;
    const player = playerRef.current;
    if (!layer || !player) return;

    // Clear existing objects
    snakesRef.current.forEach((snake) => snake.destroy());
    obstaclesRef.current.forEach((obstacle) => obstacle.destroy());
    snakesRef.current = [];
    obstaclesRef.current = [];

    // Reset player
    player.scale({ x: 1, y: 1 });
    player.rotation(0);
    player.x(150);
    player.y(GAME_HEIGHT / 2);

    setLevel(selectedLevel);
    setScore(0);
    setIsGameOver(false);
    playerState.current = {
      y: GAME_HEIGHT / 2,
      velocityY: 0,
      isAlive: true,
    };
    timeRef.current = 0;

    // Create snakes based on difficulty
    const snakeCount = selectedLevel === 'easy' ? 3 : selectedLevel === 'medium' ? 5 : 7;
    for (let i = 0; i < snakeCount; i++) {
      const snake = createSnake(GAME_WIDTH + i * 250, GAME_HEIGHT / 2);
      if (snake) snakesRef.current.push(snake);
    }

    // Create obstacles
    const obstacleCount = selectedLevel === 'easy' ? 2 : selectedLevel === 'medium' ? 3 : 4;
    for (let i = 0; i < obstacleCount; i++) {
      const obstacle = createObstacle(GAME_WIDTH + 150 + i * 300);
      if (obstacle) obstaclesRef.current.push(obstacle);
    }

    layer.batchDraw();
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-2 sm:p-4 w-full">
      <div className="flex flex-col items-center gap-3 w-full">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Snake Dodge (Konva)
          </span>
          <span className="text-gray-700"> - {username}</span>
        </h1>

        {/* Score Display */}
        <div className="flex gap-3 text-base sm:text-lg">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-2 rounded-lg border-2 border-blue-400">
            <span className="text-xs text-blue-600 font-semibold">Score</span>
            <div className="text-xl font-bold text-blue-700">{score}</div>
          </div>
        </div>

        {/* Game Canvas Container */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div
            ref={containerRef}
            className="border-2 border-gray-400 rounded-lg shadow-lg cursor-pointer"
            style={{
              width: '100%',
              maxWidth: `${GAME_WIDTH}px`,
              aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
              background: 'linear-gradient(to bottom, #87CEEB 0%, #F0E68C 100%)',
            }}
            onClick={jump}
          />
        </div>

        {/* Start Menu */}
        {!isPlaying && !isGameOver && (
          <div className="flex flex-col items-center gap-4 mt-4">
            <p className="text-lg font-semibold text-gray-700">Choose Difficulty</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => startGame('easy')}
                className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all"
              >
                EASY
              </button>
              <button
                onClick={() => startGame('medium')}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all"
              >
                MEDIUM
              </button>
              <button
                onClick={() => startGame('hard')}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all"
              >
                HARD
              </button>
            </div>
          </div>
        )}

        {/* Game Over */}
        {isGameOver && (
          <div className="flex flex-col items-center gap-4 mt-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-red-600 mb-2">Game Over!</h2>
              <p className="text-xl text-gray-700">Final Score: {score}</p>
            </div>
            <button
              onClick={() => startGame(level)}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-xl rounded-2xl shadow-2xl hover:scale-105 transition-all"
            >
              🎮 Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
