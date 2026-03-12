import React from 'react';

const ModeToggle = ({ mode, setMode, disabled }) => {
  return (
    <div className={`mode-toggle-container ${disabled ? 'disabled' : ''}`}>
      <button
        className={`toggle-btn ${mode === 'Real World' ? 'active' : ''}`}
        onClick={() => !disabled && setMode('Real World')}
      >
        Real World Mode
      </button>
      <button
        className={`toggle-btn ${mode === 'Hypothetical' ? 'active' : ''}`}
        onClick={() => !disabled && setMode('Hypothetical')}
      >
        Hypothetical Mode
      </button>
      <div className="toggle-slider" style={{ left: mode === 'Real World' ? '4px' : 'calc(50% + 4px)' }}></div>
    </div>
  );
};

export default ModeToggle;
