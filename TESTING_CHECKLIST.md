# Snake Dodge - Testing & Troubleshooting Checklist

**Last Updated:** November 23, 2025  
**Test Status:** ✅ ALL AUTOMATED TESTS PASSING (368 tests)

## 🎮 Core Gameplay Tests

### Basic Mechanics
- [x] Player spawns at correct position (x: 150, y: 200) ✅
- [x] Gravity works (player falls when not jumping) ✅
- [x] Jump works (Space/Up Arrow/Click) ✅
- [x] Player bounces off ground and ceiling ✅
- [x] Game runs at 60 FPS ✅

### Difficulty Levels
- [x] **Easy**: 3 snakes, 3 obstacles, slower speed ✅
- [x] **Medium**: 6 snakes, 5 obstacles, medium speed ✅
- [x] **Hard**: 9 snakes, 7 obstacles, fast speed ✅

### Collision Detection
- [x] Player dies when hitting snake ✅
- [x] Player dies when hitting pillar (outside gap) ✅
- [x] Player passes through pillar gap safely ✅
- [x] Player dies when hitting ghost (Halloween mode) ✅

### Scoring System
- [x] +10 points for passing snake ✅
- [x] +5 points for passing obstacle ✅
- [x] +5 points for hitting boss ✅
- [x] +10 points for killing enemy with fire ✅
- [x] Bonus points on boss defeat (100) ✅

## 🛡️ Power-Up System Tests

### Shield Power-Up
- [x] Shield spawns in game ✅
- [x] Shield can be collected ✅
- [x] Shield timer shows (20 seconds) ✅
- [x] Player is invincible with shield ✅
- [x] Shield expires after 20 seconds ✅
- [x] Shield sound plays on pickup ✅

### Fire Power-Up (Halloween Only)
- [x] Fire spawns (30% chance) ✅
- [x] Fire can be collected ✅
- [x] Fire timer shows (10 seconds) ✅
- [x] Enemies die on contact ✅
- [x] Kill sound plays ✅
- [x] +10 points per kill ✅
- [x] Fire expires after 10 seconds ✅
