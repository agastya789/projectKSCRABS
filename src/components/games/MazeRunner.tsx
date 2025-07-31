import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { saveScore } from '../../utils/gameUtils';
import { PlayerProfile } from '../../types/game';

interface MazeRunnerProps {
  onBack: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
}

const MAZE_SIZE = 15;
const CELL_SIZE = 20;

interface Position {
  x: number;
  y: number;
}

export default function MazeRunner({ onBack, profile, onUpdateProfile }: MazeRunnerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maze, setMaze] = useState<number[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [endPos] = useState<Position>({ x: MAZE_SIZE - 2, y: MAZE_SIZE - 2 });
  const [gameWon, setGameWon] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showPath, setShowPath] = useState(false);
  const [pathRevealed, setPathRevealed] = useState(false);
  const { playClick, playWin, playSound } = useSound();

  const generateMaze = useCallback(() => {
    const newMaze = Array(MAZE_SIZE).fill(null).map(() => Array(MAZE_SIZE).fill(1));
    
    const stack: Position[] = [];
    const current = { x: 1, y: 1 };
    newMaze[current.y][current.x] = 0;
    stack.push(current);

    const directions = [
      { x: 0, y: -2 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: -2, y: 0 }
    ];

    while (stack.length > 0) {
      const neighbors = directions
        .map(dir => ({ x: current.x + dir.x, y: current.y + dir.y }))
        .filter(pos => 
          pos.x > 0 && pos.x < MAZE_SIZE - 1 && 
          pos.y > 0 && pos.y < MAZE_SIZE - 1 && 
          newMaze[pos.y][pos.x] === 1
        );

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        const wallX = current.x + (next.x - current.x) / 2;
        const wallY = current.y + (next.y - current.y) / 2;
        
        newMaze[next.y][next.x] = 0;
        newMaze[wallY][wallX] = 0;
        
        current.x = next.x;
        current.y = next.y;
        stack.push({ ...current });
      } else if (stack.length > 0) {
        const prev = stack.pop()!;
        current.x = prev.x;
        current.y = prev.y;
      }
    }

    newMaze[endPos.y][endPos.x] = 0;
    return newMaze;
  }, [endPos]);

  const findPath = useCallback(() => {
    const queue: Array<{ pos: Position; path: Position[] }> = [
      { pos: { x: 1, y: 1 }, path: [{ x: 1, y: 1 }] }
    ];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      const key = `${pos.x},${pos.y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      if (pos.x === endPos.x && pos.y === endPos.y) {
        return path;
      }
      
      const directions = [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
      ];
      
      for (const dir of directions) {
        const newPos = { x: pos.x + dir.x, y: pos.y + dir.y };
        if (
          newPos.x >= 0 && newPos.x < MAZE_SIZE &&
          newPos.y >= 0 && newPos.y < MAZE_SIZE &&
          maze[newPos.y][newPos.x] === 0 &&
          !visited.has(`${newPos.x},${newPos.y}`)
        ) {
          queue.push({ pos: newPos, path: [...path, newPos] });
        }
      }
    }
    return [];
  }, [maze, endPos]);

  useEffect(() => {
    const newMaze = generateMaze();
    setMaze(newMaze);
    setPlayerPos({ x: 1, y: 1 });
    setGameWon(false);
    setTimeElapsed(0);
    setGameStarted(false);
    setShowPath(false);
    setPathRevealed(false);
  }, [generateMaze]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameWon) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameWon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || maze.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    for (let y = 0; y < MAZE_SIZE; y++) {
      for (let x = 0; x < MAZE_SIZE; x++) {
        if (maze[y][x] === 1) {
          ctx.fillStyle = '#00ff41';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Draw path if revealed
    if (showPath && pathRevealed) {
      const path = findPath();
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      path.forEach(pos => {
        ctx.fillRect(pos.x * CELL_SIZE, pos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      });
    }

    // Draw end position
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(endPos.x * CELL_SIZE, endPos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    // Draw player
    ctx.fillStyle = '#ff073a';
    ctx.fillRect(playerPos.x * CELL_SIZE + 2, playerPos.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  }, [maze, playerPos, endPos, showPath, pathRevealed, findPath]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!gameStarted) setGameStarted(true);
    
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    
    if (
      newX >= 0 && newX < MAZE_SIZE &&
      newY >= 0 && newY < MAZE_SIZE &&
      maze[newY] && maze[newY][newX] === 0
    ) {
      setPlayerPos({ x: newX, y: newY });
      playSound(800, 50);
      
      if (newX === endPos.x && newY === endPos.y) {
        setGameWon(true);
        playWin();
        const finalScore = Math.max(1000 - timeElapsed * 5 - (pathRevealed ? 200 : 0), 100);
        saveScore('maze', {
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
      }
    }
  }, [playerPos, maze, endPos, gameStarted, timeElapsed, pathRevealed, playSound, playWin, profile, onUpdateProfile]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameWon) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePlayer(1, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePlayer, gameWon]);

  const resetGame = () => {
    const newMaze = generateMaze();
    setMaze(newMaze);
    setPlayerPos({ x: 1, y: 1 });
    setGameWon(false);
    setTimeElapsed(0);
    setGameStarted(false);
    setShowPath(false);
    setPathRevealed(false);
    playClick();
  };

  const togglePath = () => {
    if (!pathRevealed) {
      setPathRevealed(true);
    }
    setShowPath(!showPath);
    playClick();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="pixel-btn pixel-btn-secondary p-2">
            <Home size={20} />
          </button>
          <h1 className="pixel-text text-2xl text-pixel-green">MAZE RUNNER</h1>
          <button onClick={resetGame} className="pixel-btn p-2">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="pixel-panel p-4 mb-4">
          <div className="flex justify-between pixel-text text-sm mb-4">
            <span>Time: {formatTime(timeElapsed)}</span>
            <button 
              onClick={togglePath}
              className={`pixel-btn p-1 text-xs ${pathRevealed ? 'pixel-btn-secondary' : ''}`}
            >
              {showPath ? <EyeOff size={16} /> : <Eye size={16} />}
              {pathRevealed && ' (-200pts)'}
            </button>
          </div>

          <div className="bg-black rounded border-2 border-pixel-green mb-4 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={MAZE_SIZE * CELL_SIZE}
              height={MAZE_SIZE * CELL_SIZE}
              className="w-full pixel-art"
            />
          </div>

          {gameWon && (
            <div className="text-center mb-4">
              <div className="pixel-text text-lg mb-2 text-pixel-green">Maze Complete!</div>
              <div className="pixel-text text-sm mb-4">
                <div>Time: {formatTime(timeElapsed)}</div>
                <div className="text-pixel-yellow">
                  Score: {Math.max(1000 - timeElapsed * 5 - (pathRevealed ? 200 : 0), 100)}
                </div>
              </div>
              <button onClick={resetGame} className="pixel-btn pixel-btn-primary">
                New Maze
              </button>
            </div>
          )}

          <div className="text-center pixel-text text-xs text-gray-400">
            Use arrow keys to navigate • Red square to yellow goal
          </div>
        </div>
      </div>
    </div>
  );
}