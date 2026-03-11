import React, { Suspense, lazy } from 'react';

const ConflictGlobe = lazy(() => import('../components/ConflictGlobe'));

const Home = () => {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0 }}>
      <Suspense fallback={
        <div style={{
          width: '100%', height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0f1e', color: '#fff'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>🌐</div>
          <div style={{ fontSize: '1rem', color: '#3498db', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Loading Global Intelligence...
          </div>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      }>
        <ConflictGlobe />
      </Suspense>
    </div>
  );
};

export default Home;
