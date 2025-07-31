import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, Play, Pause } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { saveScore } from '../../utils/gameUtils';
import { PlayerProfile } from '../../types/game';

interface AlienInvadersProps {
  onBack: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
}

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Alien extends GameObject {
  points: number;
  destroyed: boolean;
}

interface Bullet extends GameObject {
  dy: number;
}

const GAME_WIDTH = 320;
const GAME_HEIGHT = 400;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 20;
const ALIEN_WIDTH = 20;
const ALIEN_HEIGHT = 15;
const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 8;

export default function AlienInvaders({ onBack, profile, onUpdateProfile }: AlienInvadersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const { playClick, playWin, playLose, playSound } = useSound();

  const gameState = useRef({
    player: { x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - 40, width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
    aliens: [] as Alien[],
    bullets: [] as Bullet[],
    alienBullets: [] as Bullet[],
    keys: { left: false, right: false, space: false },
    alienDirection: 1,
    alienMoveTimer: 0,
    alienMoveSpeed: 60,
    lastShot: 0,
    score: 0
  });

  const createAliens = useCallback((waveNum: number) => {
    const aliens: Alien[] = [];
    const rows = Math.min(5, 3 + Math.floor(waveNum / 2));
    const cols = 8;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        aliens.push({
          x: col * (ALIEN_WIDTH + 10) + 40,
          y: row * (ALIEN_HEIGHT + 10) + 50,
          width: ALIEN_WIDTH,
          height: ALIEN_HEIGHT,
          points: (rows - row) * 10,
          destroyed: false
        });
      }
    }
    return aliens;
  }, []);

  const checkCollision = (rect1: GameObject, rect2: GameObject): boolean => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameState.current;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Update player movement
    if (state.keys.left && state.player.x > 0) {
      state.player.x -= 3;
    }
    if (state.keys.right && state.player.x < GAME_WIDTH - PLAYER_WIDTH) {
      state.player.x += 3;
    }

    // Player shooting
    if (state.keys.space && Date.now() - state.lastShot > 200) {
      state.bullets.push({
        x: state.player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
        y: state.player.y,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        dy: -5
      });
      state.lastShot = Date.now();
      playSound(1000, 50);
    }

    // Update bullets
    state.bullets = state.bullets.filter(bullet => {
      bullet.y += bullet.dy;
      return bullet.y > -BULLET_HEIGHT;
    });

    // Update alien bullets
    state.alienBullets = state.alienBullets.filter(bullet => {
      bullet.y += bullet.dy;
      return bullet.y < GAME_HEIGHT + BULLET_HEIGHT;
    });

    // Move aliens
    state.alienMoveTimer++;
    if (state.alienMoveTimer >= state.alienMoveSpeed) {
      let shouldMoveDown = false;
      
      // Check if aliens hit the edge
      const activeAliens = state.aliens.filter(alien => !alien.destroyed);
      for (const alien of activeAliens) {
        if ((alien.x <= 0 && state.alienDirection === -1) || 
            (alien.x >= GAME_WIDTH - ALIEN_WIDTH && state.alienDirection === 1)) {
          shouldMoveDown = true;
          break;
        }
      }

      if (shouldMoveDown) {
        state.alienDirection *= -1;
        state.aliens.forEach(alien => {
          if (!alien.destroyed) {
            alien.y += 20;
          }
        });
      } else {
        state.aliens.forEach(alien => {
          if (!alien.destroyed) {
            alien.x += state.alienDirection * 10;
          }
        });
      }

      state.alienMoveTimer = 0;
    }

    // Alien shooting
    if (Math.random() < 0.02) {
      const activeAliens = state.aliens.filter(alien => !alien.destroyed);
      if (activeAliens.length > 0) {
        const shooter = activeAliens[Math.floor(Math.random() * activeAliens.length)];
        state.alienBullets.push({
          x: shooter.x + ALIEN_WIDTH / 2 - BULLET_WIDTH / 2,
          y: shooter.y + ALIEN_HEIGHT,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          dy: 3
        });
      }
    }

    // Bullet-alien collisions
    state.bullets.forEach((bullet, bulletIndex) => {
      state.aliens.forEach((alien, alienIndex) => {
        if (!alien.destroyed && checkCollision(bullet, alien)) {
          alien.destroyed = true;
          state.bullets.splice(bulletIndex, 1);
          state.score += alien.points;
          setScore(state.score);
          playSound(800, 100);
        }
      });
    });

    // Alien bullet-player collisions
    state.alienBullets.forEach((bullet, bulletIndex) => {
      if (checkCollision(bullet, state.player)) {
        state.alienBullets.splice(bulletIndex, 1);
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameOver(true);
            setIsPlaying(false);
            playLose();
            
            saveScore('invaders', {
              playerName: profile.username,
              score: state.score,
              date: new Date().toISOString(),
              avatar: profile.avatar
            });
            
            onUpdateProfile({
              ...profile,
              totalScore: profile.totalScore + state.score,
              gamesPlayed: profile.gamesPlayed + 1
            });
          } else {
            playSound(400, 300);
          }
          return Math.max(0, newLives);
        });
      }
    });

    // Check if aliens reached player
    const activeAliens = state.aliens.filter(alien => !alien.destroyed);
    for (const alien of activeAliens) {
      if (alien.y + ALIEN_HEIGHT >= state.player.y) {
        setGameOver(true);
        setIsPlaying(false);
        playLose();
        
        saveScore('invaders', {
          playerName: profile.username,
          score: state.score,
          date: new Date().toISOString(),
          avatar: profile.avatar
        });
        
        onUpdateProfile({
          ...profile,
          totalScore: profile.totalScore + state.score,
          gamesPlayed: profile.gamesPlayed + 1
        });
        break;
      }
    }

    // Check wave completion
    if (activeAliens.length === 0) {
      setWave(prev => prev + 1);
      state.aliens = createAliens(wave + 1);
      state.alienMoveSpeed = Math.max(20, 60 - wave * 5);
      playWin();
    }

    // Draw player
    ctx.fillStyle = '#00ff41';
    ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);

    // Draw aliens
    state.aliens.forEach(alien => {
      if (!alien.destroyed) {
        ctx.fillStyle = '#ff073a';
        ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
        
        // Simple alien pattern
        ctx.fillStyle = '#fff';
        ctx.fillRect(alien.x + 5, alien.y + 3, 3, 3);
        ctx.fillRect(alien.x + 12, alien.y + 3, 3, 3);
      }
    });

    // Draw bullets
    ctx.fillStyle = '#ffd700';
    state.bullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    ctx.fillStyle = '#ff073a';
    state.alienBullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw UI
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 35);
    ctx.fillText(`Wave: ${wave}`, GAME_WIDTH - 80, 20);

    if (isPlaying && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isPlaying, gameOver, wave, lives, createAliens, playSound, playWin, playLose, profile, onUpdateProfile]);

  const startGame = () => {
    gameState.current = {
      player: { x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - 40, width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
      aliens: createAliens(1),
      bullets: [],
      alienBullets: [],
      keys: { left: false, right: false, space: false },
      alienDirection: 1,
      alienMoveTimer: 0,
      alienMoveSpeed: 60,
      lastShot: 0,
      score: 0
    };
    setScore(0);
    setLives(3);
    setWave(1);
    setGameOver(false);
    setIsPlaying(true);
    playClick();
  };

  const pauseGame = () => {
    setIsPlaying(false);
    playClick();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameState.current;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          state.keys.left = true;
          break;
        case 'ArrowRight':
          e.preventDefault();
          state.keys.right = true;
          break;
        case ' ':
          e.preventDefault();
          state.keys.space = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const state = gameState.current;
      switch (e.key) {
        case 'ArrowLeft':
          state.keys.left = false;
          break;
        case 'ArrowRight':
          state.keys.right = false;
          break;
        case ' ':
          state.keys.space = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, gameLoop]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="pixel-btn pixel-btn-secondary p-2">
            <Home size={20} />
          </button>
          <h1 className="pixel-text text-xl text-pixel-green">ALIEN INVADERS</h1>
          <button 
            onClick={isPlaying ? pauseGame : startGame} 
            className="pixel-btn p-2"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>

        <div className="pixel-panel p-4 mb-4">
          <div className="bg-black rounded border-2 border-pixel-green mb-4 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={GAME_WIDTH}
              height={GAME_HEIGHT}
              className="w-full pixel-art"
            />
          </div>

          <div className="flex justify-between pixel-text text-sm mb-4">
            <span>Score: {score.toLocaleString()}</span>
            <span className="text-pixel-red">Lives: {lives}</span>
            <span className="text-pixel-yellow">Wave: {wave}</span>
          </div>

          {gameOver && (
            <div className="text-center mb-4">
              <div className="pixel-text text-lg mb-2 text-pixel-red">Game Over!</div>
              <div className="pixel-text text-sm mb-4">
                Final Score: {score.toLocaleString()}
                <div>Waves Survived: {wave}</div>
              </div>
              <button onClick={startGame} className="pixel-btn pixel-btn-primary">
                Play Again
              </button>
            </div>
          )}

          {!isPlaying && !gameOver && (
            <div className="text-center">
              <button onClick={startGame} className="pixel-btn pixel-btn-primary mb-4">
                Start Game
              </button>
              <div className="pixel-text text-xs text-gray-400">
                Arrow keys to move • Spacebar to shoot
              </div>
            </div>
          )}

          {isPlaying && (
            <div className="text-center pixel-text text-xs text-gray-400">
              Defend Earth from alien invasion!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}