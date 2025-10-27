import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameState,
  GameLevel,
  Position,
  Snake,
  Obstacle,
  GameConfig,
} from '../../shared/types/game';

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

type BackgroundTheme = 'beach' | 'night' | 'retro' | 'desert' | 'halloween';
type CharacterSkin = 'orange' | 'blue' | 'pink' | 'green' | 'purple';

const BACKGROUND_THEMES: BackgroundTheme[] = ['beach', 'night', 'retro', 'desert'];

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

type GameProps = {
  username: string;
  onScoreUpdate: (score: number, level: GameLevel) => void;
};

export const Game = ({ username, onScoreUpdate }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const [selectedSkin, setSelectedSkin] = useState<CharacterSkin>('orange');

  // ML tracking refs
  const gameStartTime = useRef<number>(0);
  const jumpCount = useRef<number>(0);
  const lastJumpTime = useRef<number>(0);
  const reactionTimes = useRef<number[]>([]);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() =>
    getPlayerProfile(username)
  );

  const [gameState, setGameState] = useState<GameState>({
    player: {
      position: { x: 60, y: GAME_CONFIG.gridHeight / 2 },
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
  });

  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>('beach');

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

  const generateObstacle = useCallback((): Obstacle => {
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

      // Randomly select background theme (or force Halloween if event active)
      const randomTheme = HALLOWEEN_EVENT_ACTIVE
        ? HALLOWEEN_THEME
        : BACKGROUND_THEMES[Math.floor(Math.random() * BACKGROUND_THEMES.length)] || 'beach';
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
          const obstacle = generateObstacle();
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

      // Reset ML tracking
      gameStartTime.current = Date.now();
      jumpCount.current = 0;
      lastJumpTime.current = 0;
      reactionTimes.current = [];

      setGameState({
        player: {
          position: { x: 60, y: GAME_CONFIG.gridHeight / 2 },
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

      // Check if shield expired
      if (newState.shieldActive && Date.now() > newState.shieldEndTime) {
        newState.shieldActive = false;
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
          newState.shieldActive = true;
          newState.shieldEndTime = Date.now() + 20000; // 20 seconds
          playPowerUpSound();
        }

        // Reset if off screen at random positions
        if (newPowerUp.position.x < -50 && !newPowerUp.collected) {
          newPowerUp.position.x = GAME_CONFIG.gridWidth + Math.random() * 600 + 300;
          newPowerUp.position.y = 80 + Math.random() * (GAME_CONFIG.gridHeight - 160);
        }

        return newPowerUp;
      });

      // Update snakes
      newState.snakes = newState.snakes.map((snake) => {
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

        if (checkSnakeCollision(newState.player.position, newSnake) && !newState.shieldActive) {
          newState.isGameOver = true;
          newState.isPlaying = false;

          // Halloween event - play witch cackle on collision
          if (HALLOWEEN_EVENT_ACTIVE) {
            playWitchCackle();
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

        return newSnake;
      });

      // Update obstacles
      newState.obstacles = newState.obstacles.map((obstacle) => {
        const newObstacle = { ...obstacle };
        newObstacle.position.x -= 1;

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
    if (gameState.isPlaying) {
      gameLoopRef.current = window.setInterval(updateGame, 16);
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
    }

    // Draw power-ups
    gameState.powerUps.forEach((powerUp) => {
      if (powerUp.collected) return;

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
      }
    });
  }, [gameState, backgroundTheme]);

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
                  <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Score</span>
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
                  <span className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Level</span>
                  <span className="text-purple-900 font-black text-xl uppercase">
                    {gameState.level}
                  </span>
                </div>
              </div>
              {/* Progress bar indicator */}
              <div className="absolute bottom-0 left-0 h-1 bg-purple-600 transition-all duration-500"
                   style={{ width: gameState.level === 'easy' ? '33%' : gameState.level === 'medium' ? '66%' : '100%' }}>
              </div>
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
                  <span className="text-xs text-green-600 font-semibold uppercase tracking-wide">AI Skill</span>
                  <span className="text-green-900 font-black text-xl tabular-nums">
                    {Math.round(playerProfile.skillLevel * 100)}%
                  </span>
                </div>
              </div>
              {/* Skill level progress bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-1000"
                   style={{ width: `${playerProfile.skillLevel * 100}%` }}>
              </div>
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
                    <span className="text-xs text-cyan-600 font-semibold uppercase tracking-wide">Shield</span>
                    <span className="text-cyan-900 font-black text-xl tabular-nums">
                      {Math.ceil((gameState.shieldEndTime - Date.now()) / 1000)}s
                    </span>
                  </div>
                </div>
                {/* Countdown progress bar */}
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-1000"
                  style={{ 
                    width: `${((gameState.shieldEndTime - Date.now()) / 20000) * 100}%` 
                  }}>
                </div>
                {/* Pulsing glow */}
                <div className="absolute inset-0 bg-cyan-400 opacity-20 blur-lg animate-pulse"></div>
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

        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white p-4">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-center text-red-400">
              Game Over!
            </h2>
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
              Avoid flying witches and evil pumpkins! Collect shields for protection!
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
    </div>
  );
};
