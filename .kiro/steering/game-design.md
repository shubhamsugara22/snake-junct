---
inclusion: fileMatch
fileMatchPattern: '**/Game.tsx'
---

# Snake Junct Game Design Principles

## Core Philosophy
- **Accessibility First**: Game should be enjoyable for all skill levels
- **Fair Challenge**: Difficulty adapts to player skill, never feels unfair
- **Visual Clarity**: All game elements must be clearly visible and distinguishable
- **Performance**: Maintain 60 FPS at all times
- **Responsive**: Controls must feel instant and precise

## ML Adaptive Difficulty Guidelines
- Skill level calculation: 40% score + 40% survival time + 20% reaction speed
- Use exponential moving average (alpha = 0.3) for smooth transitions
- Adjust difficulty gradually, never sudden spikes
- Beginners get: More shields, wider spacing, slower enemies
- Skilled players get: Fewer shields, tighter spacing, faster enemies, more coiling snakes

## Visual Standards
- All enemies must have clear silhouettes
- Use glow effects for important elements (power-ups, special enemies)
- Maintain consistent art style across themes
- Animations should be smooth (avoid jarring movements)
- Color contrast must be sufficient for visibility

## Performance Requirements
- Canvas rendering optimized for 60 FPS
- Minimize object creation in game loop
- Use object pooling for frequently created/destroyed objects
- Profile rendering performance regularly
- Keep collision detection efficient

## Event System Rules
- All temporary events must use feature flags (e.g., HALLOWEEN_EVENT_ACTIVE)
- Event code must be clearly marked with comments
- Events should not modify core game logic
- Easy to enable/disable with single variable
- Document removal instructions

## Sound Design
- Use Web Audio API for dynamic sound generation
- Keep sounds short and non-intrusive
- Provide audio feedback for all player actions
- Match sound effects to visual theme
- Fail gracefully if audio context unavailable

## Code Organization
- Keep game state immutable where possible
- Separate rendering from game logic
- Use TypeScript for type safety
- Comment complex algorithms (especially ML and collision detection)
- Maintain CHANGELOG for all feature additions
