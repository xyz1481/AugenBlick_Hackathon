import React from 'react';
import AnalysisDashboard from '../components/AnalysisDashboard';

const Narrative = () => {
    return (
        <div className="narrative-page" style={{ padding: '2rem 4rem', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 className="title" style={{ fontSize: '2.5rem' }}>Narrative Intelligence</h1>
                <p className="subtitle">Cross-referencing social sentiment with market reality</p>
            </div>
            <AnalysisDashboard />
        </div>
    );
};

export default Narrative;
