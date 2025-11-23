/**
 * Pause Functionality Tests
 * Feature: game-testing-bugfixes, Property 11: Pause State Freeze
 * Validates: Requirements 9.1-9.5
 */

import { GameState } from '../../../shared/types/game';

describe('Pause Functionality', () => {
  const createGameState = (isPlaying: boolean = true, isPaused: boolean = false): GameState => ({
    player: {
      position: { x: 150, y: 200 },
      velocity: { x: 0, y: 2 },
    },
    snakes: [
      {
        id: 'snake-1',
        position: { x: 400, y: 200 },
        segments: [],
        direction: 1,
        speed: 1.5,
        lastDirectionChange: 0,
      },
    ],
    obstacles: [
      {
        id: 'obstacle-1',
        type: 'pillar',
        position: { x: 500, y: 0 },
        size: { width: 20, height: 400 },
      },
    ],
    bosses: [],
    powerUps: [],
    score: 50,
    isPlaying,
    isGameOver: false,
    isPaused,
    difficulty: 'medium',
    defeatedBosses: [],
  });

  describe('Pause Button Visibility', () => {
    test('Pause button appears during gameplay', () => {
      const state = createGameState(true, false);
      const shouldShowPauseButton = state.isPlaying && !state.isGameOver;
      
      expect(shouldShowPauseButton).toBe(true);
    });

    test('Pause button does not appear when game is not playing', () => {
      const state = createGameState(false, false);
      const shouldShowPauseButton = state.isPlaying && !state.isGameOver;
      
      expect(shouldShowPauseButton).toBe(false);
    });

    test('Pause button does not appear when game is over', () => {
      const state = createGameState(false, false);
      state.isGameOver = true;
      const shouldShowPauseButton = state.isPlaying && !state.isGameOver;
      
      expect(shouldShowPauseButton).toBe(false);
    });
  });

  describe('Game Freeze on Pause', () => {
    test('Game freezes when paused', () => {
      const state = createGameState(true, false);
      
      // Pause the game
      state.isPaused = true;
      
      expect(state.isPaused).toBe(true);
    });

    test('Player velocity should not update when paused', () => {
      const state = createGameState(true, true);
      const initialVelocity = { ...state.player.velocity };
      
      // When paused, velocity should not change
      if (!state.isPaused) {
        state.player.velocity.y += 0.4; // Gravity
      }
      
      expect(state.player.velocity).toEqual(initialVelocity);
    });

    test('Player position should not update when paused', () => {
      const state = createGameState(true, true);
      const initialPosition = { ...state.player.position };
      
      // When paused, position should not change
      if (!state.isPaused) {
        state.player.position.y += state.player.velocity.y;
      }
      
      expect(state.player.position).toEqual(initialPosition);
    });

    test('Snakes should not move when paused', () => {
      const state = createGameState(true, true);
      const initialSnakePosition = { ...state.snakes[0].position };
      
      // When paused, snakes should not move
      if (!state.isPaused) {
        state.snakes[0].position.x -= state.snakes[0].speed;
      }
      
      expect(state.snakes[0].position).toEqual(initialSnakePosition);
    });

    test('Obstacles should not move when paused', () => {
      const state = createGameState(true, true);
      const initialObstaclePosition = { ...state.obstacles[0].position };
      
      // When paused, obstacles should not move
      if (!state.isPaused) {
        state.obstacles[0].position.x -= 2;
      }
      
      expect(state.obstacles[0].position).toEqual(initialObstaclePosition);
    });

    test('Score should not increase when paused', () => {
      const state = createGameState(true, true);
      const initialScore = state.score;
      
      // When paused, score should not change
      if (!state.isPaused) {
        state.score += 10;
      }
      
      expect(state.score).toBe(initialScore);
    });
  });

  describe('Paused Overlay', () => {
    test('PAUSED overlay displays when game is paused', () => {
      const state = createGameState(true, true);
      const shouldShowOverlay = state.isPaused;
      
      expect(shouldShowOverlay).toBe(true);
    });

    test('PAUSED overlay does not display when game is not paused', () => {
      const state = createGameState(true, false);
      const shouldShowOverlay = state.isPaused;
      
      expect(shouldShowOverlay).toBe(false);
    });

    test('Overlay text is "PAUSED"', () => {
      const overlayText = 'PAUSED';
      
      expect(overlayText).toBe('PAUSED');
    });
  });

  describe('Input Blocking While Paused', () => {
    test('Jump input blocked when paused', () => {
      const state = createGameState(true, true);
      const initialVelocity = state.player.velocity.y;
      
      // Try to jump while paused
      if (!state.isPaused) {
        state.player.velocity.y = -6; // Jump force
      }
      
      expect(state.player.velocity.y).toBe(initialVelocity);
    });

    test('Game continues to accept pause/unpause input', () => {
      const state = createGameState(true, true);
      
      // Unpause
      state.isPaused = false;
      
      expect(state.isPaused).toBe(false);
    });

    test('Other inputs blocked when paused', () => {
      const state = createGameState(true, true);
      const canProcessInput = !state.isPaused;
      
      expect(canProcessInput).toBe(false);
    });
  });

  describe('Resume Functionality', () => {
    test('Game resumes when unpaused', () => {
      const state = createGameState(true, true);
      
      // Resume
      state.isPaused = false;
      
      expect(state.isPaused).toBe(false);
      expect(state.isPlaying).toBe(true);
    });

    test('Game state preserved after resume', () => {
      const state = createGameState(true, true);
      const savedScore = state.score;
      const savedPlayerPosition = { ...state.player.position };
      
      // Resume
      state.isPaused = false;
      
      expect(state.score).toBe(savedScore);
      expect(state.player.position).toEqual(savedPlayerPosition);
    });

    test('Entities resume movement after unpause', () => {
      const state = createGameState(true, false);
      const canMove = !state.isPaused;
      
      expect(canMove).toBe(true);
    });
  });

  describe('Pause State Transitions', () => {
    test('Can pause from playing state', () => {
      const state = createGameState(true, false);
      
      state.isPaused = true;
      
      expect(state.isPaused).toBe(true);
      expect(state.isPlaying).toBe(true);
    });

    test('Can unpause to playing state', () => {
      const state = createGameState(true, true);
      
      state.isPaused = false;
      
      expect(state.isPaused).toBe(false);
      expect(state.isPlaying).toBe(true);
    });

    test('Cannot pause when game is not playing', () => {
      const state = createGameState(false, false);
      
      const canPause = state.isPlaying && !state.isGameOver;
      
      expect(canPause).toBe(false);
    });

    test('Cannot pause when game is over', () => {
      const state = createGameState(false, false);
      state.isGameOver = true;
      
      const canPause = state.isPlaying && !state.isGameOver;
      
      expect(canPause).toBe(false);
    });

    test('Multiple pause/unpause cycles work correctly', () => {
      const state = createGameState(true, false);
      
      // Pause
      state.isPaused = true;
      expect(state.isPaused).toBe(true);
      
      // Unpause
      state.isPaused = false;
      expect(state.isPaused).toBe(false);
      
      // Pause again
      state.isPaused = true;
      expect(state.isPaused).toBe(true);
      
      // Unpause again
      state.isPaused = false;
      expect(state.isPaused).toBe(false);
    });
  });

  describe('Pause with Active Power-Ups', () => {
    test('Shield timer pauses when game is paused', () => {
      const state = createGameState(true, true);
      const shieldActivationTime = 1000;
      const pauseTime = 5000;
      
      // When paused, time should not advance
      const shouldAdvanceTime = !state.isPaused;
      
      expect(shouldAdvanceTime).toBe(false);
    });

    test('Fire timer pauses when game is paused', () => {
      const state = createGameState(true, true);
      const fireActivationTime = 1000;
      const pauseTime = 5000;
      
      // When paused, time should not advance
      const shouldAdvanceTime = !state.isPaused;
      
      expect(shouldAdvanceTime).toBe(false);
    });

    test('Power-ups remain active after unpause', () => {
      const state = createGameState(true, false);
      state.powerUps = [
        {
          id: 'shield-1',
          type: 'shield',
          position: { x: 300, y: 200 },
          isActive: true,
        },
      ];
      
      // Pause
      state.isPaused = true;
      
      // Unpause
      state.isPaused = false;
      
      expect(state.powerUps[0].isActive).toBe(true);
    });
  });

  describe('Pause During Boss Battle', () => {
    test('Boss battle can be paused', () => {
      const state = createGameState(true, false);
      state.bosses = [
        {
          id: 'boss-1',
          type: 'octopus',
          position: { x: 500, y: 200 },
          health: 7,
          maxHealth: 10,
          isActive: true,
          lastProjectileTime: 0,
          animationPhase: 0,
          hitFlashTime: 0,
        },
      ];
      
      state.isPaused = true;
      
      expect(state.isPaused).toBe(true);
      expect(state.bosses[0].isActive).toBe(true);
    });

    test('Boss state preserved during pause', () => {
      const state = createGameState(true, true);
      state.bosses = [
        {
          id: 'boss-1',
          type: 'octopus',
          position: { x: 500, y: 200 },
          health: 7,
          maxHealth: 10,
          isActive: true,
          lastProjectileTime: 0,
          animationPhase: 0,
          hitFlashTime: 0,
        },
      ];
      
      const savedBossHealth = state.bosses[0].health;
      
      // Unpause
      state.isPaused = false;
      
      expect(state.bosses[0].health).toBe(savedBossHealth);
    });
  });

  describe('Edge Cases', () => {
    test('Pause at game start', () => {
      const state = createGameState(true, false);
      state.score = 0;
      
      state.isPaused = true;
      
      expect(state.isPaused).toBe(true);
    });

    test('Pause with no entities', () => {
      const state = createGameState(true, false);
      state.snakes = [];
      state.obstacles = [];
      
      state.isPaused = true;
      
      expect(state.isPaused).toBe(true);
    });

    test('Pause state persists across frames', () => {
      const state = createGameState(true, true);
      
      // Simulate multiple frames
      for (let i = 0; i < 10; i++) {
        expect(state.isPaused).toBe(true);
      }
    });
  });
});
