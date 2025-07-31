import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, Play, Pause } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { saveScore } from '../../utils/gameUtils';
import { PlayerProfile } from '../../types/game';

interface BubblePopBlitzProps {
  onBack: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  points: number;
}

const GAME_WIDTH = 320;
const GAME_HEIGHT = 400;
const colors = ['#ff073a', '#00ff41', '#ffd700', '#00bfff', '#da70d6'];

export default function BubblePopBlitz({ onBack, profile, onUpdateProfile }: BubblePopBlitzProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const { playClick, playWin, playLose, playSound } = useSound();

  const gameState = useRef({
    bubbles: [] as Bubble[],
    nextBubbleId: 0,
    spawnTimer: 0,
    spawnRate: 60,
    score: 0,
    level: 1
  });

  const createBubble = useCallback(() => {
    const state = gameState.current;
    const speed = 1 + Math.random() * 2 + (state.level - 1) * 0.5;
    const size = 15 + Math.random() * 15;
    const points = Math.floor(speed * 10);
    
    return {
      id: state.nextBubbleId++,
      x: Math.random() * (GAME_WIDTH - size),
      y: GAME_HEIGHT,
      size,
      speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      points
    };
  }, []);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    const state = gameState.current;
    let bubblePopped = false;

    state.bubbles = state.bubbles.filter(bubble => {
      const distance = Math.sqrt(
        Math.pow(clickX - (bubble.x + bubble.size / 2), 2) +
        Math.pow(clickY - (bubble.y + bubble.size / 2), 2)
      );

      if (distance <= bubble.size / 2) {
        state.score += bubble.points;
        setScore(state.score);
        playSound(800 + bubble.points * 10, 100);
        bubblePopped = true;
        return false;
      }
      return true;
    });

    if (!bubblePopped) {
      playSound(300, 100);
    }
  }, [isPlaying, gameOver, playSound]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameState.current;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Spawn bubbles
    state.spawnTimer++;
    if (state.spawnTimer >= state.spawnRate) {
      state.bubbles.push(createBubble());
      state.spawnTimer = 0;
      state.spawnRate = Math.max(30, 60 - state.level * 5);
    }

    // Update bubbles
    let bubblesEscaped = 0;
    state.bubbles = state.bubbles.filter(bubble => {
      bubble.y -= bubble.speed;
      
      if (bubble.y + bubble.size < 0) {
        bubblesEscaped++;
        return false;
      }
      return true;
    });

    // Check for escaped bubbles
    if (bubblesEscaped > 0) {
      setLives(prev => {
        const newLives = prev - bubblesEscaped;
        if (newLives <= 0) {
          setGameOver(true);
          setIsPlaying(false);
          playLose();
          
          saveScore('bubble', {
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
          playSound(400, 200);
        }
        return Math.max(0, newLives);
      });
    }

    // Level progression
    const newLevel = Math.floor(state.score / 500) + 1;
    if (newLevel > state.level) {
      state.level = newLevel;
      setLevel(newLevel);
      playWin();
    }

    // Draw bubbles
    state.bubbles.forEach(bubble => {
      const gradient = ctx.createRadialGradient(
        bubble.x + bubble.size / 2, bubble.y + bubble.size / 2, 0,
        bubble.x + bubble.size / 2, bubble.y + bubble.size / 2, bubble.size / 2
      );
      gradient.addColorStop(0, bubble.color);
      gradient.addColorStop(1, bubble.color + '80');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bubble.x + bubble.size / 2, bubble.y + bubble.size / 2, bubble.size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw points
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        bubble.points.toString(),
        bubble.x + bubble.size / 2,
        bubble.y + bubble.size / 2 + 3
      );
    });

    // Draw UI
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 35);
    ctx.fillText(`Level: ${state.level}`, 10, 50);

    if (isPlaying && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isPlaying, gameOver, lives, createBubble, playLose, playWin, playSound, profile, onUpdateProfile]);

  const startGame = () => {
    gameState.current = {
      bubbles: [],
      nextBubbleId: 0,
      spawnTimer: 0,
      spawnRate: 60,
      score: 0,
      level: 1
    };
    setScore(0);
    setLives(3);
    setLevel(1);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="pixel-btn pixel-btn-secondary p-2">
            <Home size={20} />
          </button>
          <h1 className="pixel-text text-xl text-pixel-green">BUBBLE POP BLITZ</h1>
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
              className="w-full pixel-art cursor-crosshair"
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

          {!isPlaying && !gameOver && (
            <div className="text-center">
              <button onClick={startGame} className="pixel-btn pixel-btn-primary mb-4">
                Start Game
              </button>
              <div className="pixel-text text-xs text-gray-400">
                Click bubbles before they escape!
              </div>
            </div>
          )}

          {isPlaying && (
            <div className="text-center pixel-text text-xs text-gray-400">
              Click bubbles to pop them • Faster bubbles = more points
            </div>
          )}
        </div>
      </div>
    </div>
  );
}