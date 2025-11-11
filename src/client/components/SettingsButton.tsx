import { useState } from 'react';

type SettingsButtonProps = {
  soundVolume: number;
  onVolumeChange: (volume: number) => void;
};

export const SettingsButton = ({ soundVolume, onVolumeChange }: SettingsButtonProps) => {
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
          <div style={{ color: '#aaa', fontSize: '12px', marginTop: '5px' }}>
            {Math.round(soundVolume * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};
