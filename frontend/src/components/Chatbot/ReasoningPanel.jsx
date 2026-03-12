import React from 'react';

const ReasoningPanel = ({ steps, currentIndex }) => {
  return (
    <div className="reasoning-panel">
      <div className="reasoning-header">
        <h3>Reasoning Process</h3>
        <div className="thinking-indicator">
          <span className="pulse-dot"></span>
          Analyzing Signals...
        </div>
      </div>

      <div className="reasoning-steps">
        {steps.map((step, idx) => {
          let statusClass = '';
          if (idx < currentIndex) statusClass = 'completed';
          else if (idx === currentIndex) statusClass = 'active';
          else statusClass = 'pending';

          return (
            <div key={idx} className={`reasoning-step ${statusClass}`}>
              <div className="step-bullet">
                {idx < currentIndex ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <div className="step-text">{step}</div>
            </div>
          );
        })}
      </div>

      <div className="reasoning-meta">
        <p>Establishing systemic connections...</p>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ReasoningPanel;
