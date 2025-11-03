# Implementation Plan

This document outlines the coding tasks required to implement the Halloween Boss Battles feature. Each task builds incrementally on previous work, ensuring the feature is integrated smoothly into the existing game.

## Task List

- [x] 1. Set up boss state management and type definitions

  - Add BossType, BossConfig, Boss, Projectile, and BossState types to `src/shared/types/game.ts`
  - Create BOSS_CONFIGS constant with Octopus and Bat configurations
  - Extend GameState type to include bossState field
  - Add BOSS_BATTLES_ENABLED feature flag constant
  - _Requirements: 1.1, 1.2, 11.1, 11.2_

- [x] 2. Implement projectile pool system for performance

  - Create ProjectilePool class with acquire/release methods in Game.tsx
  - Initialize projectile pool instance at component level
  - Implement getActive() method to retrieve active projectiles
  - Add pool size limit of 20 projectiles
  - _Requirements: 12.2, 12.3, 12.4_

- [x] 3. Create boss trigger and lifecycle management

  - [x] 3.1 Implement checkBossTrigger function to detect score milestones

    - Check for Octopus Boss at score 100
    - Check for Bat Boss at score 250
    - Verify boss hasn't been defeated already
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Implement shouldTriggerBoss function with feature flags

    - Check BOSS_BATTLES_ENABLED flag
    - Check HALLOWEEN_EVENT_ACTIVE flag
    - Call checkBossTrigger with error handling
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 3.3 Add boss initialization logic to game state update

    - Create boss instance when trigger conditions met
    - Set bossEncounterActive to true
    - Clear normal enemies (snakes and obstacles)
    - Initialize entrance transition phase
    - Apply skill-based health scaling
    - _Requirements: 1.3, 1.4, 9.3, 9.4_

- [x] 4. Implement Octopus Boss rendering and behavior


  - [x] 4.1 Create renderOctopusBoss function

    - Draw 8 animated tentacles with wave motion
    - Add tentacle sucker details
    - Render main body with radial gradient
    - Draw glowing red eyes with pupils
    - Implement hit flash effect (white for 200ms)
    - _Requirements: 2.1, 2.2, 2.5, 10.2_

  - [x] 4.2 Implement updateOctopusBoss function

    - Keep boss position fixed at center-right (500, 200)
    - Rotate tentacle animation phase
    - _Requirements: 2.1_

  - [x] 4.3 Create octopusThrowProjectile function

    - Calculate trajectory toward player position
    - Apply skill-based projectile interval (2s for beginners, 1.5s normal)
    - Spawn ink blob projectile from projectile pool
    - Set projectile speed to 3 pixels per frame
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 9.1_

- [x] 5. Implement Bat Boss rendering and behavior

  - [x] 5.1 Create renderBatBoss function
    - Draw animated wings with flapping motion
    - Add wing detail lines
    - Render body and head
    - Draw pointed ears
    - Add glowing red eyes
    - Draw white fangs
    - Implement hit flash effect
    - _Requirements: 5.1, 5.2, 5.5, 10.2_
  - [x] 5.2 Implement updateBatBoss function
    - Calculate figure-eight pattern using Lissajous curve
    - Update position based on time
    - Center pattern at (300, 150) with radius (150, 80)
    - _Requirements: 5.2_
  - [x] 5.3 Create batThrowProjectile function
    - Determine single-shot vs triple-shot pattern (50% base, 70% for skilled players)
    - Calculate spread angles for triple-shot (-30°, 0°, 30°)
    - Apply skill-based projectile interval (1.5s for beginners, 1.2s normal)
    - Spawn pumpkin projectiles from pool
    - Set projectile speed to 2.5 pixels per frame
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.2, 9.5_

- [x] 6. Implement projectile rendering and physics

  - [x] 6.1 Create renderInkBlob function
    - Draw dark purple blob with cyan glow
    - Add animated ripple effect
    - Render at 15 pixel radius
    - _Requirements: 3.3_
  - [x] 6.2 Create renderPumpkin function
    - Draw orange pumpkin with ridges
    - Add jack-o-lantern face
    - Include green stem
    - Render at 12 pixel radius
    - _Requirements: 6.2_
  - [x] 6.3 Implement projectile movement in game loop
    - Update projectile position based on velocity
    - Remove projectiles that move off-screen
    - Release projectiles back to pool when removed
    - _Requirements: 3.4, 6.5, 12.3_

- [x] 7. Implement collision detection systems

  - [x] 7.1 Create checkBossCollision function
    - Calculate distance between player and boss center
    - Use 40px radius for Octopus, 30px for Bat
    - Return true if collision detected
    - _Requirements: 4.1, 7.1_
  - [x] 7.2 Create handleBossHit function
    - Reduce boss health by 1
    - Set hit flash timestamp
    - Return bounce velocity (-8 for Octopus, -7 for Bat)
    - Play boss hit sound effect
    - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.2, 7.3_
  - [x] 7.3 Create checkProjectileCollision function
    - Calculate distance between player and projectile
    - Use projectile size for collision radius
    - Return true if collision detected
    - _Requirements: 3.5, 6.6_
  - [x] 7.4 Create handleProjectileHit function
    - Check for shield power-up (destroy projectile, play shield sound)
    - Check for fire power-up (destroy projectile, award 5 points for pumpkins)
    - Otherwise trigger game over
    - Release projectile back to pool
    - _Requirements: 3.5, 3.6, 3.7, 6.6, 6.7_

- [x] 8. Create boss UI components

  - [x] 8.1 Implement renderBossHealthBar function
    - Draw health bar background at top center
    - Render health percentage with gradient fill
    - Display boss name above health bar
    - Show numeric health (current / max)
    - Add glowing border effect
    - _Requirements: 2.4, 5.4, 10.3_
  - [x] 8.2 Implement renderBossEntrance animation
    - Fade in dark background overlay (50% opacity)
    - Display boss name with glow effect after 0.3s
    - Slide boss in from right with ease-out cubic after 0.5s
    - Total duration: 2 seconds
    - _Requirements: 1.4, 10.1_
  - [x] 8.3 Implement renderVictoryAnimation function
    - Fade out and shrink boss sprite
    - Display "VICTORY!" text with gold glow
    - Show bonus points (+50 for Octopus, +100 for Bat)
    - Total duration: 1 second
    - _Requirements: 8.3, 10.1_

- [x] 9. Implement boss encounter game loop integration

  - [x] 9.1 Add boss state initialization to game state
    - Initialize bossState with empty values
    - Set bossEncounterActive to false
    - Initialize empty projectiles array
    - Initialize empty defeatedBosses array
    - _Requirements: 11.5_
  - [x] 9.2 Integrate boss trigger check in updateGame
    - Call shouldTriggerBoss when not in boss encounter
    - Initialize boss encounter when triggered
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 9.3 Implement boss transition phase handling
    - Handle 'entrance' phase (2 second duration)
    - Handle 'active' phase (combat)
    - Handle 'victory' phase (1 second duration)
    - Transition between phases based on timers
    - _Requirements: 1.4, 1.5, 8.3_
  - [x] 9.4 Add boss behavior updates in active phase
    - Call updateOctopusBoss or updateBatBoss based on type
    - Call projectile throwing functions
    - Check boss collision with player
    - Handle boss defeat when health reaches 0
    - _Requirements: 4.4, 4.5, 7.4, 7.5_
  - [x] 9.5 Implement projectile updates in game loop
    - Update all active projectile positions
    - Check projectile collisions with player
    - Remove off-screen projectiles
    - Limit active projectiles to 10 maximum
    - _Requirements: 12.2, 12.3_
  - [x] 9.6 Add reward spawning on boss defeat
    - Spawn shield power-up for Octopus Boss
    - Spawn candy power-up for Bat Boss
    - Award bonus points (50 for Octopus, 100 for Bat)
    - Add boss type to defeatedBosses array
    - Resume normal enemy spawning
    - _Requirements: 8.1, 8.2, 8.5, 4.5, 7.5_

- [x] 10. Implement boss rendering in canvas draw loop

  - [x] 10.1 Add boss rendering logic to useEffect canvas render
    - Render entrance animation during 'entrance' phase
    - Render boss sprite during 'active' phase
    - Render victory animation during 'victory' phase
    - Render boss health bar when boss is active
    - _Requirements: 2.1, 2.2, 5.1, 5.2_
  - [x] 10.2 Add projectile rendering to canvas
    - Render all active ink blob projectiles
    - Render all active pumpkin projectiles
    - Apply appropriate visual effects for each type
    - _Requirements: 3.3, 6.2_

- [x] 11. Add boss sound effects

  - Create playBossHitSound function (800Hz square wave)
  - Create playBossDefeatedSound function (ascending tones 1200-1600Hz)
  - Create playProjectileThrowSound function (400Hz sawtooth)
  - Create playBossEntranceSound function (dramatic low tone)
  - Integrate sound calls into boss event handlers
  - _Requirements: 4.3, 7.3, 8.4, 10.4_

- [ ]\* 12. Add debug visualization tools

  - Implement renderBossHitbox function with SHOW_HITBOXES flag
  - Implement renderProjectileHitbox function
  - Add debug logging for boss state transitions
  - Create BOSS_CONFIG_FLAGS object with debug options
  - _Requirements: 11.4_

- [ ]\* 13. Performance optimization and validation

  - Implement validateBossState function for error checking
  - Add spatial partitioning for projectile collision checks
  - Profile rendering performance during boss encounters
  - Verify 60 FPS maintained with maximum projectiles
  - Test memory usage with projectile pool
  - _Requirements: 12.1, 12.4, 12.5_

- [ ]\* 14. Add accessibility features
  - Ensure boss sprites have high contrast colors
  - Add clear visual feedback for all boss actions
  - Test audio-only gameplay experience
  - Verify adaptive difficulty works for all skill levels
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
