import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../../types/game';

interface MinesweeperProps {
  onBack: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (value: PlayerProfile | ((val: PlayerProfile) => PlayerProfile)) => void;
}

const ROWS = 5;
const COLS = 5;
const MINES = 5;

interface Cell {
  revealed: boolean;
  hasMine: boolean;
  flagged: boolean;
  adjacentMines: number;
}

const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

function generateGrid(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      revealed: false,
      hasMine: false,
      flagged: false,
      adjacentMines: 0,
    }))
  );

  // Place mines randomly
  let minesPlaced = 0;
  while (minesPlaced < MINES) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    if (!grid[row][col].hasMine) {
      grid[row][col].hasMine = true;
      minesPlaced++;
    }
  }

  // Calculate adjacent mine counts
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col].hasMine) continue;
      let count = 0;
      for (const [dr, dc] of directions) {
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c].hasMine) {
          count++;
        }
      }
      grid[row][col].adjacentMines = count;
    }
  }

  return grid;
}

export default function Minesweeper({ onBack, profile, onUpdateProfile }: MinesweeperProps) {
  const [grid, setGrid] = useState<Cell[][]>(() => generateGrid());
  const [status, setStatus] = useState("Click a cell to start!");
  const [gameOver, setGameOver] = useState(false);

  const revealCell = (row: number, col: number) => {
    if (gameOver || grid[row][col].flagged || grid[row][col].revealed) return;
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));

    const reveal = (r: number, c: number) => {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || newGrid[r][c].revealed || newGrid[r][c].flagged) return;
      newGrid[r][c].revealed = true;
      if (newGrid[r][c].adjacentMines === 0 && !newGrid[r][c].hasMine) {
        directions.forEach(([dr, dc]) => reveal(r + dr, c + dc));
      }
    };

    if (newGrid[row][col].hasMine) {
      newGrid[row][col].revealed = true;
      setStatus("Boom! You hit a mine.");
      setGameOver(true);
    } else {
      reveal(row, col);
      setStatus("Keep going!");
    }
    setGrid(newGrid);
  };

  const toggleFlag = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (gameOver || grid[row][col].revealed) return;
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    newGrid[row][col].flagged = !newGrid[row][col].flagged;
    setGrid(newGrid);
  };

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-2">Minesweeper</h2>
      <p>{status}</p>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, 2.5rem)` }}>
        {grid.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <button
              key={`${rIdx}-${cIdx}`}
              className={`w-10 h-10 border text-sm font-bold flex items-center justify-center
                ${cell.revealed ? (cell.hasMine ? 'bg-red-600' : 'bg-gray-500') : 'bg-gray-700'}
                ${cell.flagged && !cell.revealed ? 'text-yellow-400' : 'text-white'}`}
              onClick={() => revealCell(rIdx, cIdx)}
              onContextMenu={(e) => toggleFlag(e, rIdx, cIdx)}
            >
              {cell.revealed
                ? (cell.hasMine ? '💣' : (cell.adjacentMines > 0 ? cell.adjacentMines : ''))
                : (cell.flagged ? '🚩' : '')}
            </button>
          ))
        )}
      </div>
      <button className="mt-4 pixel-btn" onClick={onBack}>Back</button>
    </div>
  );
}
