import { useState, useCallback } from 'react';

export function useSound() {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('soundMuted') === 'true';
  });

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('soundMuted', newMutedState.toString());
  }, [isMuted]);

  const playSound = useCallback((frequency: number, duration: number = 100) => {
    if (isMuted) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [isMuted]);

  const playClick = useCallback(() => playSound(800, 50), [playSound]);
  const playWin = useCallback(() => {
    playSound(523, 150);
    setTimeout(() => playSound(659, 150), 150);
    setTimeout(() => playSound(784, 300), 300);
  }, [playSound]);
  const playLose = useCallback(() => {
    playSound(300, 150);
    setTimeout(() => playSound(250, 150), 150);
    setTimeout(() => playSound(200, 300), 300);
  }, [playSound]);

  return { isMuted, toggleMute, playClick, playWin, playLose, playSound };
}