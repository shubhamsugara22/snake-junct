import { useState, useEffect } from 'react';

type LeaderboardEntry = {
  username: string;
  score: number;
  timestamp: number;
  level?: string;
  skillLevel?: number;
};

type LeaderboardProps = {
  isVisible: boolean;
  onClose: () => void;
};

type TabType = 'alltime' | 'weekly';

// Custom animations
const leaderboardStyles = `
  @keyframes slide-up {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes trophy-bounce {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-10px) rotate(-5deg); }
    75% { transform: translateY(-5px) rotate(5deg); }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  @keyframes pulse-ring {
    0% {
      transform: scale(0.95);
      opacity: 0.7;
    }
    50% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0.95);
      opacity: 0.7;
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.5s ease-out;
  }
  
  .animate-trophy-bounce {
    animation: trophy-bounce 2s ease-in-out infinite;
  }
  
  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }
  
  .animate-pulse-ring {
    animation: pulse-ring 2s ease-in-out infinite;
  }
  
  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
  .stagger-4 { animation-delay: 0.4s; }
  .stagger-5 { animation-delay: 0.5s; }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('leaderboard-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'leaderboard-styles';
  styleSheet.textContent = leaderboardStyles;
  document.head.appendChild(styleSheet);
}

export const Leaderboard = ({ isVisible, onClose }: LeaderboardProps) => {
  const [allTimeEntries, setAllTimeEntries] = useState<LeaderboardEntry[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('alltime');

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
        setAllTimeEntries(data.entries || []);
        
        // Filter weekly entries (last 7 days)
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const weekly = (data.entries || []).filter((entry: LeaderboardEntry) => 
          entry.timestamp > weekAgo
        );
        setWeeklyEntries(weekly);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `#${index + 1}`;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'from-yellow-400 via-yellow-500 to-yellow-600';
      case 1:
        return 'from-gray-300 via-gray-400 to-gray-500';
      case 2:
        return 'from-orange-400 via-orange-500 to-orange-600';
      default:
        return 'from-blue-400 via-blue-500 to-blue-600';
    }
  };

  const getRankBorder = (index: number) => {
    switch (index) {
      case 0:
        return 'border-yellow-400 shadow-yellow-500/50';
      case 1:
        return 'border-gray-400 shadow-gray-500/50';
      case 2:
        return 'border-orange-400 shadow-orange-500/50';
      default:
        return 'border-blue-300 shadow-blue-500/30';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isVisible) return null;

  const currentEntries = activeTab === 'alltime' ? allTimeEntries : weeklyEntries;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header with enhanced graphics */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6 text-white overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          <div className="absolute inset-0 animate-shimmer"></div>
          
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="text-5xl animate-trophy-bounce drop-shadow-2xl">🏆</span>
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight drop-shadow-lg">Leaderboard</h2>
                <p className="text-sm text-white/90 font-semibold">🎮 Top Players & Champions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center text-4xl font-light transition-all duration-200 hover:rotate-90 hover:scale-110"
            >
              ×
            </button>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="flex gap-3 p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-b-2 border-purple-200">
          <button
            onClick={() => setActiveTab('alltime')}
            className={`relative flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 overflow-hidden ${
              activeTab === 'alltime'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 hover:scale-102 shadow-md'
            }`}
          >
            {activeTab === 'alltime' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            )}
            <div className="relative flex items-center justify-center gap-2">
              <span className="text-2xl">👑</span>
              <span>All-Time High</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`relative flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 overflow-hidden ${
              activeTab === 'weekly'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 hover:scale-102 shadow-md'
            }`}
          >
            {activeTab === 'weekly' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            )}
            <div className="relative flex items-center justify-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>Weekly Top</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="relative inline-block">
                <div className="animate-spin text-7xl">🎮</div>
                <div className="absolute inset-0 bg-purple-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              </div>
              <p className="mt-6 text-gray-700 font-bold text-lg">Loading champions...</p>
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : currentEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative inline-block mb-4">
                <div className="text-8xl animate-bounce">🎯</div>
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              </div>
              <p className="text-2xl font-black text-gray-800 mb-2">No scores yet!</p>
              <p className="text-gray-600 text-lg">Be the first to claim the throne! 👑</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentEntries.map((entry, index) => (
                <div
                  key={`${entry.username}-${entry.timestamp}`}
                  className={`group relative overflow-hidden bg-gradient-to-r ${getRankColor(index)} p-[2px] rounded-xl hover:scale-102 transition-all duration-300 animate-slide-up stagger-${Math.min(index + 1, 5)}`}
                >
                  {/* Glow effect for top 3 */}
                  {index < 3 && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${getRankColor(index)} opacity-50 blur-xl animate-pulse-ring`}></div>
                  )}
                  
                  <div className={`relative bg-white rounded-xl p-4 border-2 ${getRankBorder(index)} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <div className="flex items-center justify-between">
                      {/* Rank & User Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(index)} text-white font-black text-lg shadow-lg ${index < 3 ? 'animate-pulse-ring' : ''}`}>
                          {getRankIcon(index)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-lg text-gray-800">{entry.username}</span>
                            {entry.level && (
                              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                entry.level === 'hard' ? 'bg-red-100 text-red-700' :
                                entry.level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {entry.level.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">{formatDate(entry.timestamp)}</span>
                            {entry.skillLevel !== undefined && (
                              <span className="text-xs text-purple-600 font-semibold">
                                🤖 {Math.round(entry.skillLevel * 100)}% Skill
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className={`text-3xl font-black bg-gradient-to-r ${getRankColor(index)} bg-clip-text text-transparent`}>
                          {entry.score.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 font-semibold">POINTS</div>
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Footer Stats */}
        {!loading && currentEntries.length > 0 && (
          <div className="relative bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 p-5 border-t-2 border-purple-200 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-20 h-20 bg-purple-500 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500 rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative flex justify-around text-center gap-4">
              <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:scale-105 transition-transform">
                <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  {currentEntries.length}
                </div>
                <div className="text-xs text-gray-700 font-bold mt-1">👥 Total Players</div>
              </div>
              <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:scale-105 transition-transform">
                <div className="text-3xl font-black bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent">
                  {currentEntries[0]?.score.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-700 font-bold mt-1">🏆 Top Score</div>
              </div>
              <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:scale-105 transition-transform">
                <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {Math.round(currentEntries.reduce((sum, e) => sum + e.score, 0) / currentEntries.length) || 0}
                </div>
                <div className="text-xs text-gray-700 font-bold mt-1">📊 Average</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
