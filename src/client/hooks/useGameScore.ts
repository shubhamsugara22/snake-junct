import { useState, useCallback } from 'react';
import { GameLevel } from '../../shared/types/game';
import { GameScoreResponse, SaveScoreRequest } from '../../shared/types/api';

export const useGameScore = () => {
  const [highScore, setHighScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const saveScore = useCallback(async (score: number, level: GameLevel): Promise<void> => {
    console.log(`Attempting to save score: ${score}, level: ${level}`);
    setLoading(true);
    try {
      const requestBody: SaveScoreRequest = {
        score,
        level,
      };
      
      console.log('Sending request to /api/save-score with body:', requestBody);
      
      const response = await fetch('/api/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', response.status, errorText);
        throw new Error(`Failed to save score: ${response.status} ${errorText}`);
      }

      const data: GameScoreResponse = await response.json();
      console.log('Score saved successfully:', data);
      setHighScore(data.highScore);
    } catch (error) {
      console.error('Error saving score:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const getHighScore = useCallback(async (): Promise<void> => {
    console.log('Fetching high score...');
    setLoading(true);
    try {
      const response = await fetch('/api/high-score');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', response.status, errorText);
        throw new Error(`Failed to get high score: ${response.status}`);
      }

      const data: GameScoreResponse = await response.json();
      console.log('High score fetched:', data.highScore);
      setHighScore(data.highScore);
    } catch (error) {
      console.error('Error getting high score:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
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
