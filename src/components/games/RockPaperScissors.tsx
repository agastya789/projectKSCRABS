import React, { useState } from 'react';
import { Home, RotateCcw } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { saveScore } from '../../utils/gameUtils';
import { PlayerProfile } from '../../types/game';

interface RockPaperScissorsProps {
  onBack: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
}

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'lose' | 'draw';

const choices: { [key in Choice]: { emoji: string; name: string } } = {
  rock: { emoji: '✊', name: 'Rock' },
  paper: { emoji: '✋', name: 'Paper' },
  scissors: { emoji: '✌️', name: 'Scissors' }
};

export default function RockPaperScissors({ onBack, profile, onUpdateProfile }: RockPaperScissorsProps) {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const { playClick, playWin, playLose, playSound } = useSound();

  const getRandomChoice = (): Choice => {
    const choiceArray: Choice[] = ['rock', 'paper', 'scissors'];
    return choiceArray[Math.floor(Math.random() * choiceArray.length)];
  };

  const determineWinner = (player: Choice, computer: Choice): Result => {
    if (player === computer) return 'draw';
    
    const winConditions = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper'
    };
    
    return winConditions[player] === computer ? 'win' : 'lose';
  };

  const playGame = (choice: Choice) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setPlayerChoice(choice);
    playClick();
    
    // Animate the selection
    setTimeout(() => {
      const compChoice = getRandomChoice();
      setComputerChoice(compChoice);
      
      const gameResult = determineWinner(choice, compChoice);
      setResult(gameResult);
      
      const newScore = { ...score };
      let points = 0;
      
      if (gameResult === 'win') {
        newScore.wins++;
        points = 10;
        playWin();
      } else if (gameResult === 'lose') {
        newScore.losses++;
        playLose();
      } else {
        newScore.draws++;
        points = 5;
        playSound(500, 200);
      }
      
      setScore(newScore);
      
      if (points > 0) {
        saveScore('rps', {
          playerName: profile.username,
          score: newScore.wins * 10 + newScore.draws * 5,
          date: new Date().toISOString(),
          avatar: profile.avatar
        });
        onUpdateProfile({
          ...profile,
          totalScore: profile.totalScore + points,
          gamesPlayed: profile.gamesPlayed + 1
        });
      } else {
        onUpdateProfile({
          ...profile,
          gamesPlayed: profile.gamesPlayed + 1
        });
      }
      
      setIsPlaying(false);
    }, 1000);
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setIsPlaying(false);
    playClick();
  };

  const resetScore = () => {
    setScore({ wins: 0, losses: 0, draws: 0 });
    resetGame();
    playClick();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="pixel-btn pixel-btn-secondary p-2">
            <Home size={20} />
          </button>
          <h1 className="pixel-text text-xl text-pixel-green">ROCK PAPER SCISSORS</h1>
          <button onClick={resetGame} className="pixel-btn p-2">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="pixel-panel p-6 mb-4">
          <div className="flex justify-between mb-6 pixel-text text-sm">
            <span className="text-pixel-green">Wins: {score.wins}</span>
            <span className="text-pixel-yellow">Draws: {score.draws}</span>
            <span className="text-pixel-red">Losses: {score.losses}</span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <h3 className="pixel-text text-sm mb-2 text-pixel-green">You</h3>
              <div className="pixel-panel p-4 h-24 flex items-center justify-center">
                <span className="text-4xl">
                  {playerChoice ? choices[playerChoice].emoji : '?'}
                </span>
              </div>
            </div>
            <div className="text-center">
              <h3 className="pixel-text text-sm mb-2 text-pixel-red">Computer</h3>
              <div className="pixel-panel p-4 h-24 flex items-center justify-center">
                <span className="text-4xl">
                  {computerChoice ? choices[computerChoice].emoji : '?'}
                </span>
              </div>
            </div>
          </div>

          {result && (
            <div className="text-center mb-6">
              <div className={`pixel-text text-lg mb-2 ${
                result === 'win' ? 'text-pixel-green' : 
                result === 'lose' ? 'text-pixel-red' : 'text-pixel-yellow'
              }`}>
                {result === 'win' && 'You Win!'}
                {result === 'lose' && 'Computer Wins!'}
                {result === 'draw' && "It's a Draw!"}
              </div>
              <div className="pixel-text text-sm">
                {playerChoice && computerChoice && (
                  <>
                    {choices[playerChoice].name} vs {choices[computerChoice].name}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-4">
            {Object.entries(choices).map(([key, choice]) => (
              <button
                key={key}
                onClick={() => playGame(key as Choice)}
                disabled={isPlaying}
                className="pixel-btn pixel-btn-primary p-4 flex flex-col items-center gap-2 disabled:opacity-50"
              >
                <span className="text-3xl">{choice.emoji}</span>
                <span className="pixel-text text-xs">{choice.name}</span>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button onClick={resetScore} className="pixel-btn">
              Reset Score
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}