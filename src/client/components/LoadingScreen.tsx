import { useEffect, useState } from 'react';

type LoadingScreenProps = {
  onLoadComplete: () => void;
};

export const LoadingScreen = ({ onLoadComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const loadingSteps = [
      { progress: 20, text: 'Loading game assets...', delay: 300 },
      { progress: 40, text: 'Preparing characters...', delay: 400 },
      { progress: 60, text: 'Setting up enemies...', delay: 400 },
      { progress: 80, text: 'Loading power-ups...', delay: 400 },
      { progress: 100, text: 'Ready to play!', delay: 500 },
    ];

    let currentStep = 0;

    const loadNextStep = () => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setProgress(step.progress);
        setLoadingText(step.text);
        currentStep++;

        if (currentStep < loadingSteps.length) {
          setTimeout(loadNextStep, step.delay);
        } else {
          // Loading complete
          setTimeout(() => {
            onLoadComplete();
          }, 500);
        }
      }
    };

    // Start loading sequence
    setTimeout(loadNextStep, 300);
  }, [onLoadComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: Math.random() * 100 + 50 + 'px',
              height: Math.random() * 100 + 50 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Loading content */}
      <div className="relative z-10 text-center px-6 max-w-md w-full">
        {/* Game logo/title with animated character */}
        <div className="mb-8">
          {/* Animated snake emoji icon */}
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full animate-bounce shadow-2xl flex items-center justify-center text-5xl">
                🐍
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-2 drop-shadow-2xl">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
              Snake Junct
            </span>
          </h1>
          <p className="text-xl text-blue-200 font-semibold">
            🎮 Dodge, Jump, Survive!
          </p>
        </div>

        {/* Loading bar container */}
        <div className="mb-6">
          <div className="relative w-full h-8 bg-gray-800/50 rounded-full overflow-hidden border-2 border-blue-400/30 shadow-lg">
            {/* Progress bar fill */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>

            {/* Progress percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm drop-shadow-lg z-10">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-white text-lg font-medium animate-pulse">
          {loadingText}
        </div>

        {/* Loading dots animation */}
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        {/* Fun tip */}
        <div className="mt-8 text-blue-200 text-sm italic">
          💡 Tip: Collect shields for invincibility!
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.1;
          }
          50% {
            transform: translateY(-50px) translateX(30px);
            opacity: 0.3;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};
