import { GameScore } from '../types/game';

export const saveScore = (gameId: string, score: GameScore) => {
  const scores = getScores(gameId);
  scores.push(score);
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(`scores_${gameId}`, JSON.stringify(scores.slice(0, 10)));
};

export const getScores = (gameId: string): GameScore[] => {
  try {
    const scores = localStorage.getItem(`scores_${gameId}`);
    return scores ? JSON.parse(scores) : [];
  } catch {
    return [];
  }
};

export const getHighScore = (gameId: string): number => {
  const scores = getScores(gameId);
  return scores.length > 0 ? scores[0].score : 0;
};

export const formatScore = (score: number): string => {
  return score.toString().padStart(6, '0');
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};