import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, Play, Pause, RotateCcw } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { saveScore } from '../../utils/gameUtils';
import { PlayerProfile } from '../../types/game';

interface FallingBlocksProps {
  onBack: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 20;

const SHAPES = [
  // I-piece
  [
    [1, 1, 1, 1]
  ],
  // O-piece
  [
    [1, 1],
    [1, 1]
  ],
  // T-piece
  [
    [0, 1, 0],
    [1, 1, 1]
  ],
  // S-piece
  [
    [0, 1, 1],
    [1, 1, 0]
  ],
  // Z-piece
  [
    [1, 1, 0],
    [0, 1, 1]
  ],
  // J-piece
  [
    [1, 0, 0],
    [1, 1, 1]
  ],
  // L-piece
  [
    [0, 0, 1],
    [1, 1, 1]
  ]
];

const COLORS = ['#ff073a', '#00ff41', '#ffd700', '#00bfff', '#da70d6', '#ff8c00', '#ff1493'];

interface Piece {
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

export default function FallingBlocks({ onBack, profile, onUpdateProfile }: FallingBlocksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const { playClick, playWin, playLose, playSound } = useSound();

  const gameState = useRef({
    board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)),
    currentPiece: null as Piece | null,
    nextPiece: null as Piece | null,
    dropTimer: 0,
    dropSpeed: 60,
    score: 0,
    lines: 0
  });

  const createPiece = useCallback((): Piece => {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    return {
      shape: SHAPES[shapeIndex],
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
      y: 0,
      color: COLORS[shapeIndex]
    };
  }, []);

  const isValidPosition = useCallback((piece: Piece, dx = 0, dy = 0, newShape?: number[][]): boolean => {
    const shape = newShape || piece.shape;
    const newX = piece.x + dx;
    const newY = piece.y + dy;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;
          
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return false;
          }
          
          if (boardY >= 0 && gameState.current.board[boardY][boardX]) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  const rotatePiece = useCallback((piece: Piece): number[][] => {
    const rotated = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    );
    return rotated;
  }, []);

  const placePiece = useCallback((piece: Piece) => {
    const state = gameState.current;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;
          if (boardY >= 0) {
            state.board[boardY][boardX] = piece.color;
          }
        }
      }
    }
  }, []);

  const clearLines = useCallback(() => {
    const state = gameState.current;
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (state.board[y].every(cell => cell !== 0)) {
        state.board.splice(y, 1);
        state.board.unshift(Array(BOARD_WIDTH).fill(0));
        linesCleared++;
        y++; // Check the same row again
      }
    }
    
    if (linesCleared > 0) {
      const points = [0, 100, 300, 500, 800][linesCleared] * level;
      state.score += points;
      state.lines += linesCleared;
      setScore(state.score);
      setLines(state.lines);
      
      const newLevel = Math.floor(state.lines / 10) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
        state.dropSpeed = Math.max(10, 60 - newLevel * 5);
        playWin();
      } else {
        playSound(800, 200);
      }
    }
  }, [level, playSound, playWin]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameState.current;

    // Create new piece if needed
    if (!state.currentPiece) {
      state.currentPiece = state.nextPiece || createPiece();
      state.nextPiece = createPiece();
      
      if (!isValidPosition(state.currentPiece)) {
        setGameOver(true);
        setIsPlaying(false);
        playLose();
        
        saveScore('blocks', {
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
        return;
      }
    }

    // Drop piece
    state.dropTimer++;
    if (state.dropTimer >= state.dropSpeed) {
      if (state.currentPiece && isValidPosition(state.currentPiece, 0, 1)) {
        state.currentPiece.y++;
      } else if (state.currentPiece) {
        placePiece(state.currentPiece);
        clearLines();
        state.currentPiece = null;
      }
      state.dropTimer = 0;
    }

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw board
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (state.board[y][x]) {
          ctx.fillStyle = state.board[y][x] as string;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      }
    }

    // Draw current piece
    if (state.currentPiece) {
      ctx.fillStyle = state.currentPiece.color;
      for (let y = 0; y < state.currentPiece.shape.length; y++) {
        for (let x = 0; x < state.currentPiece.shape[y].length; x++) {
          if (state.currentPiece.shape[y][x]) {
            const drawX = (state.currentPiece.x + x) * CELL_SIZE;
            const drawY = (state.currentPiece.y + y) * CELL_SIZE;
            ctx.fillRect(drawX, drawY, CELL_SIZE - 1, CELL_SIZE - 1);
          }
        }
      }
    }

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(BOARD_WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    if (isPlaying && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isPlaying, gameOver, level, createPiece, isValidPosition, placePiece, clearLines, playLose, profile, onUpdateProfile]);

  const movePiece = useCallback((dx: number, dy: number) => {
    const state = gameState.current;
    if (state.currentPiece && isValidPosition(state.currentPiece, dx, dy)) {
      state.currentPiece.x += dx;
      state.currentPiece.y += dy;
      if (dy > 0) playSound(600, 50);
    }
  }, [isValidPosition, playSound]);

  const rotatePieceAction = useCallback(() => {
    const state = gameState.current;
    if (state.currentPiece) {
      const rotated = rotatePiece(state.currentPiece);
      if (isValidPosition(state.currentPiece, 0, 0, rotated)) {
        state.currentPiece.shape = rotated;
        playSound(800, 100);
      }
    }
  }, [rotatePiece, isValidPosition, playSound]);

  const dropPiece = useCallback(() => {
    const state = gameState.current;
    if (state.currentPiece) {
      while (isValidPosition(state.currentPiece, 0, 1)) {
        state.currentPiece.y++;
      }
      state.dropTimer = state.dropSpeed; // Force immediate placement
    }
  }, [isValidPosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePieceAction();
          break;
        case ' ':
          e.preventDefault();
          dropPiece();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, movePiece, rotatePieceAction, dropPiece]);

  const startGame = () => {
    gameState.current = {
      board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)),
      currentPiece: null,
      nextPiece: null,
      dropTimer: 0,
      dropSpeed: 60,
      score: 0,
      lines: 0
    };
    setScore(0);
    setLines(0);
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
          <h1 className="pixel-text text-xl text-pixel-green">FALLING BLOCKS</h1>
          <div className="flex gap-2">
            <button onClick={startGame} className="pixel-btn p-2">
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={isPlaying ? pauseGame : startGame} 
              className="pixel-btn p-2"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </div>
        </div>

        <div className="pixel-panel p-4 mb-4">
          <div className="flex justify-between pixel-text text-sm mb-4">
            <span>Score: {score.toLocaleString()}</span>
            <span>Lines: {lines}</span>
            <span className="text-pixel-yellow">Level: {level}</span>
          </div>

          <div className="bg-black rounded border-2 border-pixel-green mb-4 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={BOARD_WIDTH * CELL_SIZE}
              height={BOARD_HEIGHT * CELL_SIZE}
              className="w-full pixel-art"
            />
          </div>

          {gameOver && (
            <div className="text-center mb-4">
              <div className="pixel-text text-lg mb-2 text-pixel-red">Game Over!</div>
              <div className="pixel-text text-sm mb-4">
                <div>Final Score: {score.toLocaleString()}</div>
                <div>Lines Cleared: {lines}</div>
                <div>Level Reached: {level}</div>
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
                Arrow keys to move • Up to rotate • Space to drop
              </div>
            </div>
          )}

          {isPlaying && (
            <div className="text-center pixel-text text-xs text-gray-400">
              Clear lines to score points • Speed increases each level
            </div>
          )}
        </div>
      </div>
    </div>
  );
}