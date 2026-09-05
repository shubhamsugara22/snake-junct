const fs = require('fs');
const file = 'src/client/components/Game.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update Themes and Skins
content = content.replace(
  `type BackgroundTheme = 'beach' | 'night' | 'retro' | 'desert' | 'halloween' | 'underwater';
type CharacterSkin = 'orange' | 'blue' | 'pink' | 'green' | 'purple' | 'witch' | 'ghost' | 'red';

const BACKGROUND_THEMES: BackgroundTheme[] = ['beach', 'night', 'retro', 'desert'];`,
  `type BackgroundTheme = 'beach' | 'night' | 'retro' | 'desert' | 'halloween' | 'underwater' | 'space';
type CharacterSkin = 'orange' | 'blue' | 'pink' | 'green' | 'purple' | 'witch' | 'ghost' | 'red' | 'spaceship';

const BACKGROUND_THEMES: BackgroundTheme[] = ['space', 'beach', 'night', 'retro', 'desert'];`
);

// 2. Update useState<GameState>
content = content.replace(
  `  const [gameState, setGameState] = useState<GameState>({
    player: {
      position: { x: 150, y: GAME_CONFIG.gridHeight / 2 },
      velocity: 0,
      isAlive: true,
      skin: 'orange',
    },
    snakes: [],
    obstacles: [],
    powerUps: [],
    score: 0,
    level: 'easy',
    isGameOver: false,
    isPlaying: false,
    shieldActive: false,
    shieldEndTime: 0,
    fireActive: false,
    fireEndTime: 0,
    bossState: {`,
  `  const [gameState, setGameState] = useState<GameState>({
    player: {
      position: { x: 150, y: GAME_CONFIG.gridHeight / 2 },
      velocity: 0,
      isAlive: true,
      skin: 'spaceship',
    },
    playerProjectiles: [],
    snakes: [],
    obstacles: [],
    powerUps: [],
    score: 0,
    level: 'easy',
    isGameOver: false,
    isPlaying: false,
    shieldActive: false,
    shieldEndTime: 0,
    fireActive: false,
    fireEndTime: 0,
    doubleLaserActive: false,
    doubleLaserEndTime: 0,
    bossState: {`
);

// 3. Update initializeGame
content = content.replace(
  `      setGameState({
        player: {
          position: { x: 150, y: GAME_CONFIG.gridHeight / 2 },
          velocity: 0,
          isAlive: true,
          skin: selectedSkin,
        },
        snakes,
        obstacles,
        powerUps,
        score: 0,
        level,
        isGameOver: false,
        isPlaying: true,
        shieldActive: false,
        shieldEndTime: 0,
        fireActive: false,
        fireEndTime: 0,
        bossState: {`,
  `      setGameState({
        player: {
          position: { x: 150, y: GAME_CONFIG.gridHeight / 2 },
          velocity: 0,
          isAlive: true,
          skin: selectedSkin === 'orange' ? 'spaceship' : selectedSkin,
        },
        playerProjectiles: [],
        snakes,
        obstacles,
        powerUps,
        score: 0,
        level,
        isGameOver: false,
        isPlaying: true,
        shieldActive: false,
        shieldEndTime: 0,
        fireActive: false,
        fireEndTime: 0,
        doubleLaserActive: false,
        doubleLaserEndTime: 0,
        bossState: {`
);

// 4. Update Game loop Projectiles
content = content.replace(
  `        return newObstacle;
      });

      return newState;
    });`,
  `        return newObstacle;
      });

      if (newState.playerProjectiles) {
        newState.playerProjectiles = newState.playerProjectiles.filter((projectile) => {
          projectile.position.x += projectile.velocity.x;
          if (projectile.position.x > GAME_CONFIG.gridWidth + 50) return false;
          let hit = false;
          for (let i = 0; i < newState.snakes.length; i++) {
            const snake = newState.snakes[i];
            const dx = projectile.position.x - snake.position.x;
            const dy = projectile.position.y - snake.position.y;
            if (Math.sqrt(dx * dx + dy * dy) < projectile.size + 15) {
              hit = true;
              newState.score += 20;
              playKillSound();
              newState.snakes.splice(i, 1);
              break;
            }
          }
          if (!hit && newState.bossState.bossEncounterActive && newState.bossState.currentBoss) {
            const boss = newState.bossState.currentBoss;
            const dx = projectile.position.x - boss.position.x;
            const dy = projectile.position.y - boss.position.y;
            if (Math.sqrt(dx * dx + dy * dy) < projectile.size + 40) {
              hit = true;
              boss.health -= projectile.damage;
              boss.hitFlashTime = Date.now();
              playBossHitSound();
              newState.score += 5;
              if (boss.health <= 0 && boss.isActive) {
                boss.isActive = false;
                newState.bossState.bossTransitionPhase = 'victory';
                newState.bossState.transitionStartTime = Date.now();
                playBossDefeatedSound();
              }
            }
          }
          return !hit;
        });
      }

      return newState;
    });`
);

// 5. Add shoot function
content = content.replace(
  `    }));
  }, [gameState.isPlaying, gameState.isGameOver, isPaused]);

  const startGame = useCallback(`,
  `    }));
  }, [gameState.isPlaying, gameState.isGameOver, isPaused]);

  const shoot = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver || isPaused) return;

    setGameState((prevState) => {
      const now = Date.now();
      if (prevState.player.lastFireTime && now - prevState.player.lastFireTime < 250) {
        return prevState;
      }
      playPowerUpSound();
      const newProjectile = {
        id: Math.random().toString(36).substring(2, 9),
        position: { x: prevState.player.position.x + GAME_CONFIG.playerSize / 2, y: prevState.player.position.y },
        velocity: { x: 10, y: 0 },
        size: 5,
        active: true,
        damage: 1,
      };
      const newProjectiles = [...prevState.playerProjectiles, newProjectile];
      if (prevState.doubleLaserActive) {
        newProjectiles.push({
          ...newProjectile,
          id: Math.random().toString(36).substring(2, 9),
          position: { ...newProjectile.position, y: newProjectile.position.y + 10 }
        });
        newProjectiles[newProjectiles.length - 2].position.y -= 10;
      }
      return {
        ...prevState,
        playerProjectiles: newProjectiles,
        player: { ...prevState.player, lastFireTime: now }
      };
    });
  }, [gameState.isPlaying, gameState.isGameOver, isPaused]);

  const startGame = useCallback(`
);

// 6. Add background rendering
content = content.replace(
  `    const time = Date.now();
    
    if (backgroundTheme === 'halloween') {`,
  `    const time = Date.now();
    
    if (backgroundTheme === 'space') {
      const spaceGradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.gridHeight);
      spaceGradient.addColorStop(0, '#000000');
      spaceGradient.addColorStop(1, '#000033');
      ctx.fillStyle = spaceGradient;
      ctx.fillRect(0, 0, GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight);
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 50; i++) {
        const starX = (i * 123 + time * (i % 3 === 0 ? 0.05 : 0.02)) % GAME_CONFIG.gridWidth;
        const starY = (i * 87) % GAME_CONFIG.gridHeight;
        const starSize = i % 3 === 0 ? 2 : 1;
        ctx.globalAlpha = 0.5 + Math.sin(time * 0.005 + i) * 0.5;
        ctx.beginPath();
        ctx.arc(GAME_CONFIG.gridWidth - starX, starY, starSize, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    } else if (backgroundTheme === 'halloween') {`
);

// 7. Add player spaceship rendering
const playerRenderTarget = `    // Draw super cute chibi character with enhanced animations`;
const playerRenderReplacement = `    // Draw spaceship or chibi
    if (selectedSkin === 'spaceship' || backgroundTheme === 'space') {
      ctx.save();
      ctx.translate(playerX, playerY + Math.sin(Date.now() * 0.01) * 0.5);
      const exhaustLength = 10 + Math.random() * 10;
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath();
      ctx.moveTo(-playerRadius, -5);
      ctx.lineTo(-playerRadius - exhaustLength, 0);
      ctx.lineTo(-playerRadius, 5);
      ctx.fill();
      ctx.fillStyle = '#E0E0E0';
      ctx.beginPath();
      ctx.moveTo(playerRadius, 0);
      ctx.lineTo(-playerRadius, -playerRadius * 0.8);
      ctx.lineTo(-playerRadius, playerRadius * 0.8);
      ctx.fill();
      ctx.fillStyle = '#87CEEB';
      ctx.beginPath();
      ctx.ellipse(0, 0, playerRadius * 0.5, playerRadius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#A9A9A9';
      ctx.beginPath();
      ctx.moveTo(-playerRadius * 0.5, -playerRadius * 0.8);
      ctx.lineTo(-playerRadius, -playerRadius * 1.5);
      ctx.lineTo(-playerRadius * 0.2, -playerRadius * 0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-playerRadius * 0.5, playerRadius * 0.8);
      ctx.lineTo(-playerRadius, playerRadius * 1.5);
      ctx.lineTo(-playerRadius * 0.2, playerRadius * 0.5);
      ctx.fill();
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(0, -playerRadius * 0.9, playerRadius * 0.8, 3);
      ctx.fillRect(0, playerRadius * 0.9 - 3, playerRadius * 0.8, 3);
      ctx.restore();
    } else {
    // Animation: Squash and stretch based on velocity`;

content = content.replace(playerRenderTarget + '\\n\\n    // Animation: Squash and stretch based on velocity', playerRenderReplacement);
// Wait, replacing with '\n\n' might fail if line endings are \r\n, so we can use a more robust regex.
content = content.replace(/\\s*\\/\\/ Draw super cute chibi character with enhanced animations\\s*\\/\\/ Animation: Squash and stretch based on velocity/, '\\n' + playerRenderReplacement);

const endChibiTarget = /\\s*\\/\\/ Draw snakes \\(or Halloween creatures\\)/;
const endChibiReplacement = `      if (ctx.restore) { try { ctx.restore(); } catch(e) {} }
    }
    // Draw snakes (or Halloween creatures)`;
content = content.replace(endChibiTarget, '\\n' + endChibiReplacement);

// 8. Alien ships drawing
const snakeTarget = /const baseColor = snake.color \|\| '#228B22';\s*\/\/ HALLOWEEN EVENT - Replace snakes with pumpkins and witches\s*if \(backgroundTheme === 'halloween'\) {/;
const snakeReplacement = `const baseColor = snake.color || '#228B22';
      if (backgroundTheme === 'space') {
        const shipX = snake.position.x;
        const shipY = snake.position.y;
        ctx.fillStyle = '#8B008B';
        ctx.beginPath();
        ctx.ellipse(shipX, shipY, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(shipX, shipY - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(shipX + 15, shipY);
        ctx.lineTo(shipX + 25 + Math.random() * 5, shipY - 3);
        ctx.lineTo(shipX + 25 + Math.random() * 5, shipY + 3);
        ctx.fill();
      } else if (backgroundTheme === 'halloween') {`;
content = content.replace(snakeTarget, snakeReplacement);

// 9. Add player projectiles rendering
const projTarget = `      } else if (gameState.bossState.bossTransitionPhase === 'victory') {
        renderVictoryAnimation(ctx, boss, elapsedTime);
      }
    }
  }, [gameState, backgroundTheme]);`;
const projReplacement = `      } else if (gameState.bossState.bossTransitionPhase === 'victory') {
        renderVictoryAnimation(ctx, boss, elapsedTime);
      }
    }
    if (gameState.playerProjectiles) {
      gameState.playerProjectiles.forEach((p) => {
        if (!p.active) return;
        ctx.fillStyle = '#00FF00';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.position.x, p.position.y);
        ctx.lineTo(p.position.x - 15, p.position.y);
        ctx.stroke();
      });
    }
  }, [gameState, backgroundTheme]);`;
content = content.replace(projTarget, projReplacement);

// 10. Fix keyboard listener
const keyTarget = `  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump]);`;
const keyReplacement = `  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        shoot();
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump, shoot]);`;
content = content.replace(keyTarget, keyReplacement);

fs.writeFileSync(file, content);
console.log('Complete patch applied.');
