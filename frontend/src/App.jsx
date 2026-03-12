import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Narrative from './pages/Narrative';
import Simulator from './pages/Simulator';
import SupplyChains from './pages/SupplyChains';
import Market from './pages/Market';
import Signup from './pages/Signup';
import Login from './pages/Login';
import IntelAgent from './pages/IntelAgent';

const AuthGate = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, [location]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="auth-gate-overlay">
        <div className="auth-gate-content">
          <h2>Access Restricted</h2>
          <p>You need to be logged in to access the <strong>{location.pathname.replace('/', '').replace('-', ' ')}</strong>.</p>
          <div className="auth-gate-actions">
            <Link to="/login" className="btn-primary">Login Now</Link>
            <Link to="/signup" className="btn-secondary">Create Account</Link>
          </div>
          <Link to="/" className="back-link">Return to Home</Link>
        </div>
      </div>
    );
  }

  return children;
};

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="app-container">
      {!isAuthPage && <Navbar />}
      <main
        className="main-content"
        style={isHome ? { padding: 0, overflow: 'hidden' } : { padding: '2rem 4rem', overflow: 'auto' }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/narrative" element={<AuthGate><Narrative /></AuthGate>} />
          <Route path="/simulator" element={<AuthGate><Simulator /></AuthGate>} />
          <Route path="/supply-chains" element={<AuthGate><SupplyChains /></AuthGate>} />
          <Route path="/market" element={<AuthGate><Market /></AuthGate>} />
          <Route path="/intel-agent" element={<AuthGate><IntelAgent /></AuthGate>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

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
