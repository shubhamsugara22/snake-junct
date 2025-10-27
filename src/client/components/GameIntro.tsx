import { useEffect, useState } from 'react';
import { navigateTo } from '@devvit/web/client';

type GameIntroProps = {
  isVisible: boolean;
  onComplete: () => void;
};

export const GameIntro = ({ isVisible, onComplete }: GameIntroProps) => {
  const [animationStep, setAnimationStep] = useState(0);
  const [particles, setParticles] = useState<
    Array<{ x: number; y: number; vx: number; vy: number; life: number }>
  >([]);

  useEffect(() => {
    if (!isVisible) return;

    // Generate floating particles
    const newParticles = Array.from({ length: 25 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      life: Math.random() * 100,
    }));
    setParticles(newParticles);

    const steps = [
      { delay: 300, step: 1 }, // Logo entrance
      { delay: 800, step: 2 }, // Subscribe button
      { delay: 1400, step: 3 }, // Start game button
    ];

    const timeouts = steps.map(({ delay, step }) =>
      setTimeout(() => setAnimationStep(step), delay)
    );

    const completeTimeout = setTimeout(() => {
      onComplete();
      setAnimationStep(0);
    }, 2500);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, [isVisible, onComplete]);

  const handleSubscribe = () => {
    navigateTo('https://www.reddit.com/r/snake_junct_dev/');
  };

  const handleStartGame = () => {
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated beach background */}
      <div className="absolute inset-0">
        {/* Animated waves */}
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-blue-400 to-transparent">
          <div className="absolute bottom-0 w-full h-16 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 animate-pulse"></div>
        </div>

        {/* Floating particles */}
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-60 animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.life * 20}ms`,
              animationDuration: '3s',
            }}
          />
        ))}

        {/* Sun */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-yellow-300 shadow-2xl animate-pulse"></div>
      </div>

      <div className="text-center text-white relative z-10 max-w-4xl mx-auto px-4">
        {/* Clean Logo */}
        <div className="mb-12">
          <div
            className={`transform transition-all duration-1500 ${
              animationStep >= 1
                ? 'scale-100 translate-y-0 rotate-0'
                : 'scale-0 translate-y-20 rotate-12'
            }`}
          >
            <div className="relative mb-8">
              {/* 3D Shadow effect */}
              <h1 className="absolute top-3 left-3 text-7xl sm:text-9xl font-black text-black opacity-30 transform skew-x-1">
                SNAKE JUNCT
              </h1>
              {/* Main logo */}
              <h1 className="relative text-7xl sm:text-9xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent transform -skew-x-1 drop-shadow-2xl">
                SNAKE JUNCT
              </h1>
              {/* Glow effect */}
              <div className="absolute inset-0 text-7xl sm:text-9xl font-black text-yellow-300 opacity-20 blur-sm animate-pulse">
                SNAKE JUNCT
              </div>
            </div>

            <div
              className={`transform transition-all duration-1000 delay-300 ${
                animationStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <p className="text-3xl sm:text-4xl font-bold text-yellow-200 drop-shadow-lg mb-8">
                🐍 A deadly adventure awaits! 🐍
              </p>
            </div>
          </div>
        </div>

        {/* Subscribe Button */}
        {animationStep >= 2 && (
          <div
            className={`mb-8 transform transition-all duration-800 ${
              animationStep >= 2 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          >
            <button
              onClick={handleSubscribe}
              className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300 border-4 border-yellow-300 mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <span>JOIN THE ADVENTURE!</span>
                <span className="text-2xl">🚀</span>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-bounce">
                !
              </div>
            </button>
            <p className="text-sm text-yellow-200 opacity-80">
              Join r/snake_junct_dev for updates & community!
            </p>
          </div>
        )}

        {/* Start Game Button */}
        {animationStep >= 3 && (
          <div
            className={`transform transition-all duration-800 ${
              animationStep >= 3 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          >
            <button
              onClick={handleStartGame}
              className="group relative px-16 py-8 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white font-black text-4xl rounded-3xl shadow-2xl hover:shadow-emerald-500/50 transform hover:scale-110 transition-all duration-300 border-4 border-white"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-500 rounded-3xl blur opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative flex items-center gap-6">
                <span className="text-5xl animate-bounce">🚀</span>
                <div className="flex flex-col">
                  <span className="text-4xl">START</span>
                  <span className="text-2xl opacity-90">ADVENTURE</span>
                </div>
                <span className="text-5xl animate-bounce delay-300">🎯</span>
              </div>
              {/* Enhanced sparkle effects */}
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-yellow-300 rounded-full animate-ping"></div>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-pink-300 rounded-full animate-ping delay-100"></div>
              <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-blue-300 rounded-full animate-ping delay-200"></div>
              <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-purple-300 rounded-full animate-ping delay-300"></div>
              <div className="absolute top-1/2 -left-4 w-6 h-6 bg-orange-300 rounded-full animate-ping delay-400"></div>
              <div className="absolute top-1/2 -right-4 w-6 h-6 bg-red-300 rounded-full animate-ping delay-500"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
