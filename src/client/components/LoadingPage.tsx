import { useEffect, useState } from 'react';

type LoadingPageProps = {
  onComplete: () => void;
};

export const LoadingPage = ({ onComplete }: LoadingPageProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds loading
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 200);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      {/* Animated Snake */}
      <div
        style={{
          marginBottom: '40px',
          animation: 'float 2s ease-in-out infinite',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Snake body segments */}
          <circle cx="60" cy="60" r="18" fill="#4CAF50" opacity="0.9">
            <animate
              attributeName="r"
              values="18;20;18"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="40" cy="65" r="15" fill="#66BB6A" opacity="0.8">
            <animate
              attributeName="r"
              values="15;17;15"
              dur="1s"
              begin="0.1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="25" cy="75" r="12" fill="#81C784" opacity="0.7">
            <animate
              attributeName="r"
              values="12;14;12"
              dur="1s"
              begin="0.2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="15" cy="88" r="10" fill="#A5D6A7" opacity="0.6">
            <animate
              attributeName="r"
              values="10;12;10"
              dur="1s"
              begin="0.3s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Snake head */}
          <circle cx="75" cy="50" r="20" fill="#2E7D32" />
          
          {/* Eyes */}
          <circle cx="70" cy="45" r="3" fill="#FFF" />
          <circle cx="80" cy="45" r="3" fill="#FFF" />
          <circle cx="71" cy="45" r="1.5" fill="#000" />
          <circle cx="81" cy="45" r="1.5" fill="#000" />

          {/* Tongue */}
          <path
            d="M 85 50 L 95 48 M 95 48 L 97 45 M 95 48 L 97 51"
            stroke="#FF5252"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values="M 85 50 L 95 48 M 95 48 L 97 45 M 95 48 L 97 51;
                      M 85 50 L 100 48 M 100 48 L 102 45 M 100 48 L 102 51;
                      M 85 50 L 95 48 M 95 48 L 97 45 M 95 48 L 97 51"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      {/* Game Title */}
      <h1
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#FFF',
          marginBottom: '30px',
          textShadow: '0 4px 8px rgba(0,0,0,0.3)',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        Snake Dodge
      </h1>

      {/* Loading Bar Container */}
      <div
        style={{
          width: '300px',
          height: '20px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '2px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Loading Bar Fill */}
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)',
            transition: 'width 0.1s ease-out',
            boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)',
          }}
        />
      </div>

      {/* Loading Text */}
      <p
        style={{
          marginTop: '15px',
          color: '#FFF',
          fontSize: '16px',
          opacity: 0.9,
        }}
      >
        Loading... {Math.round(progress)}%
      </p>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};
