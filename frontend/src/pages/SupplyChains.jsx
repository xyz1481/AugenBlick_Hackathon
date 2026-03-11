import React from 'react';

const SupplyChains = () => {
    return (
        <div className="supply-chains-page" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 className="title" style={{ fontSize: '3rem' }}>Supply Chains</h1>
            <p className="subtitle">Visualizing the flow of global impact</p>
            <div className="status-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>
                    Trace how narrative-driven panic impacts critical supply nodes across the globe.
                </p>
            </div>
        </div>
    );
};

export default SupplyChains;
