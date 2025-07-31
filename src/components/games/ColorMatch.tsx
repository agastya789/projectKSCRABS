import React, { useState, useEffect, useCallback } from 'react';
import { Home, RotateCcw } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { saveScore } from '../../utils/gameUtils';
import { PlayerProfile } from '../../types/game';

interface ColorMatchProps {
  onBack: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
}

const colors = [
  { name: 'RED', color: '#ff073a', key: 'R' },
  { name: 'GREEN', color: '#00ff41', key: 'G' },
  { name: 'BLUE', color: '#00bfff', key: 'B' },
  { name: 'YELLOW', color: '#ffd700', key: 'Y' },
  { name: 'PURPLE', color: '#da70d6', key: 'P' },
  { name: 'ORANGE', color: '#ff8c00', key: 'O' }
];

export default function ColorMatch({ onBack, profile, onUpdateProfile }: ColorMatchProps) {
  const [currentColor, setCurrentColor] = useState(colors[0]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [round, setRound] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [roundTimeLimit, setRoundTimeLimit] = useState(3);
  const [roundTimeLeft, setRoundTimeLeft] = useState(3);
  const { playClick, playWin, playLose, playSound } = useSound();

  const getRandomColor = useCallback(() => {
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const nextColor = useCallback(() => {
    setCurrentColor(getRandomColor());
    setRoundTimeLeft(roundTimeLimit);
  }, [getRandomColor, roundTimeLimit]);

  const handleKeyPress = useCallback((key: string) => {
    if (!gameStarted || gameOver) return;

    const correctKey = currentColor.key.toLowerCase();
    if (key.toLowerCase() === correctKey) {
      const points = Math.max(10, roundTimeLeft * 5 + streak * 2);
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      playSound(800 + streak * 100, 100);
      nextColor();
    } else {
      setStreak(0);
      playSound(300, 200);
      // Small time penalty for wrong answer
      setRoundTimeLeft(prev => Math.max(0, prev - 0.5));
    }
  }, [gameStarted, gameOver, currentColor.key, roundTimeLeft, streak, playSound, nextColor]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyPress(event.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameOver && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver(true);
            playLose();
            
            saveScore('color', {
              playerName: profile.username,
              score: score,
              date: new Date().toISOString(),
              avatar: profile.avatar
            });
            
            onUpdateProfile({
              ...profile,
              totalScore: profile.totalScore + score,
              gamesPlayed: profile.gamesPlayed + 1
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, timeLeft, score, playLose, profile, onUpdateProfile]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameOver && roundTimeLeft > 0) {
      interval = setInterval(() => {
        setRoundTimeLeft(prev => {
          if (prev <= 0.1) {
            setStreak(0);
            nextColor();
            return roundTimeLimit;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, roundTimeLeft, roundTimeLimit, nextColor]);

  useEffect(() => {
    // Increase difficulty every 10 points
    const newRound = Math.floor(score / 100) + 1;
    if (newRound > round) {
      setRound(newRound);
      setRoundTimeLimit(prev => Math.max(1, prev - 0.2));
      playWin();
    }
  }, [score, round, playWin]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setRound(1);
    setStreak(0);
    setRoundTimeLimit(3);
    setRoundTimeLeft(3);
    setGameStarted(true);
    setGameOver(false);
    setCurrentColor(getRandomColor());
    playClick();
  };

  const resetGame = () => {
    setScore(0);
    setTimeLeft(30);
    setRound(1);
    setStreak(0);
    setRoundTimeLimit(3);
    setRoundTimeLeft(3);
    setGameStarted(false);
    setGameOver(false);
    setCurrentColor(colors[0]);
    playClick();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="pixel-btn pixel-btn-secondary p-2">
            <Home size={20} />
          </button>
          <h1 className="pixel-text text-2xl text-pixel-green">COLOR MATCH</h1>
          <button onClick={resetGame} className="pixel-btn p-2">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="pixel-panel p-6 mb-4">
          <div className="flex justify-between pixel-text text-sm mb-6">
            <span>Score: {score}</span>
            <span>Time: {timeLeft}s</span>
            <span>Round: {round}</span>
          </div>

          {gameStarted && !gameOver && (
            <>
              <div className="text-center mb-6">
                <div 
                  className="w-32 h-32 mx-auto rounded-lg border-4 border-white mb-4 flex items-center justify-center"
                  style={{ backgroundColor: currentColor.color }}
                >
                  <span className="pixel-text text-2xl text-white font-bold drop-shadow-lg">
                    {currentColor.name}
                  </span>
                </div>
                
                <div className="pixel-text text-lg mb-2">
                  Press <span className="text-pixel-yellow">{currentColor.key}</span> for {currentColor.name}
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-pixel-green h-2 rounded-full transition-all duration-100"
                    style={{ width: `${(roundTimeLeft / roundTimeLimit) * 100}%` }}
                  ></div>
                </div>
                
                {streak > 0 && (
                  <div className="pixel-text text-sm text-pixel-yellow">
                    Streak: {streak} 🔥
                  </div>
                )}
              </div>
            </>
          )}

          {gameOver && (
            <div className="text-center mb-6">
              <div className="pixel-text text-lg mb-2 text-pixel-red">Time's Up!</div>
              <div className="pixel-text text-sm mb-4">
                <div>Final Score: {score}</div>
                <div>Best Streak: {streak}</div>
                <div>Rounds Completed: {round}</div>
              </div>
              <button onClick={startGame} className="pixel-btn pixel-btn-primary">
                Play Again
              </button>
            </div>
          )}

          {!gameStarted && !gameOver && (
            <div className="text-center">
              <button onClick={startGame} className="pixel-btn pixel-btn-primary mb-6">
                Start Game
              </button>
              
              <div className="pixel-text text-sm mb-4">
                Match colors with keyboard keys:
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {colors.map((color) => (
                  <div key={color.name} className="flex items-center gap-2 pixel-text text-xs">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color.color }}
                    ></div>
                    <span>{color.name} = {color.key}</span>
                  </div>
                ))}
              </div>
              
              <div className="pixel-text text-xs text-gray-400">
                React quickly! Time gets shorter each round.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}