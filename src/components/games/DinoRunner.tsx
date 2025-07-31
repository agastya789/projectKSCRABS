import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, Play, Pause } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { saveScore } from '../../utils/gameUtils';
import { PlayerProfile } from '../../types/game';

interface DinoRunnerProps {
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

const GAME_WIDTH = 320;
const GAME_HEIGHT = 200;
const DINO_WIDTH = 20;
const DINO_HEIGHT = 20;
const OBSTACLE_WIDTH = 15;
const OBSTACLE_HEIGHT = 30;
const GROUND_Y = GAME_HEIGHT - 30;

export default function DinoRunner({ onBack, profile, onUpdateProfile }: DinoRunnerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('dino_high_score') || '0');
  });
  const [gameOver, setGameOver] = useState(false);
  const { playClick, playWin, playLose, playSound } = useSound();

  const gameState = useRef({
    dino: { x: 50, y: GROUND_Y - DINO_HEIGHT, velocityY: 0, isJumping: false },
    obstacles: [] as GameObject[],
    speed: 2,
    lastObstacle: 0,
    score: 0
  });

  const checkCollision = (rect1: GameObject, rect2: GameObject): boolean => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const jump = useCallback(() => {
    if (!gameState.current.dino.isJumping && !gameOver) {
      gameState.current.dino.velocityY = -8;
      gameState.current.dino.isJumping = true;
      playSound(800, 100);
    }
  }, [gameOver, playSound]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameState.current;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Update dino physics
    if (state.dino.isJumping) {
      state.dino.y += state.dino.velocityY;
      state.dino.velocityY += 0.5; // gravity

      if (state.dino.y >= GROUND_Y - DINO_HEIGHT) {
        state.dino.y = GROUND_Y - DINO_HEIGHT;
        state.dino.isJumping = false;
        state.dino.velocityY = 0;
      }
    }

    // Generate obstacles
    if (state.lastObstacle > 100 + Math.random() * 100) {
      state.obstacles.push({
        x: GAME_WIDTH,
        y: GROUND_Y - OBSTACLE_HEIGHT,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT
      });
      state.lastObstacle = 0;
    }
    state.lastObstacle++;

    // Update obstacles
    state.obstacles = state.obstacles.filter(obstacle => {
      obstacle.x -= state.speed;
      return obstacle.x > -OBSTACLE_WIDTH;
    });

    // Check collisions
    const dinoRect = {
      x: state.dino.x,
      y: state.dino.y,
      width: DINO_WIDTH,
      height: DINO_HEIGHT
    };

    for (const obstacle of state.obstacles) {
      if (checkCollision(dinoRect, obstacle)) {
        setGameOver(true);
        setIsPlaying(false);
        playLose();
        
        const finalScore = state.score;
        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem('dino_high_score', finalScore.toString());
        }
        
        saveScore('dino', {
          playerName: profile.username,
          score: finalScore,
          date: new Date().toISOString(),
          avatar: profile.avatar
        });
        
        onUpdateProfile({
          ...profile,
          totalScore: profile.totalScore + finalScore,
          gamesPlayed: profile.gamesPlayed + 1
        });
        return;
      }
    }

    // Update score and speed
    state.score++;
    if (state.score % 100 === 0) {
      state.speed += 0.2;
      playSound(1000, 50);
    }
    setScore(state.score);

    // Draw ground
    ctx.fillStyle = '#00ff41';
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 2);

    // Draw dino
    ctx.fillStyle = '#00ff41';
    ctx.fillRect(state.dino.x, state.dino.y, DINO_WIDTH, DINO_HEIGHT);

    // Draw obstacles
    ctx.fillStyle = '#ff073a';
    state.obstacles.forEach(obstacle => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`High: ${highScore}`, 10, 35);

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isPlaying, highScore, playLose, playSound, profile, onUpdateProfile]);

  const startGame = () => {
    gameState.current = {
      dino: { x: 50, y: GROUND_Y - DINO_HEIGHT, velocityY: 0, isJumping: false },
      obstacles: [],
      speed: 2,
      lastObstacle: 0,
      score: 0
    };
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    playClick();
  };

  const pauseGame = () => {
    setIsPlaying(false);
    playClick();
  };

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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="pixel-btn pixel-btn-secondary p-2">
            <Home size={20} />
          </button>
          <h1 className="pixel-text text-2xl text-pixel-green">DINO RUNNER</h1>
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
              onClick={jump}
            />
          </div>

          <div className="flex justify-between pixel-text text-sm mb-4">
            <span>Score: {score.toLocaleString()}</span>
            <span className="text-pixel-yellow">High: {highScore.toLocaleString()}</span>
          </div>

          {gameOver && (
            <div className="text-center mb-4">
              <div className="pixel-text text-lg mb-2 text-pixel-red">Game Over!</div>
              <div className="pixel-text text-sm mb-4">
                Final Score: {score.toLocaleString()}
                {score > highScore && (
                  <div className="text-pixel-yellow">New High Score!</div>
                )}
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
                Press SPACE or tap to jump
              </div>
            </div>
          )}

          {isPlaying && (
            <div className="text-center pixel-text text-xs text-gray-400">
              Press SPACE or tap to jump
            </div>
          )}
        </div>
      </div>
    </div>
  );
}