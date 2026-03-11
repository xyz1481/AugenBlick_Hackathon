import React, { useState, useEffect } from 'react';

const Home = () => {
    const [backendStatus, setBackendStatus] = useState('Checking...');
    const [loading, setLoading] = useState(false);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/health');
            if (response.ok) {
                setBackendStatus('Online');
            } else {
                setBackendStatus('Error');
            }
        } catch (error) {
            setBackendStatus('Offline');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    return (
        <div className="home-page" style={{ padding: '4rem', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <header className="hero" style={{ maxWidth: '1200px', margin: '0 auto 4rem auto' }}>
                <div className="badges">
                    <span className="badge" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>Intelligence Engine</span>
                    <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Sentiment Analysis</span>
                    <span className="badge">Real-time Data</span>
                </div>
                <h1 className="title" style={{ fontSize: '6rem' }}>AugenBlick.</h1>
                <p className="subtitle" style={{ fontSize: '1.5rem' }}>Global Conflict Impact Intelligence Platform</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                <div className="status-card" style={{ padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>System Readiness</h3>
                    <div className="status-item">
                        <span className="status-label">Backend Connection</span>
                        <span className={`status-value ${backendStatus.toLowerCase()}`}>
                            <span className={`indicator ${backendStatus.toLowerCase()}`}></span>
                            {backendStatus}
                        </span>
                    </div>
                    
                    <div className="status-item">
                        <span className="status-label">Database Status</span>
                        <span className={`status-value ${backendStatus === 'Online' ? 'online' : 'offline'}`}>
                            <span className={`indicator ${backendStatus === 'Online' ? 'online' : 'offline'}`}></span>
                            {backendStatus === 'Online' ? 'Operational' : 'Waiting...'}
                        </span>
                    </div>

                    <button 
                        className="refresh-btn" 
                        onClick={fetchStatus} 
                        disabled={loading}
                        style={{ marginTop: '2rem' }}
                    >
                        {loading ? 'Refreshing...' : 'Run Diagnostics'}
                    </button>
                </div>

                <div className="status-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Mission Control</h3>
                    <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text-main)' }}>
                        AugenBlick uses advanced sentiment analysis on narrative sources like <strong>Reddit</strong>, 
                        <strong>News Echoes</strong>, and <strong>X Signals</strong>, cross-referencing them 
                        with real-world market indicators to predict and visualize global crisis impacts.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '5px' }}>NARRATIVE SOURCES</div>
                            <div style={{ fontWeight: '800' }}>3 ACTIVE</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '5px' }}>MARKET REALITY</div>
                            <div style={{ fontWeight: '800' }}>YAHOO FINANCE</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
