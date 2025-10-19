type GameInstructionsProps = {
  isVisible: boolean;
  onClose: () => void;
};

export const GameInstructions = ({ isVisible, onClose }: GameInstructionsProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">How to Play</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">🎯 Objective</h3>
            <p>Control the orange chibi character and avoid the green snakes for as long as possible!</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">🎮 Controls</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Tap the game area to make the chibi jump</li>
              <li>Press SPACE or UP arrow key to jump</li>
              <li>The character falls due to gravity</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">📊 Difficulty Levels</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><span className="text-green-600 font-medium">Easy:</span> 2 slow snakes</li>
              <li><span className="text-yellow-600 font-medium">Medium:</span> 4 medium-speed snakes</li>
              <li><span className="text-red-600 font-medium">Hard:</span> 6 fast snakes</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">🏆 Scoring</h3>
            <p>Earn 10 points each time a snake passes you. Your high score is saved automatically!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
