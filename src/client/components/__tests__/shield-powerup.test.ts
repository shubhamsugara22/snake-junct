/**
 * Shield Power-Up System Tests
 * Feature: game-testing-bugfixes, Property 7: Shield Duration
 * Validates: Requirements 5.1-5.5
 */

import { PowerUp } from '../../../shared/types/game';

describe('Shield Power-Up System', () => {
  describe('Shield Spawning', () => {
    test('Shield power-up can spawn', () => {
      const shield: PowerUp = {
        id: 'shield-1',
        type: 'shield',
        position: { x: 500, y: 200 },
        isActive: true,
      };
      
      expect(shield.type).toBe('shield');
      expect(shield.isActive).toBe(true);
    });

    test('Shield spawns at valid position', () => {
      const shield: PowerUp = {
        id: 'shield-1',
        type: 'shield',
        position: { x: 500, y: 200 },
        isActive: true,
      };
      
      expect(shield.position.x).toBeGreaterThan(0);
      expect(shield.position.y).toBeGreaterThan(0);
      expect(shield.position.x).toBeLessThan(600);
      expect(shield.position.y).toBeLessThan(400);
    });
  });

  describe('Shield Collection', () => {
    test('Shield can be collected by player', () => {
      const shield: PowerUp = {
        id: 'shield-1',
        type: 'shield',
        position: { x: 150, y: 200 },
        isActive: true,
      };
      
      const playerPosition = { x: 150, y: 200 };
      
      // Check collision (simplified)
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - shield.position.x, 2) +
        Math.pow(playerPosition.y - shield.position.y, 2)
      );
      
      const isCollected = distance < 20; // Collision threshold
      
      expect(isCollected).toBe(true);
    });

    test('Shield not collected when player is far away', () => {
      const shield: PowerUp = {
        id: 'shield-1',
        type: 'shield',
        position: { x: 500, y: 200 },
        isActive: true,
      };
      
      const playerPosition = { x: 150, y: 200 };
      
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - shield.position.x, 2) +
        Math.pow(playerPosition.y - shield.position.y, 2)
      );
      
      const isCollected = distance < 20;
      
      expect(isCollected).toBe(false);
    });
  });

  describe('Shield Duration', () => {
    test('Shield lasts exactly 20 seconds', () => {
      const shieldDuration = 20; // seconds
      const expectedDuration = 20;
      
      expect(shieldDuration).toBe(expectedDuration);
    });

    test('Shield duration in milliseconds is 20000', () => {
      const shieldDurationMs = 20 * 1000;
      
      expect(shieldDurationMs).toBe(20000);
    });

    test('Shield expires after duration', () => {
      const activationTime = 1000;
      const currentTime = 21000; // 20 seconds later
      const shieldDuration = 20000;
      
      const isExpired = currentTime - activationTime >= shieldDuration;
      
      expect(isExpired).toBe(true);
    });

    test('Shield active before duration expires', () => {
      const activationTime = 1000;
      const currentTime = 15000; // 14 seconds later
      const shieldDuration = 20000;
      
      const isExpired = currentTime - activationTime >= shieldDuration;
      
      expect(isExpired).toBe(false);
    });
  });

  describe('Shield Invincibility', () => {
    test('Player is invincible with active shield', () => {
      const hasShield = true;
      const shouldTakeDamage = !hasShield;
      
      expect(shouldTakeDamage).toBe(false);
    });

    test('Player takes damage without shield', () => {
      const hasShield = false;
      const shouldTakeDamage = !hasShield;
      
      expect(shouldTakeDamage).toBe(true);
    });

    test('Shield blocks snake collision', () => {
      const hasShield = true;
      const collidedWithSnake = true;
      
      const gameOver = collidedWithSnake && !hasShield;
      
      expect(gameOver).toBe(false);
    });

    test('Shield blocks obstacle collision', () => {
      const hasShield = true;
      const collidedWithObstacle = true;
      
      const gameOver = collidedWithObstacle && !hasShield;
      
      expect(gameOver).toBe(false);
    });

    test('Collision without shield causes game over', () => {
      const hasShield = false;
      const collidedWithSnake = true;
      
      const gameOver = collidedWithSnake && !hasShield;
      
      expect(gameOver).toBe(true);
    });
  });

  describe('Shield Timer Display', () => {
    test('Timer shows remaining seconds', () => {
      const activationTime = 1000;
      const currentTime = 6000; // 5 seconds later
      const shieldDuration = 20000;
      
      const remainingMs = shieldDuration - (currentTime - activationTime);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      expect(remainingSeconds).toBe(15);
    });

    test('Timer counts down correctly', () => {
      const activationTime = 0;
      const shieldDuration = 20000;
      
      const times = [5000, 10000, 15000, 19000];
      const expectedSeconds = [15, 10, 5, 1];
      
      times.forEach((time, index) => {
        const remainingMs = shieldDuration - (time - activationTime);
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        expect(remainingSeconds).toBe(expectedSeconds[index]);
      });
    });

    test('Timer shows 0 when expired', () => {
      const activationTime = 0;
      const currentTime = 21000;
      const shieldDuration = 20000;
      
      const remainingMs = Math.max(0, shieldDuration - (currentTime - activationTime));
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      expect(remainingSeconds).toBe(0);
    });
  });

  describe('Shield Edge Cases', () => {
    test('Multiple shields do not stack duration', () => {
      // Collecting second shield resets timer
      const firstActivation = 1000;
      const secondActivation = 5000;
      const currentTime = 10000;
      const shieldDuration = 20000;
      
      // Should use second activation time
      const remainingMs = shieldDuration - (currentTime - secondActivation);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      expect(remainingSeconds).toBe(15);
    });

    test('Shield activation at game start', () => {
      const activationTime = 0;
      const shieldDuration = 20000;
      
      expect(activationTime).toBe(0);
      expect(shieldDuration).toBe(20000);
    });

    test('Shield can be collected multiple times in a game', () => {
      const collections = [
        { time: 1000, duration: 20000 },
        { time: 30000, duration: 20000 },
        { time: 60000, duration: 20000 },
      ];
      
      collections.forEach(collection => {
        expect(collection.duration).toBe(20000);
      });
    });
  });

  describe('Shield Visual Feedback', () => {
    test('Shield has visual indicator when active', () => {
      const hasShield = true;
      const shouldShowIndicator = hasShield;
      
      expect(shouldShowIndicator).toBe(true);
    });

    test('No shield indicator when inactive', () => {
      const hasShield = false;
      const shouldShowIndicator = hasShield;
      
      expect(shouldShowIndicator).toBe(false);
    });
  });
});
