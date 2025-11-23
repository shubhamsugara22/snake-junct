# Design Document - Game Testing & Bug Fixes

## Overview

This document outlines the systematic approach to testing and fixing bugs in the Snake Dodge game. The design focuses on automated testing where possible, manual verification for visual/gameplay elements, and a structured bug-fixing workflow.

## Architecture

### Testing Layers

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test feature interactions
3. **Manual Testing**: Verify gameplay feel and visual quality
4. **Performance Testing**: Monitor FPS and memory usage

### Bug Fix Workflow

```
Identify Issue → Write Test → Fix Code → Verify Fix → Update Docs
```

## Components and Interfaces

### Test Utilities

```typescript
// Test helper functions
type TestResult = {
  passed: boolean;
  message: string;
  actualValue?: any;
  expectedValue?: any;
};

// Game state inspector
interface GameStateInspector {
  getPlayerPosition(): Position;
  getScore(): number;
  getBossHealth(): number;
  isPaused(): boolean;
  isShieldActive(): boolean;
}

// Performance monitor
interface PerformanceMonitor {
  getFPS(): number;
  getAverageFPS(): number;
  getFrameTime(): number;
}
```

### Bug Tracking

```typescript
type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
type BugStatus = 'open' | 'in-progress' | 'fixed' | 'verified';

interface Bug {
  id: string;
  title: string;
  severity: BugSeverity;
  status: BugStatus;
  requirement: string; // Links to requirement number
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  fix?: string;
}
```

## Data Models

### Test Case Structure

```typescript
interface TestCase {
  id: string;
  requirement: string; // e.g., "1.1", "2.3"
  description: string;
  setup: () => void;
  execute: () => void;
  verify: () => TestResult;
  teardown: () => void;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptence Criteria Testing Prework:

**1.1 Player spawns at correct position**
Thoughts: This is a specific initial state that should be true at game start. We can test this by starting a game and checking the player's x and y coordinates.
Testable: yes - example

**1.2 Gravity applies to player**
Thoughts: This is a universal property - for any game state where the player is not on the ground, gravity should pull them down. We can test with random player positions.
Testable: yes - property

**1.3 Jump input triggers jump**
Thoughts: For any valid input (Space/Up/Click), the player velocity should change to jump force. This should work regardless of game state.
Testable: yes - property

**1.4 Player bounces off boundaries**
Thoughts: When player reaches ground or ceiling, velocity should reset. This is a boundary condition that should always hold.
Testable: yes - property

**1.5 Game maintains 60 FPS**
Thoughts: This is a performance property that should hold across all game states. We can measure frame times.
Testable: yes - property

**2.1-2.3 Difficulty level spawns correct counts**
Thoughts: These are specific examples - Easy spawns 3/3, Medium spawns 6/5, Hard spawns 9/7. Each is a concrete test case.
Testable: yes - example

**3.1-3.4 Collision detection**
Thoughts: For any collision between player and enemy/obstacle, game should end (unless shield active). This is a universal property.
Testable: yes - property

**4.1-4.5 Scoring system**
Thoughts: For any event (passing snake, hitting boss, etc.), the correct points should be awarded. This is a property that should hold for all instances.
Testable: yes - property

**5.1-5.5 Shield power-up**
Thoughts: Shield should provide invincibility for exactly 20 seconds. This is a time-based property that should hold for any shield collection.
Testable: yes - property

**6.1-6.5 Fire power-up**
Thoughts: Fire should destroy enemies on contact and award points. This should work for any enemy type.
Testable: yes - property

**7.1-7.5 Boss battles**
Thoughts: Bosses should trigger at specific scores and health should decrease on hit. These are properties that should hold for all boss encounters.
Testable: yes - property

**8.1-8.5 Event mode toggle**
Thoughts: Switching modes should change bosses and themes. This is a state transition property.
Testable: yes - property

**9.1-9.5 Pause functionality**
Thoughts: Pausing should freeze all game state. This should work at any point during gameplay.
Testable: yes - property

**10.1-10.5 Settings menu**
Thoughts: Settings should persist and affect gameplay. This is a property about state management.
Testable: yes - property

**11.1-11.5 Performance**
Thoughts: FPS should remain above threshold regardless of game state. This is a performance property.
Testable: yes - property

**12.1-12.5 Boss health system**
Thoughts: Boss health should decrease by exactly 1 on each hit and trigger defeat at 0. This is a property about state transitions.
Testable: yes - property

## Correctness Properties

### Property 1: Gravity Consistency
*For any* game state where the player is airborne, applying gravity should increase downward velocity by 0.4 pixels per frame.
**Validates: Requirements 1.2**

### Property 2: Jump Force Application
*For any* valid jump input (Space/Up/Click), the player's velocity should be set to -6 (upward).
**Validates: Requirements 1.3**

### Property 3: Boundary Collision
*For any* player position at ground (y >= 380) or ceiling (y <= 10), velocity should be reset to 0.
**Validates: Requirements 1.4**

### Property 4: Frame Rate Stability
*For any* 60-frame window during gameplay, average FPS should be >= 55.
**Validates: Requirements 1.5, 11.1-11.5**

### Property 5: Collision Detection Accuracy
*For any* collision between player hitbox and enemy hitbox (when shield inactive), game should transition to game-over state.
**Validates: Requirements 3.1-3.4**

### Property 6: Score Award Consistency
*For any* scoring event (passing snake/obstacle, hitting boss, killing enemy), the correct point value should be added to score.
**Validates: Requirements 4.1-4.5**

### Property 7: Shield Duration
*For any* shield collection, invincibility should last exactly 20 seconds (±100ms tolerance).
**Validates: Requirements 5.1-5.5**

### Property 8: Fire Enemy Destruction
*For any* collision between player (with fire active) and enemy, the enemy should be removed and 10 points awarded.
**Validates: Requirements 6.1-6.5**

### Property 9: Boss Health Decrement
*For any* collision between player and boss, boss health should decrease by exactly 1.
**Validates: Requirements 7.3, 12.1-12.5**

### Property 10: Boss Trigger Thresholds
*For any* game where score reaches 100 (and first boss not defeated), first boss should spawn. Same for 250 and second boss.
**Validates: Requirements 7.1-7.2**

### Property 11: Pause State Freeze
*For any* game state when pause is activated, all game object positions and velocities should remain unchanged until unpause.
**Validates: Requirements 9.1-9.5**

### Property 12: Event Mode Boss Mapping
*For any* game in Halloween mode, bosses should be Octopus/Bat. For Normal mode, bosses should be Cat/Missile.
**Validates: Requirements 8.2-8.3**

## Error Handling

### Common Error Scenarios

1. **Boss Health Not Decreasing**
   - Root Cause: State mutation instead of immutable update
   - Detection: Check if `boss.health` changes after collision
   - Fix: Ensure `newState.bossState.currentBoss = updatedBoss` after hit

2. **Performance Degradation**
   - Root Cause: Complex animations or excessive object creation
   - Detection: Monitor FPS drops below 55
   - Fix: Simplify animations, use object pooling

3. **Collision Detection Failures**
   - Root Cause: Incorrect hitbox calculations
   - Detection: Player passes through enemies without dying
   - Fix: Verify collision radius calculations

4. **Power-Up Timer Inaccuracy**
   - Root Cause: Using frame count instead of timestamps
   - Detection: Timer doesn't match actual duration
   - Fix: Use `Date.now()` for time-based features

## Testing Strategy

### Unit Testing Approach

**Framework**: Jest or Vitest (already in project)

**Test Structure**:
```typescript
describe('Core Gameplay', () => {
  describe('Gravity System', () => {
    it('should apply gravity when player is airborne', () => {
      // Property 1 test
    });
  });
  
  describe('Jump Mechanics', () => {
    it('should set velocity to -6 on jump input', () => {
      // Property 2 test
    });
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript PBT library)

**Example Property Test**:
```typescript
import fc from 'fast-check';

test('Property 1: Gravity applies consistently', () => {
  fc.assert(
    fc.property(
      fc.record({
        y: fc.integer({ min: 11, max: 379 }), // Airborne positions
        velocityY: fc.float({ min: -10, max: 10 })
      }),
      (playerState) => {
        const newVelocity = playerState.velocityY + 0.4;
        return newVelocity === playerState.velocityY + 0.4;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Manual Testing Checklist

**Visual Verification**:
- Boss animations play smoothly
- Power-up effects are visible
- UI elements display correctly
- Background themes render properly

**Gameplay Feel**:
- Controls feel responsive
- Difficulty progression feels fair
- Boss battles are challenging but beatable
- Sound effects match actions

### Performance Testing

**Metrics to Monitor**:
- FPS (target: 60, minimum: 55)
- Frame time (target: <16.67ms)
- Memory usage (should not grow unbounded)
- Object count (track for memory leaks)

**Tools**:
- Browser DevTools Performance tab
- Custom FPS counter in game
- Memory profiler

## Bug Fix Priority

### Critical (Fix Immediately)
- Game crashes
- Boss health not decreasing
- Player can't jump
- Collision detection completely broken

### High (Fix Soon)
- Performance drops below 45 FPS
- Power-ups don't work
- Scoring incorrect
- Boss doesn't spawn

### Medium (Fix When Possible)
- Visual glitches
- Sound effects missing
- UI alignment issues
- Minor animation problems

### Low (Nice to Have)
- Polish improvements
- Code cleanup
- Documentation updates
- Performance optimizations (if already >55 FPS)

## Implementation Plan

### Phase 1: Critical Bug Fixes
1. Verify boss health system works
2. Test collision detection accuracy
3. Ensure game doesn't crash
4. Fix any game-breaking bugs

### Phase 2: Core Feature Testing
1. Test all difficulty levels
2. Verify scoring system
3. Test power-up functionality
4. Verify boss battles work end-to-end

### Phase 3: Polish & Performance
1. Optimize rendering for 60 FPS
2. Fix visual glitches
3. Ensure smooth animations
4. Test on different browsers

### Phase 4: Regression Testing
1. Re-test all fixed bugs
2. Verify no new bugs introduced
3. Performance regression check
4. Final playthrough test

## Success Criteria

The game is considered fully tested and bug-free when:

1. All 12 correctness properties pass
2. All critical and high-priority bugs are fixed
3. Game maintains 60 FPS in all scenarios
4. All power-ups work as specified
5. Boss battles function correctly
6. Event mode toggle works properly
7. No crashes or game-breaking bugs
8. Manual playthrough completes without issues

## Notes

- Focus on immutable state updates to prevent bugs
- Use console.log strategically for debugging
- Test on multiple browsers (Chrome, Firefox, Safari)
- Consider mobile testing if applicable
- Keep CHANGELOG.md updated with fixes
