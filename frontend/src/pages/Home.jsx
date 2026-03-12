import React, { Suspense, lazy } from 'react';

const GlobalMonitor = lazy(() => import('../components/ConflictGlobe'));

const Home = () => {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#0a0f1e', overflow: 'hidden' }}>
      <Suspense fallback={
        <div style={{
          width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0f1e', color: '#fff'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>🌐</div>
          <div style={{ fontSize: '1rem', color: '#3498db', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '900' }}>
            System Boot: Global Intelligence Monitor...
          </div>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      }>
        <GlobalMonitor />
      </Suspense>
    </div>
  );
};

export default Home;
