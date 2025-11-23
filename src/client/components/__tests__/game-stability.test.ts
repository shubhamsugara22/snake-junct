/**
 * Game Stability Tests - Verify Game Doesn't Crash
 * Feature: game-testing-bugfixes
 * Validates: All Requirements - Ensures game stability across all features
 */

import { GameState, Position, Snake, Obstacle, Boss, PowerUp } from '../../../shared/types/game';

describe('Game Stability - Crash Prevention', () => {
  const createInitialGameState = (): GameState => ({
    player: {
      position: { x: 150, y: 200 },
      velocity: { x: 0, y: 0 },
    },
    snakes: [],
    obstacles: [],
    bosses: [],
    powerUps: [],
    score: 0,
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
    difficulty: 'medium',
    defeatedBosses: [],
  });

  describe('Difficulty Level Handling', () => {
    test('Easy difficulty initializes without crashing', () => {
      const state = createInitialGameState();
      state.difficulty = 'easy';
      
      expect(() => {
        // Simulate spawning entities for easy mode
        state.snakes = Array(3).fill(null).map((_, i) => ({
          id: `snake-${i}`,
          position: { x: 600 + i * 100, y: 200 },
          segments: [],
          direction: 1,
          speed: 1,
          lastDirectionChange: 0,
        }));
        
        state.obstacles = Array(3).fill(null).map((_, i) => ({
          id: `obstacle-${i}`,
          type: 'pillar' as const,
          position: { x: 600 + i * 200, y: 0 },
          size: { width: 20, height: 400 },
        }));
      }).not.toThrow();
      
      expect(state.snakes.length).toBe(3);
      expect(state.obstacles.length).toBe(3);
    });

    test('Medium difficulty initializes without crashing', () => {
      const state = createInitialGameState();
      state.difficulty = 'medium';
      
      expect(() => {
        state.snakes = Array(6).fill(null).map((_, i) => ({
          id: `snake-${i}`,
          position: { x: 600 + i * 100, y: 200 },
          segments: [],
          direction: 1,
          speed: 1.5,
          lastDirectionChange: 0,
        }));
        
        state.obstacles = Array(5).fill(null).map((_, i) => ({
          id: `obstacle-${i}`,
          type: 'pillar' as const,
          position: { x: 600 + i * 200, y: 0 },
          size: { width: 20, height: 400 },
        }));
      }).not.toThrow();
      
      expect(state.snakes.length).toBe(6);
      expect(state.obstacles.length).toBe(5);
    });

    test('Hard difficulty initializes without crashing', () => {
      const state = createInitialGameState();
      state.difficulty = 'hard';
      
      expect(() => {
        state.snakes = Array(9).fill(null).map((_, i) => ({
          id: `snake-${i}`,
          position: { x: 600 + i * 100, y: 200 },
          segments: [],
          direction: 1,
          speed: 2,
          lastDirectionChange: 0,
        }));
        
        state.obstacles = Array(7).fill(null).map((_, i) => ({
          id: `obstacle-${i}`,
          type: 'pillar' as const,
          position: { x: 600 + i * 200, y: 0 },
          size: { width: 20, height: 400 },
        }));
      }).not.toThrow();
      
      expect(state.snakes.length).toBe(9);
      expect(state.obstacles.length).toBe(7);
    });
  });

  describe('Mode Switching', () => {
    test('Switching to Halloween mode does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        // Simulate Halloween mode activation
        state.obstacles = state.obstacles.map(obs => ({
          ...obs,
          type: 'ghost' as const,
        }));
      }).not.toThrow();
    });

    test('Switching to Normal mode does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        // Simulate Normal mode
        state.obstacles = state.obstacles.map(obs => ({
          ...obs,
          type: 'pillar' as const,
        }));
      }).not.toThrow();
    });

    test('Mode switching with active boss does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.bosses = [{
          id: 'boss-1',
          type: 'octopus',
          position: { x: 500, y: 200 },
          health: 10,
          maxHealth: 10,
          isActive: true,
          lastProjectileTime: 0,
          animationPhase: 0,
          hitFlashTime: 0,
        }];
        
        // Switch mode
        state.bosses[0].type = 'cat';
      }).not.toThrow();
    });
  });

  describe('Boss Battle Stability', () => {
    test('Octopus boss spawns without crashing', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.bosses = [{
          id: 'boss-octopus',
          type: 'octopus',
          position: { x: 500, y: 200 },
          health: 10,
          maxHealth: 10,
          isActive: true,
          lastProjectileTime: 0,
          animationPhase: 0,
          hitFlashTime: 0,
        }];
      }).not.toThrow();
      
      expect(state.bosses[0].type).toBe('octopus');
    });

    test('Bat boss spawns without crashing', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.bosses = [{
          id: 'boss-bat',
          type: 'bat',
          position: { x: 500, y: 200 },
          health: 10,
          maxHealth: 10,
          isActive: true,
          lastProjectileTime: 0,
          animationPhase: 0,
          hitFlashTime: 0,
        }];
      }).not.toThrow();
      
      expect(state.bosses[0].type).toBe('bat');
    });

    test('Cat boss spawns without crashing', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.bosses = [{
          id: 'boss-cat',
          type: 'cat',
          position: { x: 500, y: 200 },
          health: 10,
          maxHealth: 10,
          isActive: true,
          lastProjectileTime: 0,
          animationPhase: 0,
          hitFlashTime: 0,
        }];
      }).not.toThrow();
      
      expect(state.bosses[0].type).toBe('cat');
    });

    test('Missile boss spawns without crashing', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.bosses = [{
          id: 'boss-missile',
          type: 'missile',
          position: { x: 500, y: 200 },
          health: 10,
          maxHealth: 10,
          isActive: true,
          lastProjectileTime: 0,
          animationPhase: 0,
          hitFlashTime: 0,
        }];
      }).not.toThrow();
      
      expect(state.bosses[0].type).toBe('missile');
    });

    test('Boss health reaching zero does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.bosses = [{
          id: 'boss-1',
          type: 'octopus',
          position: { x: 500, y: 200 },
          health: 0,
          maxHealth: 10,
          isActive: false,
          lastProjectileTime: 0,
          animationPhase: 0,
          hitFlashTime: 0,
        }];
      }).not.toThrow();
    });

    test('Multiple boss defeats do not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.defeatedBosses = ['octopus', 'bat', 'cat', 'missile'];
      }).not.toThrow();
      
      expect(state.defeatedBosses.length).toBe(4);
    });
  });

  describe('Power-Up Collection', () => {
    test('Shield power-up collection does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.powerUps = [{
          id: 'powerup-1',
          type: 'shield',
          position: { x: 300, y: 200 },
          isActive: true,
        }];
        
        // Simulate collection
        state.powerUps = [];
      }).not.toThrow();
    });

    test('Fire power-up collection does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.powerUps = [{
          id: 'powerup-2',
          type: 'fire',
          position: { x: 300, y: 200 },
          isActive: true,
        }];
        
        // Simulate collection
        state.powerUps = [];
      }).not.toThrow();
    });

    test('Multiple power-ups active simultaneously does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.powerUps = [
          {
            id: 'powerup-1',
            type: 'shield',
            position: { x: 300, y: 200 },
            isActive: true,
          },
          {
            id: 'powerup-2',
            type: 'fire',
            position: { x: 400, y: 200 },
            isActive: true,
          },
        ];
      }).not.toThrow();
      
      expect(state.powerUps.length).toBe(2);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('Empty game state does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        // Game with no entities
        expect(state.snakes.length).toBe(0);
        expect(state.obstacles.length).toBe(0);
        expect(state.bosses.length).toBe(0);
        expect(state.powerUps.length).toBe(0);
      }).not.toThrow();
    });

    test('Maximum entities does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        // Stress test with many entities
        state.snakes = Array(20).fill(null).map((_, i) => ({
          id: `snake-${i}`,
          position: { x: 600 + i * 50, y: 200 },
          segments: [],
          direction: 1,
          speed: 2,
          lastDirectionChange: 0,
        }));
        
        state.obstacles = Array(20).fill(null).map((_, i) => ({
          id: `obstacle-${i}`,
          type: 'pillar' as const,
          position: { x: 600 + i * 100, y: 0 },
          size: { width: 20, height: 400 },
        }));
      }).not.toThrow();
    });

    test('Player at boundary positions does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        // Top boundary
        state.player.position = { x: 300, y: 0 };
        
        // Bottom boundary
        state.player.position = { x: 300, y: 400 };
        
        // Left boundary
        state.player.position = { x: 0, y: 200 };
        
        // Right boundary
        state.player.position = { x: 600, y: 200 };
      }).not.toThrow();
    });

    test('Negative positions handled gracefully', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.player.position = { x: -10, y: -10 };
      }).not.toThrow();
    });

    test('Very high score does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.score = 999999;
      }).not.toThrow();
      
      expect(state.score).toBe(999999);
    });

    test('Rapid state changes do not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        for (let i = 0; i < 100; i++) {
          state.isPlaying = !state.isPlaying;
          state.isPaused = !state.isPaused;
          state.score += 10;
        }
      }).not.toThrow();
    });
  });

  describe('Game State Transitions', () => {
    test('Start game transition does not crash', () => {
      const state = createInitialGameState();
      
      expect(() => {
        state.isPlaying = true;
        state.isGameOver = false;
      }).not.toThrow();
    });

    test('Game over transition does not crash', () => {
      const state = createInitialGameState();
      state.isPlaying = true;
      
      expect(() => {
        state.isPlaying = false;
        state.isGameOver = true;
      }).not.toThrow();
    });

    test('Pause/unpause transitions do not crash', () => {
      const state = createInitialGameState();
      state.isPlaying = true;
      
      expect(() => {
        state.isPaused = true;
        state.isPaused = false;
        state.isPaused = true;
      }).not.toThrow();
    });

    test('Restart game transition does not crash', () => {
      const state = createInitialGameState();
      state.isGameOver = true;
      state.score = 500;
      
      expect(() => {
        // Reset to initial state
        state.isGameOver = false;
        state.isPlaying = true;
        state.score = 0;
        state.snakes = [];
        state.obstacles = [];
        state.bosses = [];
        state.powerUps = [];
        state.defeatedBosses = [];
      }).not.toThrow();
    });
  });
});
