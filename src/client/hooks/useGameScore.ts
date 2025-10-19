import { useState, useCallback } from 'react';
import { GameLevel } from '../../shared/types/game';
import { GameScoreResponse, SaveScoreRequest } from '../../shared/types/api';

export const useGameScore = () => {
  const [highScore, setHighScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const saveScore = useCallback(async (score: number, level: GameLevel): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('/api/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score,
          level,
        } as SaveScoreRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to save score');
      }

      const data: GameScoreResponse = await response.json();
      setHighScore(data.highScore);
    } catch (error) {
      console.error('Error saving score:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getHighScore = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('/api/high-score');
      
      if (!response.ok) {
        throw new Error('Failed to get high score');
      }

      const data: GameScoreResponse = await response.json();
      setHighScore(data.highScore);
    } catch (error) {
      console.error('Error getting high score:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    highScore,
    loading,
    saveScore,
    getHighScore,
  };
};
