import React from 'react';

const Simulator = () => {
    return (
        <div className="simulator-page" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 className="title" style={{ fontSize: '3rem' }}>Crisis Simulator</h1>
            <p className="subtitle">Coming Soon: Interactive geopolitical event modeling</p>
            <div className="status-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>
                    Model the ripple effects of potential global events (conflicts, trade bans, natural disasters) 
                    on specific industries and market tickers.
                </p>
            </div>
        </div>
    );
};

export default Simulator;
