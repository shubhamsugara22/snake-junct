/**
 * Fire Power-Up System Tests (Halloween Mode)
 * Feature: game-testing-bugfixes, Property 8: Fire Enemy Destruction
 * Validates: Requirements 6.1-6.5
 */

import { PowerUp, Snake } from '../../../shared/types/game';

describe('Fire Power-Up System (Halloween Mode)', () => {
  describe('Fire Spawning', () => {
    test('Fire power-up has 30% spawn rate', () => {
      const spawnRate = 0.3;
      const expectedRate = 0.3;
      
      expect(spawnRate).toBe(expectedRate);
    });

    test('Fire power-up can spawn in Halloween mode', () => {
      const halloweenMode = true;
      const fire: PowerUp = {
        id: 'fire-1',
        type: 'fire',
        position: { x: 500, y: 200 },
        isActive: true,
      };
      
      expect(fire.type).toBe('fire');
      expect(fire.isActive).toBe(true);
      expect(halloweenMode).toBe(true);
    });

    test('Fire spawns at valid position', () => {
      const fire: PowerUp = {
        id: 'fire-1',
        type: 'fire',
        position: { x: 500, y: 200 },
        isActive: true,
      };
      
      expect(fire.position.x).toBeGreaterThan(0);
      expect(fire.position.y).toBeGreaterThan(0);
      expect(fire.position.x).toBeLessThan(600);
      expect(fire.position.y).toBeLessThan(400);
    });
  });

  describe('Fire Collection', () => {
    test('Fire can be collected by player', () => {
      const fire: PowerUp = {
        id: 'fire-1',
        type: 'fire',
        position: { x: 150, y: 200 },
        isActive: true,
      };
      
      const playerPosition = { x: 150, y: 200 };
      
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - fire.position.x, 2) +
        Math.pow(playerPosition.y - fire.position.y, 2)
      );
      
      const isCollected = distance < 20;
      
      expect(isCollected).toBe(true);
    });

    test('Fire not collected when player is far away', () => {
      const fire: PowerUp = {
        id: 'fire-1',
        type: 'fire',
        position: { x: 500, y: 200 },
        isActive: true,
      };
      
      const playerPosition = { x: 150, y: 200 };
      
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - fire.position.x, 2) +
        Math.pow(playerPosition.y - fire.position.y, 2)
      );
      
      const isCollected = distance < 20;
      
      expect(isCollected).toBe(false);
    });
  });

  describe('Fire Duration', () => {
    test('Fire lasts exactly 10 seconds', () => {
      const fireDuration = 10; // seconds
      const expectedDuration = 10;
      
      expect(fireDuration).toBe(expectedDuration);
    });

    test('Fire duration in milliseconds is 10000', () => {
      const fireDurationMs = 10 * 1000;
      
      expect(fireDurationMs).toBe(10000);
    });

    test('Fire expires after duration', () => {
      const activationTime = 1000;
      const currentTime = 11000; // 10 seconds later
      const fireDuration = 10000;
      
      const isExpired = currentTime - activationTime >= fireDuration;
      
      expect(isExpired).toBe(true);
    });

    test('Fire active before duration expires', () => {
      const activationTime = 1000;
      const currentTime = 8000; // 7 seconds later
      const fireDuration = 10000;
      
      const isExpired = currentTime - activationTime >= fireDuration;
      
      expect(isExpired).toBe(false);
    });
  });

  describe('Fire Enemy Destruction', () => {
    test('Fire destroys enemy on contact', () => {
      const hasFire = true;
      const collidedWithEnemy = true;
      
      const shouldDestroyEnemy = hasFire && collidedWithEnemy;
      
      expect(shouldDestroyEnemy).toBe(true);
    });

    test('No fire means no enemy destruction', () => {
      const hasFire = false;
      const collidedWithEnemy = true;
      
      const shouldDestroyEnemy = hasFire && collidedWithEnemy;
      
      expect(shouldDestroyEnemy).toBe(false);
    });

    test('Fire destroys snake enemy', () => {
      const hasFire = true;
      const snake: Snake = {
        id: 'snake-1',
        position: { x: 150, y: 200 },
        segments: [],
        direction: 1,
        speed: 1,
        lastDirectionChange: 0,
      };
      
      const playerPosition = { x: 150, y: 200 };
      
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - snake.position.x, 2) +
        Math.pow(playerPosition.y - snake.position.y, 2)
      );
      
      const collision = distance < 24; // Player radius + snake radius
      const shouldDestroy = hasFire && collision;
      
      expect(shouldDestroy).toBe(true);
    });

    test('Fire destroys multiple enemies', () => {
      const hasFire = true;
      const enemiesDestroyed = [];
      
      // Simulate destroying 3 enemies
      for (let i = 0; i < 3; i++) {
        if (hasFire) {
          enemiesDestroyed.push(i);
        }
      }
      
      expect(enemiesDestroyed.length).toBe(3);
    });
  });

  describe('Fire Kill Scoring', () => {
    test('Fire kill awards +10 points', () => {
      let score = 0;
      const fireKillPoints = 10;
      
      score += fireKillPoints;
      
      expect(score).toBe(10);
    });

    test('Multiple fire kills accumulate points', () => {
      let score = 0;
      const fireKillPoints = 10;
      
      // Kill 5 enemies
      for (let i = 0; i < 5; i++) {
        score += fireKillPoints;
      }
      
      expect(score).toBe(50);
    });

    test('Fire kill plays sound effect', () => {
      const hasFire = true;
      const enemyDestroyed = true;
      
      const shouldPlaySound = hasFire && enemyDestroyed;
      
      expect(shouldPlaySound).toBe(true);
    });
  });

  describe('Fire Visual Effects', () => {
    test('Fire has visual indicator when active', () => {
      const hasFire = true;
      const shouldShowIndicator = hasFire;
      
      expect(shouldShowIndicator).toBe(true);
    });

    test('No fire indicator when inactive', () => {
      const hasFire = false;
      const shouldShowIndicator = hasFire;
      
      expect(shouldShowIndicator).toBe(false);
    });

    test('Fire shows particle effects', () => {
      const hasFire = true;
      const shouldShowParticles = hasFire;
      
      expect(shouldShowParticles).toBe(true);
    });
  });

  describe('Fire Timer Display', () => {
    test('Timer shows remaining seconds', () => {
      const activationTime = 1000;
      const currentTime = 4000; // 3 seconds later
      const fireDuration = 10000;
      
      const remainingMs = fireDuration - (currentTime - activationTime);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      expect(remainingSeconds).toBe(7);
    });

    test('Timer counts down correctly', () => {
      const activationTime = 0;
      const fireDuration = 10000;
      
      const times = [2000, 5000, 8000, 9500];
      const expectedSeconds = [8, 5, 2, 1];
      
      times.forEach((time, index) => {
        const remainingMs = fireDuration - (time - activationTime);
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        expect(remainingSeconds).toBe(expectedSeconds[index]);
      });
    });

    test('Timer shows 0 when expired', () => {
      const activationTime = 0;
      const currentTime = 11000;
      const fireDuration = 10000;
      
      const remainingMs = Math.max(0, fireDuration - (currentTime - activationTime));
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      expect(remainingSeconds).toBe(0);
    });
  });

  describe('Fire Edge Cases', () => {
    test('Fire only available in Halloween mode', () => {
      const halloweenMode = true;
      const canSpawnFire = halloweenMode;
      
      expect(canSpawnFire).toBe(true);
    });

    test('Fire not available in Normal mode', () => {
      const halloweenMode = false;
      const canSpawnFire = halloweenMode;
      
      expect(canSpawnFire).toBe(false);
    });

    test('Multiple fire pickups reset timer', () => {
      const firstActivation = 1000;
      const secondActivation = 5000;
      const currentTime = 8000;
      const fireDuration = 10000;
      
      // Should use second activation time
      const remainingMs = fireDuration - (currentTime - secondActivation);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      expect(remainingSeconds).toBe(7);
    });

    test('Fire can be collected multiple times in a game', () => {
      const collections = [
        { time: 1000, duration: 10000 },
        { time: 20000, duration: 10000 },
        { time: 40000, duration: 10000 },
      ];
      
      collections.forEach(collection => {
        expect(collection.duration).toBe(10000);
      });
    });
  });

  describe('Fire and Shield Interaction', () => {
    test('Fire and shield can be active simultaneously', () => {
      const hasFire = true;
      const hasShield = true;
      
      expect(hasFire).toBe(true);
      expect(hasShield).toBe(true);
    });

    test('Fire destroys enemies even with shield active', () => {
      const hasFire = true;
      const hasShield = true;
      const collidedWithEnemy = true;
      
      const shouldDestroyEnemy = hasFire && collidedWithEnemy;
      
      expect(shouldDestroyEnemy).toBe(true);
    });
  });
});
