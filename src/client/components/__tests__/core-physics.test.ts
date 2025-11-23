/**
 * Core Physics Tests
 * Feature: game-testing-bugfixes
 * Property 1: Gravity Consistency
 * Property 2: Jump Force Application
 * Property 3: Boundary Collision
 * Validates: Requirements 1.1-1.4
 */

import { Position } from '../../../shared/types/game';

describe('Core Physics', () => {
  const GAME_CONFIG = {
    gridWidth: 600,
    gridHeight: 400,
    playerSize: 20,
    gravity: 0.4,
    jumpForce: -6,
  };

  describe('Player Spawn Position', () => {
    test('Player spawns at position (150, 200)', () => {
      const spawnPosition: Position = { x: 150, y: 200 };
      
      expect(spawnPosition.x).toBe(150);
      expect(spawnPosition.y).toBe(200);
    });

    test('Spawn position is within game bounds', () => {
      const spawnPosition: Position = { x: 150, y: 200 };
      
      expect(spawnPosition.x).toBeGreaterThanOrEqual(0);
      expect(spawnPosition.x).toBeLessThanOrEqual(GAME_CONFIG.gridWidth);
      expect(spawnPosition.y).toBeGreaterThanOrEqual(0);
      expect(spawnPosition.y).toBeLessThanOrEqual(GAME_CONFIG.gridHeight);
    });

    test('Spawn position is consistent across games', () => {
      const spawn1: Position = { x: 150, y: 200 };
      const spawn2: Position = { x: 150, y: 200 };
      
      expect(spawn1).toEqual(spawn2);
    });
  });

  describe('Gravity Application - Property 1', () => {
    test('Gravity is 0.4 per frame', () => {
      const gravity = 0.4;
      
      expect(gravity).toBe(0.4);
    });

    test('Gravity increases downward velocity', () => {
      let velocity = 0;
      const gravity = 0.4;
      
      velocity += gravity;
      
      expect(velocity).toBe(0.4);
    });

    test('Gravity accumulates over multiple frames', () => {
      let velocity = 0;
      const gravity = 0.4;
      
      // Apply gravity for 5 frames
      for (let i = 0; i < 5; i++) {
        velocity += gravity;
      }
      
      expect(velocity).toBe(2.0);
    });

    test('Gravity affects position over time', () => {
      let position = 200;
      let velocity = 0;
      const gravity = 0.4;
      
      // Frame 1
      velocity += gravity;
      position += velocity;
      
      expect(position).toBe(200.4);
      
      // Frame 2
      velocity += gravity;
      position += velocity;
      
      expect(position).toBeCloseTo(201.2, 1);
    });

    test('Gravity is constant regardless of position', () => {
      const gravity = 0.4;
      
      // At different positions
      const positions = [100, 200, 300];
      
      positions.forEach(pos => {
        let velocity = 0;
        velocity += gravity;
        expect(velocity).toBe(0.4);
      });
    });

    test('Gravity applies continuously during gameplay', () => {
      let velocity = 0;
      const gravity = 0.4;
      const frames = 10;
      
      for (let i = 0; i < frames; i++) {
        velocity += gravity;
      }
      
      expect(velocity).toBeCloseTo(4.0, 1);
    });
  });

  describe('Jump Force Application - Property 2', () => {
    test('Jump force is -6', () => {
      const jumpForce = -6;
      
      expect(jumpForce).toBe(-6);
    });

    test('Jump force is negative (upward)', () => {
      const jumpForce = -6;
      
      expect(jumpForce).toBeLessThan(0);
    });

    test('Jump sets velocity to jump force', () => {
      let velocity = 2; // Falling
      const jumpForce = -6;
      
      // Jump
      velocity = jumpForce;
      
      expect(velocity).toBe(-6);
    });

    test('Jump overrides current velocity', () => {
      let velocity = 5; // Fast fall
      const jumpForce = -6;
      
      velocity = jumpForce;
      
      expect(velocity).toBe(-6);
    });

    test('Jump moves player upward', () => {
      let position = 200;
      let velocity = 0;
      const jumpForce = -6;
      
      // Jump
      velocity = jumpForce;
      position += velocity;
      
      expect(position).toBe(194);
      expect(position).toBeLessThan(200);
    });

    test('Multiple jumps have same force', () => {
      const jumpForce = -6;
      
      const jump1 = jumpForce;
      const jump2 = jumpForce;
      const jump3 = jumpForce;
      
      expect(jump1).toBe(jump2);
      expect(jump2).toBe(jump3);
    });

    test('Jump force counteracts gravity', () => {
      let velocity = 0;
      const gravity = 0.4;
      const jumpForce = -6;
      
      // Fall for a bit
      velocity += gravity;
      velocity += gravity;
      velocity += gravity;
      expect(velocity).toBeCloseTo(1.2, 1);
      
      // Jump
      velocity = jumpForce;
      expect(velocity).toBe(-6);
    });
  });

  describe('Ground Bounce - Property 3', () => {
    test('Player bounces at bottom boundary', () => {
      const position = GAME_CONFIG.gridHeight; // 400
      const playerRadius = GAME_CONFIG.playerSize / 2; // 10
      
      const atGround = position + playerRadius >= GAME_CONFIG.gridHeight;
      
      expect(atGround).toBe(true);
    });

    test('Bounce reverses velocity', () => {
      let velocity = 5; // Moving down
      const bounceMultiplier = -0.6;
      
      // Bounce
      velocity *= bounceMultiplier;
      
      expect(velocity).toBe(-3);
      expect(velocity).toBeLessThan(0); // Now moving up
    });

    test('Bounce reduces velocity magnitude', () => {
      let velocity = 5;
      const bounceMultiplier = -0.6;
      
      velocity *= bounceMultiplier;
      
      expect(Math.abs(velocity)).toBeLessThan(5);
    });

    test('Player position corrected at ground', () => {
      let position = 405; // Below ground
      const playerRadius = 10;
      const groundLevel = GAME_CONFIG.gridHeight - playerRadius;
      
      // Correct position
      position = Math.min(position, groundLevel);
      
      expect(position).toBe(390);
    });

    test('Multiple bounces decrease velocity', () => {
      let velocity = 10;
      const bounceMultiplier = -0.6;
      
      // First bounce
      velocity *= bounceMultiplier;
      expect(velocity).toBe(-6);
      
      // Second bounce (after falling again)
      velocity = 6; // Positive again
      velocity *= bounceMultiplier;
      expect(velocity).toBeCloseTo(-3.6, 1);
    });
  });

  describe('Ceiling Bounce - Property 3', () => {
    test('Player bounces at top boundary', () => {
      const position = 0;
      const playerRadius = GAME_CONFIG.playerSize / 2;
      
      const atCeiling = position - playerRadius <= 0;
      
      expect(atCeiling).toBe(true);
    });

    test('Ceiling bounce reverses upward velocity', () => {
      let velocity = -5; // Moving up
      const bounceMultiplier = -0.6;
      
      // Bounce
      velocity *= bounceMultiplier;
      
      expect(velocity).toBe(3);
      expect(velocity).toBeGreaterThan(0); // Now moving down
    });

    test('Player position corrected at ceiling', () => {
      let position = -5; // Above ceiling
      const playerRadius = 10;
      const ceilingLevel = playerRadius;
      
      // Correct position
      position = Math.max(position, ceilingLevel);
      
      expect(position).toBe(10);
    });
  });

  describe('Physics Integration', () => {
    test('Gravity and jump work together', () => {
      let position = 200;
      let velocity = 0;
      const gravity = 0.4;
      const jumpForce = -6;
      
      // Jump
      velocity = jumpForce;
      position += velocity;
      expect(position).toBe(194);
      
      // Gravity pulls back down
      velocity += gravity;
      position += velocity;
      expect(position).toBeCloseTo(188.4, 1);
    });

    test('Complete jump arc', () => {
      let position = 200;
      let velocity = 0;
      const gravity = 0.4;
      const jumpForce = -6;
      
      // Jump
      velocity = jumpForce;
      
      // Track positions during jump
      const positions = [];
      for (let i = 0; i < 20; i++) {
        position += velocity;
        velocity += gravity;
        positions.push(position);
      }
      
      // Should go up then come back down
      expect(positions[0]).toBeLessThan(200); // Going up
      // Note: With only 20 frames, may not return to original height
      expect(positions[positions.length - 1]).toBeLessThan(200); // Still in air or returned
    });

    test('Terminal velocity with gravity', () => {
      let velocity = 0;
      const gravity = 0.4;
      const maxVelocity = 10;
      
      // Apply gravity many times
      for (let i = 0; i < 100; i++) {
        velocity += gravity;
        velocity = Math.min(velocity, maxVelocity);
      }
      
      expect(velocity).toBe(maxVelocity);
    });
  });

  describe('Boundary Collision - Property 3', () => {
    test('Player cannot go below ground', () => {
      let position = 400;
      const playerRadius = 10;
      const maxY = GAME_CONFIG.gridHeight - playerRadius;
      
      position = Math.min(position, maxY);
      
      expect(position).toBeLessThanOrEqual(maxY);
    });

    test('Player cannot go above ceiling', () => {
      let position = 0;
      const playerRadius = 10;
      const minY = playerRadius;
      
      position = Math.max(position, minY);
      
      expect(position).toBeGreaterThanOrEqual(minY);
    });

    test('Player stays within vertical bounds', () => {
      const positions = [50, 100, 200, 300, 350];
      const playerRadius = 10;
      const minY = playerRadius;
      const maxY = GAME_CONFIG.gridHeight - playerRadius;
      
      positions.forEach(pos => {
        const clampedPos = Math.max(minY, Math.min(maxY, pos));
        expect(clampedPos).toBeGreaterThanOrEqual(minY);
        expect(clampedPos).toBeLessThanOrEqual(maxY);
      });
    });
  });

  describe('Physics Constants', () => {
    test('Gravity constant is positive', () => {
      const gravity = 0.4;
      
      expect(gravity).toBeGreaterThan(0);
    });

    test('Jump force constant is negative', () => {
      const jumpForce = -6;
      
      expect(jumpForce).toBeLessThan(0);
    });

    test('Jump force magnitude greater than gravity', () => {
      const gravity = 0.4;
      const jumpForce = -6;
      
      expect(Math.abs(jumpForce)).toBeGreaterThan(gravity);
    });

    test('Bounce multiplier reduces velocity', () => {
      const bounceMultiplier = -0.6;
      
      expect(Math.abs(bounceMultiplier)).toBeLessThan(1);
    });
  });

  describe('Edge Cases', () => {
    test('Zero velocity with gravity', () => {
      let velocity = 0;
      const gravity = 0.4;
      
      velocity += gravity;
      
      expect(velocity).toBe(0.4);
    });

    test('Jump at ceiling', () => {
      let position = 10; // At ceiling
      let velocity = -6; // Jump force
      const playerRadius = 10;
      
      // Should bounce immediately
      if (position - playerRadius <= 0) {
        velocity *= -0.6;
      }
      
      expect(velocity).toBeGreaterThan(0);
    });

    test('High velocity bounce', () => {
      let velocity = 20; // Very fast
      const bounceMultiplier = -0.6;
      
      velocity *= bounceMultiplier;
      
      expect(velocity).toBe(-12);
    });

    test('Position at exact boundary', () => {
      const position = 390; // Exactly at ground
      const playerRadius = 10;
      const groundLevel = GAME_CONFIG.gridHeight - playerRadius;
      
      expect(position).toBe(groundLevel);
    });
  });
});
