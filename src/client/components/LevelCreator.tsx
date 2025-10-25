import { useState } from 'react';
import { CustomLevel } from '../../shared/types/game';

type LevelCreatorProps = {
  isVisible: boolean;
  onClose: () => void;
  onCreateLevel: (level: CustomLevel) => void;
};

export const LevelCreator = ({ isVisible, onClose, onCreateLevel }: LevelCreatorProps) => {
  const [levelName, setLevelName] = useState('My Custom Level');
  const [snakeCount, setSnakeCount] = useState(3);
  const [obstacleCount, setObstacleCount] = useState(2);
  const [playerSkin, setPlayerSkin] = useState<'default' | 'cool' | 'ninja'>('default');
  const [difficulty, setDifficulty] = useState(2);

  const handleCreate = () => {
    const customLevel: CustomLevel = {
      name: levelName,
      snakeCount,
      obstacleCount,
      playerSkin,
      difficulty,
    };
    onCreateLevel(customLevel);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-purple-600">🎮 Create Your Level</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Level Name</label>
            <input
              type="text"
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter level name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Snake Count: {snakeCount}</label>
            <input
              type="range"
              min="1"
              max="8"
              value={snakeCount}
              onChange={(e) => setSnakeCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Obstacles: {obstacleCount}</label>
            <input
              type="range"
              min="0"
              max="5"
              value={obstacleCount}
              onChange={(e) => setObstacleCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Difficulty: {difficulty}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Character Skin</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPlayerSkin('default')}
                className={`px-3 py-2 rounded text-sm ${
                  playerSkin === 'default'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🧡 Default
              </button>
              <button
                onClick={() => setPlayerSkin('cool')}
                className={`px-3 py-2 rounded text-sm ${
                  playerSkin === 'cool'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                😎 Cool
              </button>
              <button
                onClick={() => setPlayerSkin('ninja')}
                className={`px-3 py-2 rounded text-sm ${
                  playerSkin === 'ninja'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🥷 Ninja
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleCreate}
              className="flex-1 bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 font-medium"
            >
              Create Level
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
