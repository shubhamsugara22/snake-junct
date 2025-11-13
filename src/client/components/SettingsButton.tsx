import { useState } from 'react';

type SettingsButtonProps = {
  soundVolume: number;
  onVolumeChange: (volume: number) => void;
  isHalloweenMode: boolean;
  onHalloweenModeChange: (enabled: boolean) => void;
};

export const SettingsButton = ({ soundVolume, onVolumeChange, isHalloweenMode, onHalloweenModeChange }: SettingsButtonProps) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '2px solid #fff',
          background: 'rgba(0, 0, 0, 0.5)',
          color: '#fff',
          fontSize: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ⚙️
      </button>

      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '0',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '2px solid #fff',
            borderRadius: '8px',
            padding: '15px',
            minWidth: '200px',
          }}
        >
          <div style={{ color: '#fff', marginBottom: '10px', fontWeight: 'bold' }}>
            Settings
          </div>
          <div style={{ color: '#fff', marginBottom: '5px', fontSize: '14px' }}>
            Sound Volume
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={soundVolume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ color: '#aaa', fontSize: '12px', marginTop: '5px', marginBottom: '15px' }}>
            {Math.round(soundVolume * 100)}%
          </div>
          
          <div style={{ borderTop: '1px solid #444', paddingTop: '15px' }}>
            <div style={{ color: '#fff', marginBottom: '10px', fontSize: '14px' }}>
              Event Mode
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
              <input
                type="checkbox"
                checked={isHalloweenMode}
                onChange={(e) => onHalloweenModeChange(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px' }}>
                {isHalloweenMode ? '🎃 Halloween Mode' : '🐱 Normal Mode'}
              </span>
            </label>
            <div style={{ color: '#aaa', fontSize: '11px', marginTop: '5px' }}>
              {isHalloweenMode 
                ? 'Spooky bosses: Octopus & Bat' 
                : 'Classic bosses: Cat & Missile'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
