# Requirements Document

## Introduction

This document specifies the requirements for implementing Halloween-themed boss battles in Snake Junct. The feature introduces two boss encounters (Octopus Boss and Bat Boss) that appear at specific score milestones during gameplay. These bosses actively throw obstacles at the player, creating dynamic combat scenarios that test player skill and reaction time.

## Glossary

- **Boss**: A special enemy entity that appears at score milestones with unique attack patterns and health
- **Boss Phase**: A distinct stage of boss behavior with specific attack patterns
- **Projectile**: An obstacle thrown by a boss toward the player's position
- **Score Milestone**: A specific score threshold that triggers a boss encounter
- **Boss Health**: A numeric value representing how many hits a boss can take before defeat
- **Attack Pattern**: A predefined sequence of projectile launches by a boss
- **Boss Arena**: The game screen during a boss encounter with modified gameplay rules
- **Defeat Condition**: The criteria that determines when a boss is defeated
- **Victory Reward**: Power-ups or score bonuses granted upon defeating a boss
- **Boss Transition**: The animation and state change when entering or exiting a boss encounter
- **Projectile Trajectory**: The calculated path a thrown obstacle follows toward the player
- **Hit Detection**: The collision system that determines when projectiles or the player contact the boss

## Requirements

### Requirement 1

**User Story:** As a player, I want to encounter challenging boss battles at score milestones, so that I have exciting gameplay variety and goals to work toward.

#### Acceptance Criteria

1. WHEN the player's score reaches 100 points, THE Game System SHALL trigger the Octopus Boss encounter
2. WHEN the player's score reaches 250 points, THE Game System SHALL trigger the Bat Boss encounter
3. WHEN a boss encounter begins, THE Game System SHALL pause normal enemy spawning
4. WHEN a boss encounter begins, THE Game System SHALL display a boss entrance animation lasting 2 seconds
5. WHEN a boss is defeated, THE Game System SHALL resume normal gameplay after a 1 second victory animation

### Requirement 2

**User Story:** As a player, I want the Octopus Boss to have unique visual appearance and behavior, so that the encounter feels distinct and memorable.

#### Acceptance Criteria

1. THE Octopus Boss SHALL render with a body diameter of 80 pixels at the center-right of the screen
2. THE Octopus Boss SHALL display 8 animated tentacles that wave independently
3. THE Octopus Boss SHALL have a health value of 10 hit points
4. WHEN the Octopus Boss is active, THE Octopus Boss SHALL display a health bar above its body
5. THE Octopus Boss SHALL use a color palette of dark purple (#4B0082) and cyan (#00FFFF) with glowing effects

### Requirement 3

**User Story:** As a player, I want the Octopus Boss to throw obstacles at me, so that I must actively dodge and engage with the boss.

#### Acceptance Criteria

1. WHEN the Octopus Boss is active, THE Octopus Boss SHALL throw projectiles every 1.5 seconds
2. WHEN throwing a projectile, THE Octopus Boss SHALL calculate the trajectory toward the player's current position
3. THE Octopus Boss SHALL throw ink blobs with a radius of 15 pixels
4. WHEN an ink blob projectile is thrown, THE projectile SHALL travel at 3 pixels per frame toward the calculated position
5. WHEN the player collides with an ink blob AND the player has no shield active, THE Game System SHALL end the game
6. WHEN the player has fire power active AND the player collides with an ink blob, THE Game System SHALL destroy the ink blob
7. WHEN the player has shield power active AND the player collides with an ink blob, THE Game System SHALL destroy the ink blob without ending the game

### Requirement 4

**User Story:** As a player, I want to damage the Octopus Boss by jumping into it, so that I can defeat it through skillful play.

#### Acceptance Criteria

1. WHEN the player collides with the Octopus Boss body, THE Game System SHALL reduce the Octopus Boss health by 1 hit point
2. WHEN the player collides with the Octopus Boss body, THE Game System SHALL bounce the player away with a velocity of -8 pixels per frame
3. WHEN the player collides with the Octopus Boss body, THE Game System SHALL play a hit sound effect
4. WHEN the Octopus Boss health reaches 0, THE Game System SHALL trigger the boss defeat sequence
5. WHEN the Octopus Boss is defeated, THE Game System SHALL award the player 50 bonus points

### Requirement 5

**User Story:** As a player, I want the Bat Boss to have unique visual appearance and behavior, so that it provides a different challenge from the Octopus Boss.

#### Acceptance Criteria

1. THE Bat Boss SHALL render with a wingspan of 100 pixels
2. THE Bat Boss SHALL fly in a figure-eight pattern across the top half of the screen
3. THE Bat Boss SHALL have a health value of 15 hit points
4. WHEN the Bat Boss is active, THE Bat Boss SHALL display a health bar above its position
5. THE Bat Boss SHALL use a color palette of black (#000000) and red (#FF0000) with shadow effects

### Requirement 6

**User Story:** As a player, I want the Bat Boss to throw obstacles at me with different patterns, so that the encounter requires different strategies than the Octopus Boss.

#### Acceptance Criteria

1. WHEN the Bat Boss is active, THE Bat Boss SHALL throw projectiles every 1.2 seconds
2. WHEN throwing a projectile, THE Bat Boss SHALL throw pumpkin projectiles with a radius of 12 pixels
3. THE Bat Boss SHALL alternate between single-shot and triple-shot attack patterns
4. WHEN using triple-shot pattern, THE Bat Boss SHALL throw 3 pumpkins in a spread formation with 30 degree angles between them
5. WHEN a pumpkin projectile is thrown, THE projectile SHALL travel at 2.5 pixels per frame
6. WHEN the player collides with a pumpkin AND the player has no shield active, THE Game System SHALL end the game
7. WHEN the player has fire power active AND the player collides with a pumpkin, THE Game System SHALL destroy the pumpkin and award 5 points

### Requirement 7

**User Story:** As a player, I want to damage the Bat Boss by jumping into it, so that I can defeat it through skillful play.

#### Acceptance Criteria

1. WHEN the player collides with the Bat Boss body, THE Game System SHALL reduce the Bat Boss health by 1 hit point
2. WHEN the player collides with the Bat Boss body, THE Game System SHALL bounce the player away with a velocity of -7 pixels per frame
3. WHEN the player collides with the Bat Boss body, THE Game System SHALL play a screech sound effect
4. WHEN the Bat Boss health reaches 0, THE Game System SHALL trigger the boss defeat sequence
5. WHEN the Bat Boss is defeated, THE Game System SHALL award the player 100 bonus points

### Requirement 8

**User Story:** As a player, I want to receive rewards for defeating bosses, so that I feel accomplished and gain advantages for continued play.

#### Acceptance Criteria

1. WHEN the Octopus Boss is defeated, THE Game System SHALL spawn a shield power-up at the boss's position
2. WHEN the Bat Boss is defeated, THE Game System SHALL spawn a candy power-up at the boss's position
3. WHEN a boss is defeated, THE Game System SHALL display a victory message for 2 seconds
4. WHEN a boss is defeated, THE Game System SHALL play a victory sound effect
5. WHEN a boss encounter ends, THE Game System SHALL resume normal enemy spawning

### Requirement 9

**User Story:** As a player, I want boss encounters to adapt to my skill level, so that they remain challenging but fair.

#### Acceptance Criteria

1. WHERE the player skill level is below 0.3, THE Octopus Boss SHALL throw projectiles every 2 seconds instead of 1.5 seconds
2. WHERE the player skill level is below 0.3, THE Bat Boss SHALL throw projectiles every 1.5 seconds instead of 1.2 seconds
3. WHERE the player skill level is above 0.7, THE Octopus Boss SHALL have 12 hit points instead of 10
4. WHERE the player skill level is above 0.7, THE Bat Boss SHALL have 18 hit points instead of 15
5. WHERE the player skill level is above 0.7, THE Bat Boss SHALL use triple-shot pattern 70 percent of the time instead of 50 percent

### Requirement 10

**User Story:** As a player, I want clear visual and audio feedback during boss encounters, so that I understand the game state and my progress.

#### Acceptance Criteria

1. WHEN a boss encounter begins, THE Game System SHALL display the boss name in large text for 1.5 seconds
2. WHEN a boss takes damage, THE Game System SHALL flash the boss sprite white for 0.2 seconds
3. WHEN a boss health changes, THE Game System SHALL animate the health bar smoothly over 0.3 seconds
4. WHEN a projectile is thrown, THE Game System SHALL play a throwing sound effect
5. WHEN the background theme is halloween, THE Game System SHALL enable boss encounters

### Requirement 11

**User Story:** As a developer, I want boss encounters to be easily enabled or disabled, so that I can control when this feature is active.

#### Acceptance Criteria

1. THE Game System SHALL provide a BOSS_BATTLES_ENABLED configuration flag
2. WHEN BOSS_BATTLES_ENABLED is false, THE Game System SHALL not trigger boss encounters at score milestones
3. WHEN HALLOWEEN_EVENT_ACTIVE is false, THE Game System SHALL not trigger boss encounters
4. THE Game System SHALL log boss encounter events to the console for debugging
5. THE Game System SHALL maintain boss state separately from normal game state

### Requirement 12

**User Story:** As a player, I want boss encounters to maintain game performance, so that the experience remains smooth and responsive.

#### Acceptance Criteria

1. WHEN a boss is active, THE Game System SHALL maintain 60 frames per second rendering
2. WHEN projectiles are active, THE Game System SHALL limit the maximum number of active projectiles to 10
3. WHEN a projectile moves off-screen, THE Game System SHALL remove the projectile from memory within 1 frame
4. THE Game System SHALL use object pooling for projectile creation to minimize garbage collection
5. WHEN rendering boss sprites, THE Game System SHALL use cached canvas operations where possible
