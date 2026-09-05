const fs = require('fs');
const file = 'src/client/components/Game.tsx';
let content = fs.readFileSync(file, 'utf8');

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

content = content.replace(playerRenderTarget + '\n\n    // Animation: Squash and stretch based on velocity', playerRenderReplacement);

const endChibiTarget = `    // Draw snakes (or Halloween creatures)`;
const endChibiReplacement = `      if (ctx.restore) {
        try { ctx.restore(); } catch(e) {}
      }
    }
    // Draw snakes (or Halloween creatures)`;
content = content.replace(endChibiTarget, endChibiReplacement);

const projectileTarget = `  }, [gameState, backgroundTheme]);`;
const projectileReplacement = `    // Render player projectiles
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

content = content.replace(projectileTarget, projectileReplacement);

fs.writeFileSync(file, content);
console.log('Modifications applied successfully.');
