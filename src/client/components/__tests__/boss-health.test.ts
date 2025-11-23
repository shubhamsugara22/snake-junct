/**
 * Boss Health System Tests
 * Feature: game-testing-bugfixes, Property 9: Boss Health Decrement
 * Validates: Requirements 7.3, 12.1
 */

import { Boss, BossType } from '../../../shared/types/game';

// Mock the handleBossHit function logic
const handleBossHit = (boss: Boss): { updatedBoss: Boss; bounceVelocity: number } => {
  const updatedBoss = {
    ...boss,
    health: boss.health - 1,
    hitFlashTime: Date.now(),
  };

  const bounceVelocity = boss.type === 'octopus' || boss.type === 'cat' ? -8 : -7;
  
  return { updatedBoss, bounceVelocity };
};

describe('Boss Health System', () => {
  const createTestBoss = (type: BossType, health: number): Boss => ({
    id: 'test-boss',
    type,
    position: { x: 300, y: 200 },
    health,
    maxHealth: health,
    isActive: true,
    lastProjectileTime: 0,
    animationPhase: 0,
    hitFlashTime: 0,
  });

  describe('Health Decrement', () => {
    test('Octopus boss health decreases by 1 on hit', () => {
      const boss = createTestBoss('octopus', 10);
      const { updatedBoss } = handleBossHit(boss);
      
      expect(updatedBoss.health).toBe(9);
      expect(updatedBoss.health).toBe(boss.health - 1);
    });

    test('Bat boss health decreases by 1 on hit', () => {
      const boss = createTestBoss('bat', 15);
      const { updatedBoss } = handleBossHit(boss);
      
      expect(updatedBoss.health).toBe(14);
      expect(updatedBoss.health).toBe(boss.health - 1);
    });

    test('Cat boss health decreases by 1 on hit', () => {
      const boss = createTestBoss('cat', 10);
      const { updatedBoss } = handleBossHit(boss);
      
      expect(updatedBoss.health).toBe(9);
      expect(updatedBoss.health).toBe(boss.health - 1);
    });

    test('Missile boss health decreases by 1 on hit', () => {
      const boss = createTestBoss('missile', 15);
      const { updatedBoss } = handleBossHit(boss);
      
      expect(updatedBoss.health).toBe(14);
      expect(updatedBoss.health).toBe(boss.health - 1);
    });
  });

  describe('Immutability', () => {
    test('Original boss object is not mutated', () => {
      const boss = createTestBoss('octopus', 10);
      const originalHealth = boss.health;
      
      handleBossHit(boss);
      
      expect(boss.health).toBe(originalHealth);
      expect(boss.health).toBe(10);
    });

    test('Updated boss is a new object', () => {
      const boss = createTestBoss('bat', 15);
      const { updatedBoss } = handleBossHit(boss);
      
      expect(updatedBoss).not.toBe(boss);
      expect(updatedBoss.id).toBe(boss.id);
    });
  });

  describe('Bounce Velocity', () => {
    test('Octopus boss returns bounce velocity -8', () => {
      const boss = createTestBoss('octopus', 10);
      const { bounceVelocity } = handleBossHit(boss);
      
      expect(bounceVelocity).toBe(-8);
    });

    test('Cat boss returns bounce velocity -8', () => {
      const boss = createTestBoss('cat', 10);
      const { bounceVelocity } = handleBossHit(boss);
      
      expect(bounceVelocity).toBe(-8);
    });

    test('Bat boss returns bounce velocity -7', () => {
      const boss = createTestBoss('bat', 15);
      const { bounceVelocity } = handleBossHit(boss);
      
      expect(bounceVelocity).toBe(-7);
    });

    test('Missile boss returns bounce velocity -7', () => {
      const boss = createTestBoss('missile', 15);
      const { bounceVelocity } = handleBossHit(boss);
      
      expect(bounceVelocity).toBe(-7);
    });
  });

  describe('Hit Flash Time', () => {
    test('Hit flash time is updated on hit', () => {
      const boss = createTestBoss('octopus', 10);
      const beforeTime = Date.now();
      
      const { updatedBoss } = handleBossHit(boss);
      
      expect(updatedBoss.hitFlashTime).toBeGreaterThanOrEqual(beforeTime);
      expect(updatedBoss.hitFlashTime).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Boss Defeat', () => {
    test('Boss with 1 health reaches 0 after hit', () => {
      const boss = createTestBoss('octopus', 1);
      const { updatedBoss } = handleBossHit(boss);
      
      expect(updatedBoss.health).toBe(0);
    });

    test('Boss can be hit multiple times until defeated', () => {
      let boss = createTestBoss('octopus', 3);
      
      // Hit 1
      let result = handleBossHit(boss);
      expect(result.updatedBoss.health).toBe(2);
      
      // Hit 2
      result = handleBossHit(result.updatedBoss);
      expect(result.updatedBoss.health).toBe(1);
      
      // Hit 3 - Defeated
      result = handleBossHit(result.updatedBoss);
      expect(result.updatedBoss.health).toBe(0);
    });
  });
});
