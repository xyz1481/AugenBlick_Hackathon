import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Narrative', path: '/narrative' },
        { name: 'Simulator', path: '/simulator' },
        { name: 'Supply Chains', path: '/supply-chains' },
    ];

    return (
        <nav className="navbar">
            <div className="nav-logo">
                <Link to="/">AugenBlick<span>.</span></Link>
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
                <div className="badge" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>v1.0.0-beta</div>
            </div>
        </nav>
    );
};

export default Navbar;
