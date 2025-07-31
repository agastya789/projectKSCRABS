export interface GameScore {
  playerName: string;
  score: number;
  date: string;
  avatar: string;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  highScore?: number;
}

export interface PlayerProfile {
  username: string;
  avatar: string;
  totalScore: number;
  gamesPlayed: number;
}