import { useEffect, useState } from 'react';
import { navigateTo } from '@devvit/web/client';
import { useCounter } from './hooks/useCounter';
import { useGameScore } from './hooks/useGameScore';
import { Game } from './components/Game';
import { Leaderboard } from './components/Leaderboard';
import { GameInstructions } from './components/GameInstructions';
import { GameIntro } from './components/GameIntro';
import { PowerUpsPreview } from './components/PowerUpsPreview';
import { GameLevel } from '../shared/types/game';

export const App = () => {
  const { username, loading } = useCounter();
  const { highScore, saveScore, getHighScore } = useGameScore();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

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
            <div className="flex flex-wrap gap-1 sm:gap-2 order-2 sm:order-1 justify-center sm:justify-start">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="group relative px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs sm:text-sm hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 border border-blue-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <span className="relative">🏆 Leaderboard</span>
              </button>
              <button
                onClick={() => setShowInstructions(true)}
                className="group relative px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs sm:text-sm hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300 border border-green-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <span className="relative">❓ How to Play</span>
              </button>
              <button
                onClick={() => setShowPowerUps(true)}
                className="group relative px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-xs sm:text-sm hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 border border-purple-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <span className="relative">⚡ Power-Ups</span>
              </button>
              <button
                disabled
                className="relative px-3 py-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg text-xs sm:text-sm opacity-70 cursor-not-allowed border border-gray-300"
              >
                <span className="relative">🎨 Custom Level</span>
                <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs px-1 rounded-full font-bold">
                  Soon
                </div>
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

      <PowerUpsPreview isVisible={showPowerUps} onClose={() => setShowPowerUps(false)} />

      <GameIntro isVisible={showIntro && !loading} onComplete={() => setShowIntro(false)} />

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
