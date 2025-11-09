type PauseMenuProps = {
  isVisible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onQuit: () => void;
};

export const PauseMenu = ({ isVisible, onResume, onRestart, onSettings, onQuit }: PauseMenuProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
        <h2 className="text-4xl font-bold text-center mb-8 text-gray-900">
          ⏸️ PAUSED
        </h2>

        <div className="space-y-4">
          <button
            onClick={onResume}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300"
          >
            ▶️ Resume Game
          </button>

          <button
            onClick={onRestart}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300"
          >
            🔄 Restart Level
          </button>

          <button
            onClick={onSettings}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
          >
            ⚙️ Settings
          </button>

          <button
            onClick={onQuit}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-red-500/50 transform hover:scale-105 transition-all duration-300"
          >
            🚪 Quit to Menu
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Press ESC or P to resume
        </p>
      </div>
    </div>
  );
};
