import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, Play, Pause } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { saveScore } from '../../utils/gameUtils';
import { PlayerProfile } from '../../types/game';

interface BrickBreakerProps {
  onBack: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  points: number;
  destroyed: boolean;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GAME_WIDTH = 320;
const GAME_HEIGHT = 400;
const BRICK_ROWS = 6;
const BRICK_COLS = 8;
const BRICK_WIDTH = 35;
const BRICK_HEIGHT = 15;
const BRICK_PADDING = 5;

export default function BrickBreaker({ onBack, profile, onUpdateProfile }: BrickBreakerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const { playClick, playWin, playLose, playSound } = useSound();

  const gameState = useRef({
    ball: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50, dx: 3, dy: -3, radius: 8 } as Ball,
    paddle: { x: GAME_WIDTH / 2 - 40, y: GAME_HEIGHT - 20, width: 80, height: 10 } as Paddle,
    bricks: [] as Brick[],
    score: 0,
    ballLaunched: false
  });

  const createBricks = useCallback(() => {
    const bricks: Brick[] = [];
    const colors = ['#ff073a', '#ff8c00', '#ffd700', '#00ff41', '#00bfff', '#da70d6'];
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING,
          y: row * (BRICK_HEIGHT + BRICK_PADDING) + 50,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          color: colors[row],
          points: (BRICK_ROWS - row) * 10,
          destroyed: false
        });
      }
    }
    return bricks;
  }, []);

  const checkCollision = (ball: Ball, rect: { x: number; y: number; width: number; height: number }) => {
    return ball.x + ball.radius > rect.x &&
           ball.x - ball.radius < rect.x + rect.width &&
           ball.y + ball.radius > rect.y &&
           ball.y - ball.radius < rect.y + rect.height;
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

    // Update ball position
    if (state.ballLaunched) {
      state.ball.x += state.ball.dx;
      state.ball.y += state.ball.dy;

      // Ball collision with walls
      if (state.ball.x + state.ball.radius > GAME_WIDTH || state.ball.x - state.ball.radius < 0) {
        state.ball.dx = -state.ball.dx;
        playSound(600, 50);
      }
      if (state.ball.y - state.ball.radius < 0) {
        state.ball.dy = -state.ball.dy;
        playSound(600, 50);
      }

      // Ball collision with paddle
      if (checkCollision(state.ball, state.paddle) && state.ball.dy > 0) {
        const hitPos = (state.ball.x - state.paddle.x) / state.paddle.width;
        state.ball.dx = (hitPos - 0.5) * 6;
        state.ball.dy = -Math.abs(state.ball.dy);
        playSound(800, 100);
      }

      // Ball collision with bricks
      state.bricks.forEach(brick => {
        if (!brick.destroyed && checkCollision(state.ball, brick)) {
          brick.destroyed = true;
          state.score += brick.points;
          setScore(state.score);
          state.ball.dy = -state.ball.dy;
          playSound(1000, 150);
        }
      });

      // Check if ball fell off screen
      if (state.ball.y > GAME_HEIGHT) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameOver(true);
            setIsPlaying(false);
            playLose();
            
            saveScore('brick', {
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
            // Reset ball
            state.ball.x = GAME_WIDTH / 2;
            state.ball.y = GAME_HEIGHT - 50;
            state.ball.dx = 3;
            state.ball.dy = -3;
            state.ballLaunched = false;
            playSound(400, 300);
          }
          return Math.max(0, newLives);
        });
      }
    } else {
      // Ball follows paddle when not launched
      state.ball.x = state.paddle.x + state.paddle.width / 2;
    }

    // Check win condition
    const activeBricks = state.bricks.filter(brick => !brick.destroyed);
    if (activeBricks.length === 0 && !gameWon) {
      setGameWon(true);
      setIsPlaying(false);
      playWin();
      
      const bonusPoints = lives * 100 + level * 500;
      state.score += bonusPoints;
      setScore(state.score);
      
      saveScore('brick', {
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
    }

    // Draw bricks
    state.bricks.forEach(brick => {
      if (!brick.destroyed) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    });

    // Draw paddle
    ctx.fillStyle = '#00ff41';
    ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height);

    // Draw ball
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw UI
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 35);
    ctx.fillText(`Level: ${level}`, GAME_WIDTH - 80, 20);

    if (!state.ballLaunched) {
      ctx.fillStyle = '#ffd700';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CLICK TO LAUNCH', GAME_WIDTH / 2, GAME_HEIGHT - 100);
      ctx.textAlign = 'left';
    }

    if (isPlaying && !gameOver && !gameWon) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isPlaying, gameOver, gameWon, lives, level, playSound, playWin, playLose, profile, onUpdateProfile]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const mouseX = (event.clientX - rect.left) * scaleX;
    
    const state = gameState.current;
    state.paddle.x = Math.max(0, Math.min(GAME_WIDTH - state.paddle.width, mouseX - state.paddle.width / 2));
  }, [isPlaying]);

  const handleCanvasClick = useCallback(() => {
    if (!isPlaying || gameOver || gameWon) return;
    
    const state = gameState.current;
    if (!state.ballLaunched) {
      state.ballLaunched = true;
      playClick();
    }
  }, [isPlaying, gameOver, gameWon, playClick]);

  const startGame = () => {
    gameState.current = {
      ball: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50, dx: 3, dy: -3, radius: 8 },
      paddle: { x: GAME_WIDTH / 2 - 40, y: GAME_HEIGHT - 20, width: 80, height: 10 },
      bricks: createBricks(),
      score: 0,
      ballLaunched: false
    };
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setGameWon(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="pixel-btn pixel-btn-secondary p-2">
            <Home size={20} />
          </button>
          <h1 className="pixel-text text-xl text-pixel-green">BRICK BREAKER</h1>
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
              className="w-full pixel-art cursor-none"
              onMouseMove={handleMouseMove}
              onClick={handleCanvasClick}
            />
          </div>

          <div className="flex justify-between pixel-text text-sm mb-4">
            <span>Score: {score.toLocaleString()}</span>
            <span className="text-pixel-red">Lives: {lives}</span>
            <span className="text-pixel-yellow">Level: {level}</span>
          </div>

          {gameOver && (
            <div className="text-center mb-4">
              <div className="pixel-text text-lg mb-2 text-pixel-red">Game Over!</div>
              <div className="pixel-text text-sm mb-4">
                Final Score: {score.toLocaleString()}
              </div>
              <button onClick={startGame} className="pixel-btn pixel-btn-primary">
                Play Again
              </button>
            </div>
          )}

          {gameWon && (
            <div className="text-center mb-4">
              <div className="pixel-text text-lg mb-2 text-pixel-green">Level Complete!</div>
              <div className="pixel-text text-sm mb-4">
                Score: {score.toLocaleString()}
                <div className="text-pixel-yellow">Bonus: {lives * 100 + level * 500}</div>
              </div>
              <button onClick={startGame} className="pixel-btn pixel-btn-primary">
                Next Level
              </button>
            </div>
          )}

          {!isPlaying && !gameOver && !gameWon && (
            <div className="text-center">
              <button onClick={startGame} className="pixel-btn pixel-btn-primary mb-4">
                Start Game
              </button>
              <div className="pixel-text text-xs text-gray-400">
                Move mouse to control paddle • Click to launch ball
              </div>
            </div>
          )}

          {isPlaying && (
            <div className="text-center pixel-text text-xs text-gray-400">
              Break all bricks to win • Don't let the ball fall!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}