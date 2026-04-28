import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await login(form.email, form.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '100px 24px 40px', background: 'var(--bg-base)',
            position: 'relative', overflow: 'hidden',
        }}>
            <div style={{
                position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{
                width: '100%', maxWidth: 440,
                background: 'rgba(13,31,20,0.8)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 24, padding: '48px 40px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                animation: 'fadeInUp 0.5s ease-out',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Welcome Back</h1>
                    <p style={{ color: '#4b7c5a', fontSize: 14 }}>Sign in to your CropAI account</p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px', borderRadius: 12, marginBottom: 20,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#f87171', fontSize: 14,
                    }}>{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, color: '#86efac', marginBottom: 6, fontWeight: 500 }}>
                            Email Address
                        </label>
                        <input
                            className="input-field"
                            type="email"
                            placeholder="farmer@example.com"
                            value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 28 }}>
                        <label style={{ display: 'block', fontSize: 13, color: '#86efac', marginBottom: 6, fontWeight: 500 }}>
                            Password
                        </label>
                        <input
                            className="input-field"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} style={{
                        width: '100%', padding: '14px',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        border: 'none', borderRadius: 12, color: '#fff',
                        fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
                        opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif',
                    }}>
                        {loading ? '⌛ Signing In...' : '🌿 Sign In'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <p style={{ fontSize: 14, color: '#4b7c5a' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
