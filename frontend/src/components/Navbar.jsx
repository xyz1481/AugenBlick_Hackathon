import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Intel Agent', path: '/intel-agent' },
        { name: 'Community', path: '/community' },
        { name: 'Narrative', path: '/narrative' },
        { name: 'Market', path: '/market' },
        { name: 'Supply Chains', path: '/supply-chains' },
        { name: 'Conflict Impact', path: '/conflict-impact' },
    ];

    return (
        <nav className="navbar">
            <div className="nav-logo">
                <Link to="/">Reality<span>.</span></Link>
            </div>
            <div className="nav-links">
                {navLinks.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                    >
                        {link.name}
                    </Link>
                ))}
            </div>
            <div className="nav-actions">
                {user ? (
                    <div className="user-profile">
                        <div className="profile-icon" title={user.email}>
                            {user.email.substring(0, 2).toUpperCase()}
                        </div>
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </div>
                ) : (
                    <div className="auth-links">
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/signup" className="nav-link">Signup</Link>
                    </div>
                )}
                <button 
                  onClick={toggleTheme} 
                  className="theme-toggle"
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
