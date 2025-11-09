type SettingsMenuProps = {
  isVisible: boolean;
  onClose: () => void;
  soundVolume: number;
  onVolumeChange: (volume: number) => void;
};

export const SettingsMenu = ({ isVisible, onClose, soundVolume, onVolumeChange }: SettingsMenuProps) => {
  if (!isVisible) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
    localStorage.setItem('soundVolume', newVolume.toString());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900">
          ⚙️ Settings
        </h2>

        <div className="space-y-6">
          {/* Sound Volume */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              🔊 Sound Volume
            </label>
            <div className="flex items-center gap-4">
              <span className="text-2xl">🔇</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={soundVolume}
                onChange={handleVolumeChange}
                className="flex-1 h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="text-2xl">🔊</span>
            </div>
            <p className="text-center text-gray-600 mt-2 font-bold">
              {Math.round(soundVolume * 100)}%
            </p>
          </div>

          {/* Game Info */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
            <h3 className="text-lg font-bold text-blue-900 mb-2">ℹ️ Game Info</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <p>• AI adapts difficulty to your skill</p>
              <p>• Boss battles at 100 & 250 points</p>
              <p>• Halloween special event active!</p>
            </div>
          </div>

          {/* Controls Reminder */}
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
            <h3 className="text-lg font-bold text-green-900 mb-2">🎮 Controls</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <p>• SPACE / ↑ - Jump</p>
              <p>• ESC / P - Pause</p>
              <p>• Click/Tap - Jump</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          ✓ Done
        </button>
      </div>
    </div>
  );
};
