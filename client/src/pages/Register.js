import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const INDIAN_STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other'];
const COMMON_CROPS = ['Rice', 'Wheat', 'Potato', 'Tomato', 'Maize', 'Cotton', 'Soybean', 'Sugarcane', 'Onion', 'Groundnut'];

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', state: '', farmSize: '', crops: [] });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const toggleCrop = (crop) => {
        setForm(p => ({
            ...p,
            crops: p.crops.includes(crop) ? p.crops.filter(c => c !== crop) : [...p.crops, crop],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await register({ ...form, region: form.state });
            if (res.requireEmailConfirmation) {
                setSuccessMsg(res.message);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (successMsg) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '100px 24px 60px', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    width: '100%', maxWidth: 520,
                    background: 'rgba(13,31,20,0.85)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 24, padding: '44px 40px',
                    backdropFilter: 'blur(20px)', textAlign: 'center',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 20 }}>✉️</div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f0fdf4', marginBottom: 16 }}>Check Your Email</h2>
                    <p style={{ color: '#86efac', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
                        {successMsg}
                    </p>
                    <Link to="/login" style={{
                        display: 'inline-block', padding: '14px 32px',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        border: 'none', borderRadius: 12, color: '#fff', textDecoration: 'none',
                        fontSize: 16, fontWeight: 700, boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
                    }}>
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '100px 24px 60px', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden',
        }}>
            <div style={{
                position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{
                width: '100%', maxWidth: 520,
                background: 'rgba(13,31,20,0.85)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 24, padding: '44px 40px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                animation: 'fadeInUp 0.5s ease-out',
            }}>
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>🌾</div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Join CropAI</h1>
                    <p style={{ color: '#4b7c5a', fontSize: 14 }}>Protect your crops with federated AI</p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px', borderRadius: 12, marginBottom: 20,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#f87171', fontSize: 14,
                    }}>{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, color: '#86efac', marginBottom: 6, fontWeight: 500 }}>Full Name *</label>
                            <input className="input-field" placeholder="Ramesh Kumar" value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, color: '#86efac', marginBottom: 6, fontWeight: 500 }}>Farm Size (acres)</label>
                            <input className="input-field" type="number" placeholder="5" value={form.farmSize}
                                onChange={e => setForm(p => ({ ...p, farmSize: e.target.value }))} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, color: '#86efac', marginBottom: 6, fontWeight: 500 }}>Email Address *</label>
                        <input className="input-field" type="email" placeholder="farmer@example.com" value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, color: '#86efac', marginBottom: 6, fontWeight: 500 }}>Password *</label>
                        <input className="input-field" type="password" placeholder="Min. 6 characters" value={form.password}
                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, color: '#86efac', marginBottom: 6, fontWeight: 500 }}>State</label>
                        <select className="input-field" value={form.state}
                            onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                            style={{ cursor: 'pointer' }}>
                            <option value="">Select your state</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: 28 }}>
                        <label style={{ display: 'block', fontSize: 13, color: '#86efac', marginBottom: 10, fontWeight: 500 }}>
                            Crops You Grow (select all that apply)
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {COMMON_CROPS.map(c => (
                                <button key={c} type="button" onClick={() => toggleCrop(c)} style={{
                                    padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                                    background: form.crops.includes(c) ? 'rgba(34,197,94,0.2)' : 'transparent',
                                    border: form.crops.includes(c) ? '1px solid rgba(34,197,94,0.6)' : '1px solid rgba(34,197,94,0.2)',
                                    color: form.crops.includes(c) ? '#22c55e' : '#4b7c5a',
                                }}>
                                    {form.crops.includes(c) ? '✓ ' : ''}{c}
                                </button>
                            ))}
                        </div>
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
                        {loading ? '⌛ Creating Account...' : '🌱 Create Free Account'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <p style={{ fontSize: 14, color: '#4b7c5a' }}>
                        Already registered?{' '}
                        <Link to="/login" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
