type PowerUpsPreviewProps = {
  isVisible: boolean;
  onClose: () => void;
};

export const PowerUpsPreview = ({ isVisible, onClose }: PowerUpsPreviewProps) => {
  if (!isVisible) return null;

  const powerUps = [
    { name: 'Shield', icon: '🛡️', description: 'Temporary invincibility', status: 'Coming Soon' },
    { name: 'Speed Boost', icon: '⚡', description: 'Move faster for 10 seconds', status: 'Coming Soon' },
    { name: 'Slow Motion', icon: '🐌', description: 'Slow down all enemies', status: 'Coming Soon' },
    { name: 'Double Jump', icon: '🦘', description: 'Jump twice in mid-air', status: 'Coming Soon' },
    { name: 'Magnet', icon: '🧲', description: 'Attract score bonuses', status: 'Coming Soon' },
    { name: 'Ghost Mode', icon: '👻', description: 'Phase through obstacles', status: 'Coming Soon' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">⚡ Power-Ups Preview</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3 mb-4">
          {powerUps.map((powerUp, index) => (
            <div
              key={index}
              className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm border border-white border-opacity-30"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{powerUp.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold">{powerUp.name}</div>
                  <div className="text-sm opacity-90">{powerUp.description}</div>
                </div>
                <div className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-medium">
                  {powerUp.status}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold mb-2">
            🚀 Coming in Next Update!
          </div>
          <p className="text-sm opacity-90">
            These awesome power-ups will make your gameplay even more exciting!
          </p>
        </div>
      </div>
    </div>
  );
};
