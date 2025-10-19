import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameLevel, Position, Snake, GameConfig } from '../../shared/types/game';

const GAME_CONFIG: GameConfig = {
  gridWidth: 400,
  gridHeight: 300,
  playerSize: 16,
  snakeSize: 12,
  gravity: 0.4,
  jumpForce: -6,
  levelSpeeds: {
    easy: 1,
    medium: 2,
    hard: 3,
  },
  snakeCount: {
    easy: 2,
    medium: 4,
    hard: 6,
  },
};

type GameProps = {
  username: string;
  onScoreUpdate: (score: number, level: GameLevel) => void;
};

export const Game = ({ username, onScoreUpdate }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>();
  const [gameState, setGameState] = useState<GameState>({
    player: {
      position: { x: 100, y: 300 },
      velocity: 0,
      isAlive: true,
    },
    snakes: [],
    score: 0,
    level: 'easy',
    isGameOver: false,
    isPlaying: false,
  });

  const generateSnake = useCallback((level: GameLevel): Snake => {
    const speed = GAME_CONFIG.levelSpeeds[level];
    return {
      id: Math.random().toString(36).substring(2, 9),
      position: {
        x: GAME_CONFIG.gridWidth + 50,
        y: Math.random() * (GAME_CONFIG.gridHeight - 60) + 30,
      },
      direction: { x: -1, y: Math.random() > 0.5 ? 0.5 : -0.5 },
      speed,
      length: 40 + Math.random() * 30, // Random length between 40-70px
      width: 8 + Math.random() * 4, // Random width between 8-12px
    };
  }, []);

  const initializeGame = useCallback((level: GameLevel) => {
    const snakes: Snake[] = [];
    const snakeCount = GAME_CONFIG.snakeCount[level];
    
    for (let i = 0; i < snakeCount; i++) {
      const snake = generateSnake(level);
      snake.position.x += i * 120; // Space them out more appropriately
      snakes.push(snake);
    }

    setGameState({
      player: {
        position: { x: 60, y: GAME_CONFIG.gridHeight / 2 },
        velocity: 0,
        isAlive: true,
      },
      snakes,
      score: 0,
      level,
      isGameOver: false,
      isPlaying: true,
    });
  }, [generateSnake]);

  const checkCollision = useCallback((playerPos: Position, snake: Snake): boolean => {
    // Check collision with snake body (rectangle)
    const playerRadius = GAME_CONFIG.playerSize / 2;
    const snakeLeft = snake.position.x - snake.length / 2;
    const snakeRight = snake.position.x + snake.length / 2;
    const snakeTop = snake.position.y - snake.width / 2;
    const snakeBottom = snake.position.y + snake.width / 2;
    
    // Check if player circle intersects with snake rectangle
    const closestX = Math.max(snakeLeft, Math.min(playerPos.x, snakeRight));
    const closestY = Math.max(snakeTop, Math.min(playerPos.y, snakeBottom));
    
    const distance = Math.sqrt(
      Math.pow(playerPos.x - closestX, 2) + Math.pow(playerPos.y - closestY, 2)
    );
    
    return distance < playerRadius;
  }, []);

  const updateGame = useCallback(() => {
    setGameState(prevState => {
      if (!prevState.isPlaying || prevState.isGameOver) return prevState;

      const newState = { ...prevState };
      
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
        newState.isGameOver = true;
        newState.isPlaying = false;
        onScoreUpdate(newState.score, newState.level);
        return newState;
      }

      // Update snakes
      newState.snakes = newState.snakes.map(snake => {
        const newSnake = { ...snake };
        newSnake.position.x += newSnake.direction.x * newSnake.speed;
        newSnake.position.y += newSnake.direction.y * 0.5;

        // Bounce snakes off top/bottom
        if (newSnake.position.y <= 0 || newSnake.position.y >= GAME_CONFIG.gridHeight) {
          newSnake.direction.y *= -1;
        }

        // Reset snake if it goes off screen
        if (newSnake.position.x < -50) {
          newSnake.position.x = GAME_CONFIG.gridWidth + 50;
          newSnake.position.y = Math.random() * (GAME_CONFIG.gridHeight - 100) + 50;
          newState.score += 10;
        }

        // Check collision with player
        if (checkCollision(newState.player.position, newSnake)) {
          newState.isGameOver = true;
          newState.isPlaying = false;
          onScoreUpdate(newState.score, newState.level);
        }

        return newSnake;
      });

      return newState;
    });
  }, [checkCollision, onScoreUpdate]);

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    
    setGameState(prevState => ({
      ...prevState,
      player: {
        ...prevState.player,
        velocity: GAME_CONFIG.jumpForce,
      },
    }));
  }, [gameState.isPlaying, gameState.isGameOver]);

  const startGame = useCallback((level: GameLevel) => {
    initializeGame(level);
  }, [initializeGame]);

  const restartGame = useCallback(() => {
    initializeGame(gameState.level);
  }, [initializeGame, gameState.level]);

  // Game loop
  useEffect(() => {
    if (gameState.isPlaying) {
      gameLoopRef.current = window.setInterval(updateGame, 16); // ~60fps
    } else {
      if (gameLoopRef.current) {
        window.clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        window.clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, updateGame]);

  // Render game
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

    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight);

    // Draw grid
    ctx.strokeStyle = '#ffffff20';
    ctx.lineWidth = 1;
    for (let x = 0; x < GAME_CONFIG.gridWidth; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_CONFIG.gridHeight);
      ctx.stroke();
    }
    for (let y = 0; y < GAME_CONFIG.gridHeight; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_CONFIG.gridWidth, y);
      ctx.stroke();
    }

    // Draw player (orange chibi character)
    const playerX = gameState.player.position.x;
    const playerY = gameState.player.position.y;
    const playerRadius = GAME_CONFIG.playerSize / 2;
    
    // Draw chibi body (orange circle)
    ctx.fillStyle = '#FF8C00';
    ctx.strokeStyle = '#FF6347';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerX, playerY, playerRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw chibi eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(playerX - 4, playerY - 3, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(playerX + 4, playerY - 3, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw chibi mouth
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(playerX, playerY + 2, 3, 0, Math.PI);
    ctx.stroke();
    
    // Draw chibi arms/wings (small lines)
    ctx.strokeStyle = '#FF6347';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerX - playerRadius, playerY);
    ctx.lineTo(playerX - playerRadius - 4, playerY - 2);
    ctx.moveTo(playerX + playerRadius, playerY);
    ctx.lineTo(playerX + playerRadius + 4, playerY - 2);
    ctx.stroke();

    // Draw snakes (long bodies)
    gameState.snakes.forEach(snake => {
      const snakeX = snake.position.x;
      const snakeY = snake.position.y;
      const halfLength = snake.length / 2;
      const halfWidth = snake.width / 2;
      
      // Draw snake body (rounded rectangle)
      ctx.fillStyle = '#228B22';
      ctx.strokeStyle = '#006400';
      ctx.lineWidth = 2;
      
      // Main body (rounded rectangle)
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(
          snakeX - halfLength,
          snakeY - halfWidth,
          snake.length,
          snake.width,
          snake.width / 2
        );
      } else {
        // Fallback for browsers without roundRect
        ctx.rect(
          snakeX - halfLength,
          snakeY - halfWidth,
          snake.length,
          snake.width
        );
      }
      ctx.fill();
      ctx.stroke();
      
      // Draw snake head (circle at the front)
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.arc(snakeX + halfLength, snakeY, halfWidth + 1, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Draw snake eyes on head
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(snakeX + halfLength - 2, snakeY - 2, 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(snakeX + halfLength - 2, snakeY + 2, 1.5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw snake pattern (stripes)
      ctx.strokeStyle = '#006400';
      ctx.lineWidth = 1;
      for (let i = 0; i < snake.length; i += 8) {
        ctx.beginPath();
        ctx.moveTo(snakeX - halfLength + i, snakeY - halfWidth);
        ctx.lineTo(snakeX - halfLength + i, snakeY + halfWidth);
        ctx.stroke();
      }
    });
  }, [gameState]);

  // Handle keyboard input
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

  return (
    <div className="flex flex-col items-center gap-4 p-2 sm:p-4 w-full">
      <div className="flex flex-col items-center gap-2 w-full">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
          Snake Dodge - {username}
        </h1>
        <div className="flex gap-4 text-base sm:text-lg">
          <span>Score: {gameState.score}</span>
          <span>Level: {gameState.level}</span>
        </div>
      </div>

      {!gameState.isPlaying && !gameState.isGameOver && (
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-center text-gray-600 text-sm sm:text-base">
            Choose your difficulty level:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => startGame('easy')}
              className="game-button px-3 py-2 sm:px-4 sm:py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm sm:text-base"
            >
              Easy
            </button>
            <button
              onClick={() => startGame('medium')}
              className="game-button px-3 py-2 sm:px-4 sm:py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm sm:text-base"
            >
              Medium
            </button>
            <button
              onClick={() => startGame('hard')}
              className="game-button px-3 py-2 sm:px-4 sm:py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm sm:text-base"
            >
              Hard
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-2xl mx-auto">
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
        
        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white p-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">Game Over!</h2>
            <p className="text-lg sm:text-xl mb-4 text-center">Final Score: {gameState.score}</p>
            <button
              onClick={restartGame}
              className="game-button px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-base sm:text-lg"
            >
              Restart Game
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-xs sm:text-sm text-gray-600 max-w-md px-2 sm:px-4">
        <p className="mb-1">Tap the game area or press SPACE/UP arrow to make the chibi jump!</p>
        <p>Avoid the long green snakes and survive as long as possible.</p>
      </div>
    </div>
  );
};
