import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Trophy } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { saveScore } from '../../utils/gameUtils';
import { PlayerProfile } from '../../types/game';

interface MemoryFlipProps {
  onBack: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
}

const emojis = ['🎮', '👾', '🤖', '👻', '🕹️', '⚡', '🌟', '💫'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryFlip({ onBack, profile, onUpdateProfile }: MemoryFlipProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const { playClick, playWin, playSound } = useSound();

  const shuffleCards = useCallback(() => {
    const shuffledEmojis = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));
    setCards(shuffledEmojis);
  }, []);

  useEffect(() => {
    shuffleCards();
  }, [shuffleCards]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !isGameComplete) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, isGameComplete]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.emoji === secondCard.emoji) {
        playSound(659, 100);
        setCards(prev => prev.map(card => 
          card.id === first || card.id === second 
            ? { ...card, isMatched: true }
            : card
        ));
        setMatches(prev => prev + 1);
        setFlippedCards([]);

        if (matches + 1 === emojis.length) {
          setIsGameComplete(true);
          playWin();
          const finalScore = Math.max(1000 - (moves * 10) - (timeElapsed * 5), 100);
          saveScore('memory', {
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
      } else {
        playSound(300, 150);
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, cards, matches, moves, timeElapsed, playSound, playWin, profile, onUpdateProfile]);

  const handleCardClick = (cardId: number) => {
    if (!gameStarted) setGameStarted(true);
    
    const card = cards[cardId];
    if (card.isFlipped || card.isMatched || flippedCards.length === 2) return;

    playClick();
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    setFlippedCards(prev => [...prev, cardId]);
    
    if (flippedCards.length === 1) {
      setMoves(prev => prev + 1);
    }
  };

  const resetGame = () => {
    shuffleCards();
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setIsGameComplete(false);
    setTimeElapsed(0);
    setGameStarted(false);
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
          <h1 className="pixel-text text-2xl text-pixel-green">MEMORY FLIP</h1>
          <button onClick={resetGame} className="pixel-btn p-2">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="pixel-panel p-4 mb-4">
          <div className="flex justify-between pixel-text text-sm mb-4">
            <span>Moves: {moves}</span>
            <span>Time: {formatTime(timeElapsed)}</span>
            <span>Matches: {matches}/{emojis.length}</span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`pixel-btn aspect-square text-2xl flex items-center justify-center h-16 transition-all duration-300 ${
                  card.isMatched ? 'border-pixel-green bg-green-900/30' : ''
                } ${card.isFlipped || card.isMatched ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                {card.isFlipped || card.isMatched ? card.emoji : '?'}
              </button>
            ))}
          </div>

          {isGameComplete && (
            <div className="text-center">
              <div className="pixel-text text-lg mb-2 text-pixel-green flex items-center justify-center gap-2">
                <Trophy size={20} />
                Congratulations!
              </div>
              <div className="pixel-text text-sm mb-4">
                <div>Time: {formatTime(timeElapsed)}</div>
                <div>Moves: {moves}</div>
                <div className="text-pixel-yellow">
                  Score: {Math.max(1000 - (moves * 10) - (timeElapsed * 5), 100)}
                </div>
              </div>
              <button onClick={resetGame} className="pixel-btn pixel-btn-primary">
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}