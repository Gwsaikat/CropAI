import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Microscope, Map, Pill, Stethoscope, Leaf, Menu, X } from 'lucide-react';

const NAV_LINKS = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { path: '/detect', label: 'Detect', icon: <Microscope size={16} /> },
    { path: '/insights', label: 'Insights', icon: <Map size={16} /> },
    { path: '/remedies', label: 'Remedies', icon: <Pill size={16} /> },
    { path: '/expert', label: 'Expert', icon: <Stethoscope size={16} /> },
];

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <>
            {/* Always-active responsive CSS — NOT inside conditional render */}
            <style>{`
                @media (min-width: 769px) {
                    .mobile-menu-toggle { display: none !important; }
                    .desktop-nav { display: flex !important; }
                    .mobile-dropdown { display: none !important; }
                }
                @media (max-width: 768px) {
                    .desktop-nav { display: none !important; }
                }
                .nav-link-item:hover {
                    background: rgba(34,197,94,0.1) !important;
                    color: #22c55e !important;
                }
                .logout-btn:hover {
                    color: #f87171 !important;
                    border-color: rgba(239,68,68,0.4) !important;
                }
            `}</style>

            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                background: scrolled ? 'rgba(5,15,10,0.95)' : 'rgba(5,15,10,0.7)',
                backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${scrolled ? 'rgba(34,197,94,0.2)' : 'transparent'}`,
                transition: 'all 0.3s ease',
                boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 72 }}>
                    {/* Logo */}
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', boxShadow: '0 0 15px rgba(34,197,94,0.4)',
                        }}><Leaf size={22} /></div>
                        <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontWeight: 700, fontSize: 18, color: '#f0fdf4' }}>
                            Crop<span style={{ color: '#22c55e' }}>AI</span>
                        </span>
                    </Link>

                    {/* Desktop Nav — always rendered, CSS controls visibility */}
                    <div className="desktop-nav" style={{ alignItems: 'center', gap: 4 }}>
                        {user && NAV_LINKS.map(lnk => (
                            <Link key={lnk.path} to={lnk.path} className="nav-link-item" style={{
                                textDecoration: 'none',
                                padding: '8px 14px',
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 500,
                                color: location.pathname === lnk.path ? '#22c55e' : '#86efac',
                                background: location.pathname === lnk.path ? 'rgba(34,197,94,0.12)' : 'transparent',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <span>{lnk.icon}</span>{lnk.label}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 20 }}>
                        {user ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #22c55e22, #16a34a44)',
                                        border: '1px solid rgba(34,197,94,0.4)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 700, color: '#22c55e',
                                    }}>
                                        {user.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <span style={{ fontSize: 14, color: '#86efac', fontWeight: 500 }}>
                                        {user.name?.split(' ')[0]}
                                    </span>
                                </div>
                                <button onClick={handleLogout} className="logout-btn" style={{
                                    padding: '8px 18px', borderRadius: 20,
                                    background: 'transparent', border: '1px solid rgba(34,197,94,0.3)',
                                    color: '#4b7c5a', fontSize: 13, cursor: 'pointer',
                                    transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                                }}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" style={{
                                    textDecoration: 'none', padding: '8px 18px', borderRadius: 20,
                                    border: '1px solid rgba(34,197,94,0.3)', color: '#86efac',
                                    fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
                                }}>Login</Link>
                                <Link to="/register" style={{
                                    textDecoration: 'none', padding: '8px 20px', borderRadius: 20,
                                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                    color: '#fff', fontSize: 14, fontWeight: 600,
                                    boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
                                }}>Get Started</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="mobile-menu-toggle" style={{ marginLeft: 16 }}>
                        <button onClick={() => setMenuOpen(!menuOpen)} style={{
                            background: 'transparent', border: 'none', color: '#f0fdf4',
                            cursor: 'pointer', padding: 8,
                        }}>
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {menuOpen && (
                    <div className="mobile-dropdown" style={{
                        position: 'absolute', top: 72, left: 0, right: 0,
                        background: 'rgba(5,15,10,0.97)', backdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(34,197,94,0.2)', padding: '20px 24px',
                        display: 'flex', flexDirection: 'column', gap: 12,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    }}>
                        {user && NAV_LINKS.map(lnk => (
                            <Link key={lnk.path} to={lnk.path} onClick={() => setMenuOpen(false)} style={{
                                textDecoration: 'none', padding: '12px 16px', borderRadius: 12,
                                fontSize: 16, fontWeight: 500,
                                color: location.pathname === lnk.path ? '#22c55e' : '#86efac',
                                background: location.pathname === lnk.path ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
                                display: 'flex', alignItems: 'center', gap: 12,
                            }}>
                                <span>{lnk.icon}</span>{lnk.label}
                            </Link>
                        ))}
                        {!user && (
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                <Link to="/login" onClick={() => setMenuOpen(false)} style={{
                                    flex: 1, textAlign: 'center', textDecoration: 'none',
                                    padding: '12px', borderRadius: 12,
                                    border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', fontSize: 15,
                                }}>Login</Link>
                                <Link to="/register" onClick={() => setMenuOpen(false)} style={{
                                    flex: 1, textAlign: 'center', textDecoration: 'none',
                                    padding: '12px', borderRadius: 12,
                                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                    color: '#fff', fontWeight: 600, fontSize: 15,
                                }}>Get Started</Link>
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </>
    );
};

export default Navbar;
