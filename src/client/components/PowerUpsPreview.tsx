type PowerUpsPreviewProps = {
  isVisible: boolean;
  onClose: () => void;
};

type PowerUp = {
  sku: string;
  name: string;
  icon: string;
  description: string;
  duration: string;
  price: number;
};

export const PowerUpsPreview = ({ isVisible, onClose }: PowerUpsPreviewProps) => {
  if (!isVisible) return null;

  const powerUps: PowerUp[] = [
    {
      sku: 'powerup_shield',
      name: 'Shield Protection',
      icon: '🛡️',
      description: 'Invincibility for 20 seconds - survive any collision!',
      duration: '20s',
      price: 5,
    },
    {
      sku: 'powerup_fire',
      name: 'Fire Power',
      icon: '🔥',
      description: 'Destroy enemies on contact and earn bonus points',
      duration: '10s',
      price: 10,
    },
    {
      sku: 'powerup_speed',
      name: 'Speed Boost',
      icon: '⚡',
      description: 'Increase movement speed to dodge faster',
      duration: '15s',
      price: 5,
    },
    {
      sku: 'powerup_slowmo',
      name: 'Slow Motion',
      icon: '⏱️',
      description: 'Slow down all enemies for easier dodging',
      duration: '10s',
      price: 5,
    },
    {
      sku: 'powerup_double_points',
      name: 'Double Points',
      icon: '💰',
      description: 'Earn 2x points for everything you do',
      duration: '15s',
      price: 5,
    },
    {
      sku: 'powerup_magnet',
      name: 'Magnet',
      icon: '🧲',
      description: 'Automatically attract nearby collectibles',
      duration: '12s',
      price: 5,
    },
    {
      sku: 'powerup_ghost',
      name: 'Ghost Mode',
      icon: '�️',
      description: 'Phase through obstacles (not enemies)',
      duration: '8s',
      price: 5,
    },
    {
      sku: 'powerup_multi_jump',
      name: 'Multi-Jump',
      icon: '🦘',
      description: 'Perform double or triple jumps in mid-air',
      duration: '20s',
      price: 5,
    },
  ];

  const handlePurchase = (powerUp: PowerUp) => {
    // For now, just show an alert
    // The actual Devvit payment integration will be handled separately
    alert(`Purchase feature coming soon! ${powerUp.name} costs ${powerUp.price} Gold.`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-white shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>⚡</span>
              <span>Premium Power-Ups</span>
            </h2>
            <p className="text-sm opacity-90 mt-1">Purchase with Reddit Gold</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Power-ups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {powerUps.map((powerUp) => (
            <div
              key={powerUp.sku}
              className="bg-white/20 rounded-lg p-4 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-4xl flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  {powerUp.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name and Price */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-lg">{powerUp.name}</h3>
                    <div className="flex items-center gap-1 text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-bold whitespace-nowrap">
                      <span>🪙</span>
                      <span>{powerUp.price}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm opacity-90 mb-2">{powerUp.description}</p>

                  {/* Duration and Buy Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs bg-white/20 px-2 py-1 rounded">
                      Duration: {powerUp.duration}
                    </div>
                    <button
                      onClick={() => handlePurchase(powerUp)}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full font-bold transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Info */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-4 text-center mb-4">
          <div className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
            <span>🪙</span>
            <span>Reddit Gold Pricing</span>
          </div>
          <p className="text-sm opacity-95 mb-3">
            Most power-ups cost 5 Gold • Fire Power costs 10 Gold
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
            <div className="bg-white/20 px-4 py-2 rounded-lg font-medium">
              💎 Premium Members Get Discounts
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg font-medium">
              🎨 Avatar Owners Get Bonuses
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-blue-500/30 rounded-lg p-3 text-sm">
          <p className="font-semibold mb-1 flex items-center gap-2">
            <span>💡</span>
            <span>How It Works</span>
          </p>
          <p className="text-xs opacity-90">
            Purchase power-ups with Reddit Gold • Use them in-game for special abilities • Check
            your inventory to see owned power-ups
          </p>
        </div>
      </div>
    </div>
  );
};
