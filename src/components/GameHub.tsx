import React, { useState } from 'react';
import { Trophy, Settings, Volume2, VolumeX, Moon, Sun } from 'lucide-react';
import { Game, PlayerProfile } from '../types/game';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSound } from '../hooks/useSound';
import { getHighScore } from '../utils/gameUtils';
import UserProfile from './UserProfile';
import TicTacToe from './games/TicTacToe';
import MemoryFlip from './games/MemoryFlip';
import RockPaperScissors from './games/RockPaperScissors';
import DinoRunner from './games/DinoRunner';
import MazeRunner from './games/MazeRunner';
import BubblePopBlitz from './games/BubblePopBlitz';
import BrickBreaker from './games/BrickBreaker';
import ColorMatch from './games/ColorMatch';
import AlienInvaders from './games/AlienInvaders';
import FallingBlocks from './games/FallingBlocks';
import Minesweeper from './games/Minesweeper';

const games: Game[] = [
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe',
    description: 'Classic strategy game',
    icon: '⭕',
    color: 'from-blue-600 to-blue-800'
  },
  {
    id: 'memory',
    title: 'Memory Flip',
    description: 'Match the pairs',
    icon: '🧠',
    color: 'from-purple-600 to-purple-800'
  },
  {
    id: 'dino',
    title: 'Dino Runner',
    description: 'Jump over obstacles',
    icon: '🦖',
    color: 'from-green-600 to-green-800'
  },
  {
    id: 'rps',
    title: 'Rock Paper Scissors',
    description: 'Beat the computer',
    icon: '✊',
    color: 'from-red-600 to-red-800'
  },
  {
    id: 'maze',
    title: 'Maze Runner',
    description: 'Navigate the labyrinth',
    icon: '🏃',
    color: 'from-yellow-600 to-yellow-800'
  },
  {
    id: 'bubble',
    title: 'Bubble Pop Blitz',
    description: 'Pop floating bubbles',
    icon: '🫧',
    color: 'from-cyan-600 to-cyan-800'
  },
  {
    id: 'brick',
    title: 'Brick Breaker',
    description: 'Break all the bricks',
    icon: '🧱',
    color: 'from-orange-600 to-orange-800'
  },
  {
    id: 'color',
    title: 'Color Match',
    description: 'Quick color matching',
    icon: '🎨',
    color: 'from-pink-600 to-pink-800'
  },
  {
    id: 'invaders',
    title: 'Alien Invaders',
    description: 'Defend from aliens',
    icon: '👾',
    color: 'from-indigo-600 to-indigo-800'
  },
  {
    id: 'blocks',
    title: 'Falling Blocks',
    description: 'Tetris-style puzzle',
    icon: '🟦',
    color: 'from-teal-600 to-teal-800'
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    description: "Test your luck",
    icon: '💣',
    color: 'from-red-600 to-red-800'
  }
];

interface GameHubProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function GameHub({ isDarkMode, toggleDarkMode }: GameHubProps) {
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { isMuted, toggleMute, playClick } = useSound();
  
  const [profile, setProfile] = useLocalStorage<PlayerProfile>('playerProfile', {
    username: 'Player',
    avatar: '🎮',
    totalScore: 0,
    gamesPlayed: 0
  });

  const handleGameSelect = (gameId: string) => {
    setCurrentGame(gameId);
    playClick();
  };

  const handleBackToHub = () => {
    setCurrentGame(null);
    playClick();
  };

  const renderGame = () => {
    const gameProps = {
      onBack: handleBackToHub,
      profile,
      onUpdateProfile: setProfile
    };

    switch (currentGame) {
      case 'tictactoe':
        return <TicTacToe {...gameProps} />;
      case 'memory':
        return <MemoryFlip {...gameProps} />;
      case 'dino':
        return <DinoRunner {...gameProps} />;
      case 'rps':
        return <RockPaperScissors {...gameProps} />;
      case 'maze':
        return <MazeRunner {...gameProps} />;
      case 'bubble':
        return <BubblePopBlitz {...gameProps} />;
      case 'brick':
        return <BrickBreaker {...gameProps} />;
      case 'color':
        return <ColorMatch {...gameProps} />;
      case 'invaders':
        return <AlienInvaders {...gameProps} />;
      case 'blocks':
        return <FallingBlocks {...gameProps} />;
      case 'minesweeper':
        return < Minesweeper {...gameProps}/>
      default:
        return null;
    }
  };

  if (currentGame) {
    return renderGame();
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-gradient-to-b from-gray-100 to-gray-300'
    }`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { setShowSettings(!showSettings); playClick(); }}
              className="pixel-btn p-2"
            >
              <Settings size={20} />
            </button>
            
            <h1 className="pixel-text text-4xl md:text-6xl text-pixel-green crt-glow">
              PIXEL QUEST
            </h1>
            
            <div className="flex gap-2">
              <button onClick={toggleMute} className="pixel-btn p-2">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button onClick={toggleDarkMode} className="pixel-btn p-2">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
          
          <p className="pixel-text text-sm md:text-base text-gray-400 mb-2">
            Mini Game Arcade
          </p>
          <div className="pixel-text text-xs text-pixel-yellow animate-pulse">
            ▶ SELECT YOUR QUEST ◀
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="pixel-panel p-4 mb-6">
            <h3 className="pixel-text text-lg mb-4 text-pixel-green">Settings</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="pixel-text">Sound Effects:</span>
                <button onClick={toggleMute} className="pixel-btn px-3 py-1">
                  {isMuted ? 'OFF' : 'ON'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="pixel-text">Theme:</span>
                <button onClick={toggleDarkMode} className="pixel-btn px-3 py-1">
                  {isDarkMode ? 'DARK' : 'LIGHT'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}
        <UserProfile profile={profile} onUpdateProfile={setProfile} />

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {games.map((game) => {
            const highScore = getHighScore(game.id);
            return (
              <div
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className={`pixel-panel game-card p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br ${game.color} relative overflow-hidden group`}
              >
                <div className="relative z-10">
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {game.icon}
                    </div>
                    <h3 className="pixel-text text-xl text-white font-bold mb-1">
                      {game.title}
                    </h3>
                    <p className="pixel-text text-sm text-gray-200">
                      {game.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pixel-text text-xs text-gray-300">
                    <span className="flex items-center gap-1">
                      <Trophy size={14} />
                      Best: {highScore.toLocaleString()}
                    </span>
                    <span className="animate-pulse">PLAY →</span>
                  </div>
                </div>
                
                {/* Animated background */}
                <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center pixel-text text-xs text-gray-500">
          <div className="mb-2">
            Total Score: {profile.totalScore.toLocaleString()} | Games Played: {profile.gamesPlayed}
          </div>
          <div className="animate-pulse">
            ◄ ► ▲ ▼ RETRO GAMING EXPERIENCE ▼ ▲ ◄ ►
          </div>
        </div>
      </div>
    </div>
  );
}