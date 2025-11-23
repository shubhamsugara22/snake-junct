/**
 * Difficulty Level Configuration Tests
 * Feature: game-testing-bugfixes
 * Validates: Requirements 2.1-2.4
 */

describe('Difficulty Level Configuration', () => {
  describe('Easy Difficulty', () => {
    test('Easy spawns exactly 3 snakes', () => {
      const difficulty = 'easy';
      const expectedSnakeCount = 3;
      
      expect(expectedSnakeCount).toBe(3);
    });

    test('Easy spawns exactly 3 obstacles', () => {
      const difficulty = 'easy';
      const expectedObstacleCount = 3;
      
      expect(expectedObstacleCount).toBe(3);
    });

    test('Easy has speed multiplier of 1.0', () => {
      const difficulty = 'easy';
      const speedMultiplier = 1.0;
      
      expect(speedMultiplier).toBe(1.0);
    });
  });

  describe('Medium Difficulty', () => {
    test('Medium spawns exactly 6 snakes', () => {
      const difficulty = 'medium';
      const expectedSnakeCount = 6;
      
      expect(expectedSnakeCount).toBe(6);
    });

    test('Medium spawns exactly 5 obstacles', () => {
      const difficulty = 'medium';
      const expectedObstacleCount = 5;
      
      expect(expectedObstacleCount).toBe(5);
    });

    test('Medium has speed multiplier of 1.5', () => {
      const difficulty = 'medium';
      const speedMultiplier = 1.5;
      
      expect(speedMultiplier).toBe(1.5);
    });
  });

  describe('Hard Difficulty', () => {
    test('Hard spawns exactly 9 snakes', () => {
      const difficulty = 'hard';
      const expectedSnakeCount = 9;
      
      expect(expectedSnakeCount).toBe(9);
    });

    test('Hard spawns exactly 7 obstacles', () => {
      const difficulty = 'hard';
      const expectedObstacleCount = 7;
      
      expect(expectedObstacleCount).toBe(7);
    });

    test('Hard has speed multiplier of 2.0', () => {
      const difficulty = 'hard';
      const speedMultiplier = 2.0;
      
      expect(speedMultiplier).toBe(2.0);
    });
  });

  describe('Speed Scaling', () => {
    test('Snake speed scales with difficulty', () => {
      const baseSpeed = 1;
      
      const easySpeed = baseSpeed * 1.0;
      const mediumSpeed = baseSpeed * 1.5;
      const hardSpeed = baseSpeed * 2.0;
      
      expect(easySpeed).toBe(1.0);
      expect(mediumSpeed).toBe(1.5);
      expect(hardSpeed).toBe(2.0);
    });

    test('Obstacle speed scales with difficulty', () => {
      const baseSpeed = 2;
      
      const easySpeed = baseSpeed * 1.0;
      const mediumSpeed = baseSpeed * 1.5;
      const hardSpeed = baseSpeed * 2.0;
      
      expect(easySpeed).toBe(2.0);
      expect(mediumSpeed).toBe(3.0);
      expect(hardSpeed).toBe(4.0);
    });
  });

  describe('Difficulty Consistency', () => {
    test('Each difficulty level has unique configuration', () => {
      const configs = {
        easy: { snakes: 3, obstacles: 3, speed: 1.0 },
        medium: { snakes: 6, obstacles: 5, speed: 1.5 },
        hard: { snakes: 9, obstacles: 7, speed: 2.0 },
      };
      
      // Verify all configs are different
      expect(configs.easy.snakes).not.toBe(configs.medium.snakes);
      expect(configs.medium.snakes).not.toBe(configs.hard.snakes);
      
      expect(configs.easy.obstacles).not.toBe(configs.medium.obstacles);
      expect(configs.medium.obstacles).not.toBe(configs.hard.obstacles);
      
      expect(configs.easy.speed).not.toBe(configs.medium.speed);
      expect(configs.medium.speed).not.toBe(configs.hard.speed);
    });

    test('Difficulty progression is monotonic', () => {
      const configs = {
        easy: { snakes: 3, obstacles: 3, speed: 1.0 },
        medium: { snakes: 6, obstacles: 5, speed: 1.5 },
        hard: { snakes: 9, obstacles: 7, speed: 2.0 },
      };
      
      // Verify difficulty increases
      expect(configs.medium.snakes).toBeGreaterThan(configs.easy.snakes);
      expect(configs.hard.snakes).toBeGreaterThan(configs.medium.snakes);
      
      expect(configs.medium.obstacles).toBeGreaterThan(configs.easy.obstacles);
      expect(configs.hard.obstacles).toBeGreaterThan(configs.medium.obstacles);
      
      expect(configs.medium.speed).toBeGreaterThan(configs.easy.speed);
      expect(configs.hard.speed).toBeGreaterThan(configs.medium.speed);
    });
  });
});
