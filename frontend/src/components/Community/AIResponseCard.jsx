import React from 'react';

const AIResponseCard = ({ aiResponse, aiSources = [] }) => {
  if (!aiResponse) return null;

  const credibility = aiResponse.credibility || 'Unknown';
  const credibilityClass = credibility.toLowerCase();

  return (
    <div className="ai-response-card">
      <div className="ai-header">
        <span className="ai-badge">REALITY AI ANALYSIS</span>
        <span className={`credibility-badge ${credibilityClass}`}>
          CREDIBILITY: {credibility}
        </span>
      </div>

      <div className="ai-body">
        <p className="analysis-summary">{aiResponse.analysisSummary || 'Analysis in progress...'}</p>

        <div className="analysis-details">
          <div className="detail-section">
            <h4>Supporting Signals</h4>
            <ul>
              {(aiResponse.supportingSignals || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="detail-section">
            <h4>Contradictions</h4>
            <ul>
              {(aiResponse.contradictions || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>

        {/* New Sources Section */}
        <div className="sources-analyzed">
          <h4>SOURCES ANALYSED</h4>
          {aiSources && aiSources.length > 0 ? (
            <div className="source-list">
              {aiSources.map((s, i) => (
                <span key={i} className="source-tag">{s.sourceName}</span>
              ))}
            </div>
          ) : (
            <p className="no-sources">No external headlines detected for this specific pulse.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIResponseCard;
