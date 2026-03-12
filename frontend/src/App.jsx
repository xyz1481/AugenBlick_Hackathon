import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Narrative from './pages/Narrative';
import Simulator from './pages/Simulator';
import SupplyChains from './pages/SupplyChains';
import Market from './pages/Market';
import ConflictAnalyzer from './pages/ConflictAnalyzer';

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isConflict = location.pathname === '/conflict-impact';

  return (
    <div className="app-container">
      <Navbar />
      <main
        className="main-content"
        style={(isHome || isConflict) ? { padding: 0, overflow: 'hidden' } : { padding: '2rem 4rem', overflow: 'auto' }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/narrative" element={<Narrative />} />
          <Route path="/simulator" element={<Simulator />} />wh
          <Route path="/conflict-impact" element={<ConflictAnalyzer />} />
          <Route path="/supply-chains" element={<SupplyChains />} />
          <Route path="/market" element={<Market />} />
        </Routes>
      </main>
      {!isHome && (
        <footer style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
          &copy; 2026 AugenBlick Dashboard • Intelligence &amp; Reality Engine
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
