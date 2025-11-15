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
  const [level, setLevel] = useState<GameLevel>('easy');

  // Player state
  const playerState = useRef({
    y: GAME_HEIGHT / 2,
    velocityY: 0,
    isAlive: true,
  });

  // Game constants
  const GRAVITY = 0.4;
  const JUMP_FORCE = -6;
  const PLAYER_SIZE = 20;

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

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isPlaying || !playerState.current.isAlive) return;

    const player = playerRef.current;
    const layer = layerRef.current;
    if (!player || !layer) return;

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

    layer.batchDraw();

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying]);

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
    setLevel(selectedLevel);
    setScore(0);
    playerState.current = {
      y: GAME_HEIGHT / 2,
      velocityY: 0,
      isAlive: true,
    };
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
        {!isPlaying && (
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
      </div>
    </div>
  );
};
