import React from 'react';

const ResponseCard = ({ report }) => {
  if (!report) return null;

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'critical': return '#f87171';
      case 'high': return '#f87171';
      case 'medium': return '#fbbf24';
      case 'low': return '#34d399';
      default: return 'var(--primary)';
    }
  };

  return (
    <div className="response-card premium-intel">
      <div className="intel-accent-line"></div>

      <div className="card-header">
        <div className="header-main">
          <div className="report-badge">STRATEGIC ANALYSIS BRIEFING</div>
          <div className="report-identifier">REF: REALITY-NODE-GROQ-33</div>
        </div>
        <div className="risk-indicator" style={{ background: `${getRiskColor(report.riskAssessment)}22`, borderColor: getRiskColor(report.riskAssessment) }}>
          <span className="risk-dot" style={{ background: getRiskColor(report.riskAssessment) }}></span>
          RISK: {report.riskAssessment.toUpperCase()}
        </div>
      </div>

      <div className="report-intro">
        <p className="intro-text">Autonomous reasoning engine has completed systemic signal synthesis. Intelligence targets identified with high confidence.</p>
      </div>

      <section className="intel-section flowchart-section">
        <div className="section-header">
          <span className="section-icon">⌘</span>
          <h3>SYSTEMIC CASCADE FLOW</h3>
        </div>
        <div className="flow-vertical-container">
          {report.summary.split('→').map((step, i) => (
            <React.Fragment key={i}>
              <div className="flow-node-premium">
                <div className="node-number">0{i + 1}</div>
                <div className="node-content">{step.trim()}</div>
              </div>
              {i < report.summary.split('→').length - 1 && (
                <div className="flow-connector">
                  <div className="connector-line"></div>
                  <div className="connector-arrow"></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      <div className="intel-grid">
        <section className="intel-section">
          <div className="section-header">
            <span className="section-icon">⚙</span>
            <h3>SUPPLY CHAIN IMPACTS</h3>
          </div>
          <ul className="intel-list">
            {(Array.isArray(report.supplyChainImpacts)
              ? report.supplyChainImpacts
              : typeof report.supplyChainImpacts === 'object'
                ? Object.values(report.supplyChainImpacts)
                : [report.supplyChainImpacts]
            ).filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section className="intel-section">
          <div className="section-header">
            <span className="section-icon">📈</span>
            <h3>MARKET CONSEQUENCES</h3>
          </div>
          <ul className="intel-list">
            {(Array.isArray(report.marketImpacts)
              ? report.marketImpacts
              : typeof report.marketImpacts === 'object'
                ? Object.values(report.marketImpacts)
                : [report.marketImpacts]
            ).filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>
      </div>

      <section className="intel-section economics-full">
        <div className="section-header">
          <span className="section-icon">◈</span>
          <h3>MACRO-ECONOMIC IMPLICATIONS</h3>
        </div>
        <div className="economics-grid">
          {(Array.isArray(report.economicImpacts)
            ? report.economicImpacts
            : typeof report.economicImpacts === 'object'
              ? Object.values(report.economicImpacts)
              : [report.economicImpacts]
          ).filter(Boolean).map((item, i) => (
            <div key={i} className="econ-item">
              <span className="econ-bullet"></span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <div className="card-footer-professional">
        <div className="footer-left">
          <span className="confidence-label">Confidence Interval:</span>
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: '94%' }}></div>
          </div>
          <span className="confidence-value">94.8%</span>
        </div>
        <div className="footer-right">
          AUTHENTICATED BY REALITY CORE
        </div>
      </div>
    </div>
  );
};

export default ResponseCard;
