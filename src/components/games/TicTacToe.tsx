import React, { useState, useCallback } from 'react';
import { RotateCcw, Home } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { saveScore } from '../../utils/gameUtils';
import { PlayerProfile } from '../../types/game';

interface TicTacToeProps {
  onBack: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
}

type Player = 'X' | 'O' | null;
type Board = Player[];

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6] // diagonals
];

export default function TicTacToe({ onBack, profile, onUpdateProfile }: TicTacToeProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
  const { playClick, playWin, playLose } = useSound();

  const checkWinner = useCallback((board: Board): Player | 'draw' | null => {
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (board.every(cell => cell !== null)) {
      return 'draw';
    }
    return null;
  }, []);

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    playClick();
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      const newScore = { ...score };
      
      if (gameWinner === 'X') {
        newScore.X++;
        playWin();
        // Save score for player wins
        saveScore('tictactoe', {
          playerName: profile.username,
          score: newScore.X,
          date: new Date().toISOString(),
          avatar: profile.avatar
        });
        onUpdateProfile({
          ...profile,
          totalScore: profile.totalScore + 10,
          gamesPlayed: profile.gamesPlayed + 1
        });
      } else if (gameWinner === 'O') {
        newScore.O++;
        playLose();
        onUpdateProfile({
          ...profile,
          gamesPlayed: profile.gamesPlayed + 1
        });
      } else {
        newScore.draws++;
        onUpdateProfile({
          ...profile,
          totalScore: profile.totalScore + 5,
          gamesPlayed: profile.gamesPlayed + 1
        });
      }
      
      setScore(newScore);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    playClick();
  };

  const resetScore = () => {
    setScore({ X: 0, O: 0, draws: 0 });
    playClick();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="pixel-btn pixel-btn-secondary p-2">
            <Home size={20} />
          </button>
          <h1 className="pixel-text text-2xl text-pixel-green">TIC TAC TOE</h1>
          <button onClick={resetGame} className="pixel-btn p-2">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="pixel-panel p-6 mb-4">
          <div className="flex justify-between mb-4 pixel-text text-sm">
            <span className="text-pixel-green">X: {score.X}</span>
            <span className="text-pixel-yellow">Draws: {score.draws}</span>
            <span className="text-pixel-red">O: {score.O}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                className="pixel-btn aspect-square text-3xl pixel-text flex items-center justify-center h-20 hover:bg-gray-700 transition-colors"
                disabled={!!cell || !!winner}
              >
                <span className={cell === 'X' ? 'text-pixel-green' : 'text-pixel-red'}>
                  {cell}
                </span>
              </button>
            ))}
          </div>

          {winner && (
            <div className="text-center mb-4">
              <div className="pixel-text text-lg mb-2">
                {winner === 'draw' ? (
                  <span className="text-pixel-yellow">It's a Draw!</span>
                ) : (
                  <span className={winner === 'X' ? 'text-pixel-green' : 'text-pixel-red'}>
                    {winner === 'X' ? 'You Win!' : 'Computer Wins!'}
                  </span>
                )}
              </div>
              <button onClick={resetGame} className="pixel-btn pixel-btn-primary">
                Play Again
              </button>
            </div>
          )}

          {!winner && (
            <div className="text-center pixel-text">
              Current Player: 
              <span className={currentPlayer === 'X' ? 'text-pixel-green' : 'text-pixel-red'}>
                {' '}{currentPlayer === 'X' ? 'You (X)' : 'Computer (O)'}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={resetScore} className="pixel-btn flex-1">
            Reset Score
          </button>
        </div>
      </div>
    </div>
  );
}