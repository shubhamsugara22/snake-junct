---
inclusion: manual
---

# Testing Guidelines for Snake Junct

## Manual Testing Checklist

### Core Gameplay

- [ ] Character jumps on space/click/tap
- [ ] Gravity and physics feel natural
- [ ] Collision detection is accurate
- [ ] Score increments correctly
- [ ] Game over triggers properly

### ML Adaptive Difficulty

- [ ] Skill level displays and updates
- [ ] Difficulty adjusts after multiple games
- [ ] Beginners get easier gameplay
- [ ] Skilled players get harder gameplay
- [ ] Profile persists across sessions

### Visual Elements

- [ ] All themes render correctly (beach, night, retro, desert, halloween)
- [ ] Coiling snakes are clearly visible
- [ ] Character skins display properly
- [ ] Shield power-ups are visible
- [ ] Animations are smooth (60 FPS)

### Sound Effects

- [ ] Jump sound plays
- [ ] Collision sound plays
- [ ] Point sound plays
- [ ] Power-up sound plays
- [ ] Halloween sounds work (if event active)

### Event System

- [ ] Halloween event toggles correctly
- [ ] Witches and pumpkins render properly
- [ ] Event UI updates display
- [ ] Can disable event with flag

### Cross-Browser Testing

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Performance Testing

- [ ] Maintains 60 FPS during gameplay
- [ ] No memory leaks during extended play
- [ ] LocalStorage doesn't exceed limits
- [ ] Canvas rendering is optimized

## Automated Testing (Future)

- Unit tests for ML algorithm
- Collision detection tests
- Profile persistence tests
- Performance benchmarks
