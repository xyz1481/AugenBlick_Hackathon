import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Narrative from './pages/Narrative';
import Simulator from './pages/Simulator';
import SupplyChains from './pages/SupplyChains';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/narrative" element={<Narrative />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/supply-chains" element={<SupplyChains />} />
          </Routes>
        </main>

        <footer style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
          &copy; 2026 AugenBlick Dashboard • Intelligence & Reality Engine
        </footer>
      </div>
    </Router>
  );
}

export default App;

