import { useEffect, useState } from 'react';
import { navigateTo } from '@devvit/web/client';
import { useCounter } from './hooks/useCounter';
import { useGameScore } from './hooks/useGameScore';
import { Game } from './components/Game';
import { Leaderboard } from './components/Leaderboard';
import { GameInstructions } from './components/GameInstructions';
import { GameLevel } from '../shared/types/game';

export const App = () => {
  const { username, loading } = useCounter();
  const { highScore, saveScore, getHighScore } = useGameScore();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    getHighScore();
  }, [getHighScore]);

  const handleScoreUpdate = (score: number, level: GameLevel) => {
    saveScore(score, level);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-2 sm:gap-4 bg-gray-50 p-2">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-2 sm:mb-4 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-2">
            <div className="flex gap-1 sm:gap-2 order-2 sm:order-1">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-500 text-white rounded text-xs sm:text-sm hover:bg-blue-600"
              >
                Leaderboard
              </button>
              <button
                onClick={() => setShowInstructions(true)}
                className="px-2 py-1 sm:px-3 sm:py-1 bg-green-500 text-white rounded text-xs sm:text-sm hover:bg-green-600"
              >
                How to Play
              </button>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 order-1 sm:order-2">Snake Dodge</h1>
            <div className="text-center sm:text-right order-3">
              <div className="text-xs sm:text-sm text-gray-600">High Score</div>
              <div className="text-sm sm:text-lg font-bold text-orange-600">{highScore}</div>
            </div>
          </div>
        </div>

        <Game username={username || 'Player'} onScoreUpdate={handleScoreUpdate} />
      </div>

      <Leaderboard isVisible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

      <GameInstructions isVisible={showInstructions} onClose={() => setShowInstructions(false)} />

      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 text-[0.8em] text-gray-600">
        <button
          className="cursor-pointer hover:text-gray-800"
          onClick={() => navigateTo('https://developers.reddit.com/docs')}
        >
          Docs
        </button>
        <span className="text-gray-300">|</span>
        <button
          className="cursor-pointer hover:text-gray-800"
          onClick={() => navigateTo('https://www.reddit.com/r/Devvit')}
        >
          r/Devvit
        </button>
        <span className="text-gray-300">|</span>
        <button
          className="cursor-pointer hover:text-gray-800"
          onClick={() => navigateTo('https://discord.com/invite/R7yu2wh9Qz')}
        >
          Discord
        </button>
      </footer>
    </div>
  );
};
