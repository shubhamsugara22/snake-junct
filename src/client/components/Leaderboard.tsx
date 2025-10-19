import { useState, useEffect } from 'react';

type LeaderboardEntry = {
  username: string;
  score: number;
  timestamp: number;
};

type LeaderboardProps = {
  isVisible: boolean;
  onClose: () => void;
};

export const Leaderboard = ({ isVisible, onClose }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      fetchLeaderboard();
    }
  }, [isVisible]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Leaderboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No scores yet!</div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div
                key={`${entry.username}-${entry.timestamp}`}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-600">#{index + 1}</span>
                  <span className="font-medium">{entry.username}</span>
                </div>
                <span className="font-bold text-blue-600">{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
