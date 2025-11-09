type TutorialProps = {
  isVisible: boolean;
  onClose: () => void;
};

export const Tutorial = ({ isVisible, onClose }: TutorialProps) => {
  if (!isVisible) return null;

  const handleComplete = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🎮 Welcome to Snake Dodge!
        </h2>

        <div className="space-y-6">
          {/* Basic Controls */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
            <h3 className="text-xl font-bold text-blue-900 mb-3">🕹️ Controls</h3>
            <div className="space-y-2 text-gray-700">
              <p>• <strong>SPACE</strong> or <strong>↑ Arrow</strong> - Jump</p>
              <p>• <strong>ESC</strong> or <strong>P</strong> - Pause Game</p>
              <p>• <strong>Click/Tap</strong> - Also jumps!</p>
            </div>
          </div>

          {/* Objective */}
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
            <h3 className="text-xl font-bold text-green-900 mb-3">🎯 Objective</h3>
            <p className="text-gray-700">
              Dodge snakes, obstacles, and enemies to score points! The longer you survive, the higher your score!
            </p>
          </div>

          {/* Power-Ups */}
          <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
            <h3 className="text-xl font-bold text-purple-900 mb-3">⚡ Power-Ups</h3>
            <div className="space-y-2 text-gray-700">
              <p>• 🛡️ <strong>Shield</strong> - Blocks damage for 20 seconds</p>
              <p>• 🔥 <strong>Fire</strong> - Destroy enemies for 10 seconds</p>
              <p>• 🍬 <strong>Candy</strong> - Both shield + fire!</p>
            </div>
          </div>

          {/* Boss Battles */}
          <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
            <h3 className="text-xl font-bold text-red-900 mb-3">👹 Boss Battles</h3>
            <div className="space-y-2 text-gray-700">
              <p>• 🐙 <strong>Octopus Boss</strong> at 100 points</p>
              <p>• 🦇 <strong>Bat Boss</strong> at 250 points</p>
              <p>• Jump into boss to attack!</p>
              <p>• Dodge their projectiles!</p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
            <h3 className="text-xl font-bold text-yellow-900 mb-3">💡 Pro Tips</h3>
            <div className="space-y-2 text-gray-700">
              <p>• 🤖 AI adapts to your skill level</p>
              <p>• 🎨 Choose different character skins</p>
              <p>• 🏆 Check the leaderboard to compete</p>
              <p>• 🎃 Special Halloween enemies and bosses!</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleComplete}
          className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          Got It! Let's Play! 🚀
        </button>
      </div>
    </div>
  );
};
