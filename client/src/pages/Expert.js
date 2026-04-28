import React, { useState, useEffect } from 'react';
import { Microscope, CheckCircle, Brain, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Expert = () => {
    const { user } = useAuth();
    const [experts, setExperts] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ disease: '', message: '', expertId: '' });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [aiDiagnosis, setAiDiagnosis] = useState('');

    useEffect(() => {
        document.title = 'Consult Expert — CropAI';
        Promise.all([
            api.get('/expert/list'),
            api.get('/expert/requests').catch(() => ({ data: { requests: [] } }))
        ])
            .then(([eRes, rRes]) => {
                setExperts(eRes.data.experts || []);
                setRequests(rRes.data.requests || []);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess('');
        setAiDiagnosis('');
        try {
            // Use real logged-in user data instead of hardcoded placeholders
            const res = await api.post('/expert/connect', {
                name: user?.name || 'Farmer',
                email: user?.email || '',
                ...form
            });
            setSuccess('Request submitted! An expert will contact you within 24 hours.');
            // Show the Gemini AI diagnosis returned from the server
            if (res.data?.aiDiagnosis) {
                setAiDiagnosis(res.data.aiDiagnosis);
            }
            setForm({ disease: '', message: '', expertId: form.expertId });
            // Refresh requests list
            const rRes = await api.get('/expert/requests').catch(() => ({ data: { requests: [] } }));
            setRequests(rRes.data.requests || []);
        } catch (err) {
            console.error('Expert connect error:', err);
            const msg = err.response?.data?.message || 'Failed to submit request. Please try again.';
            setSuccess('');
            setAiDiagnosis('');
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-wrapper" style={{ padding: '96px 24px 60px', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Microscope size={32} className="gradient-text" /> <span className="gradient-text">Consult an Expert</span>
                </h1>
                <p style={{ color: '#4b7c5a', fontSize: 16, maxWidth: 600 }}>
                    Connect with ICAR-certified agricultural scientists for personalized advice on complex crop diseases that standard remedies cannot solve.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: 32, alignItems: 'start' }}>

                {/* Left Col: Request Form & History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                    <div className="glass-card" style={{ padding: 32 }}>
                        <h2 style={{ fontSize: 20, marginBottom: 24, color: '#f0fdf4' }}>Request Consultation</h2>

                        {success && (
                            <div style={{
                                padding: 16, background: 'rgba(34,197,94,0.1)',
                                border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12,
                                color: '#22c55e', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <CheckCircle size={18} /> {success}
                            </div>
                        )}

                        {/* AI Diagnosis Card — shown after submission */}
                        {aiDiagnosis && (
                            <div style={{
                                padding: 20, marginBottom: 24, borderRadius: 14,
                                background: 'linear-gradient(135deg, rgba(34,197,94,0.05), rgba(14,165,233,0.05))',
                                border: '1px solid rgba(34,197,94,0.2)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    <Brain size={20} color="#22c55e" />
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#86efac' }}>
                                        Gemini AI — Initial Assessment
                                    </span>
                                    <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: 11 }}>
                                        AI Generated
                                    </span>
                                </div>
                                <p style={{ color: '#f0fdf4', fontSize: 14, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {aiDiagnosis}
                                </p>
                                <p style={{ color: '#4b7c5a', fontSize: 12, marginTop: 12, marginBottom: 0 }}>
                                    ⚠️ This is an AI-generated assessment. Await your assigned expert for final advice.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, color: '#86efac', marginBottom: 8, fontWeight: 500 }}>
                                    Select Expert (Optional)
                                </label>
                                <select
                                    className="input-field"
                                    value={form.expertId}
                                    onChange={e => setForm(p => ({ ...p, expertId: e.target.value }))}
                                >
                                    <option value="">Any available expert</option>
                                    {experts.filter(e => e.available).map(e => (
                                        <option key={e.id} value={e.id}>{e.name} - {e.specialization}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 13, color: '#86efac', marginBottom: 8, fontWeight: 500 }}>
                                    Crop & Suspected Disease *
                                </label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Wheat Leaf Rust"
                                    required
                                    value={form.disease}
                                    onChange={e => setForm(p => ({ ...p, disease: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 13, color: '#86efac', marginBottom: 8, fontWeight: 500 }}>
                                    Describe the issue *
                                </label>
                                <textarea
                                    className="input-field"
                                    style={{ minHeight: 120, resize: 'vertical' }}
                                    placeholder="Describe the symptoms, when they started, and any treatments you have already tried..."
                                    required
                                    value={form.message}
                                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                />
                            </div>

                            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '14px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {submitting ? (
                                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, margin: 0 }} /> Analysing with Gemini AI...</>
                                ) : (
                                    <><Sparkles size={18} /> Submit & Get AI Assessment</>
                                )}
                            </button>

                            {/* Submitting user info display */}
                            {user && (
                                <p style={{ fontSize: 12, color: '#4b7c5a', textAlign: 'center', margin: 0 }}>
                                    Submitting as <strong style={{ color: '#86efac' }}>{user.name}</strong> ({user.email})
                                </p>
                            )}
                        </form>
                    </div>

                    {/* History */}
                    {requests.length > 0 && (
                        <div className="glass-card" style={{ padding: 32 }}>
                            <h2 style={{ fontSize: 18, marginBottom: 20, color: '#86efac' }}>My Requests</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {requests.map((r, i) => (
                                    <div key={r.id || i} style={{ padding: 16, background: 'rgba(34,197,94,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <strong style={{ color: '#f0fdf4' }}>{r.disease}</strong>
                                            <span className={`badge badge-${r.status === 'resolved' ? 'success' : r.status === 'contacted' ? 'info' : 'warning'}`}>
                                                {r.status?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ color: '#4b7c5a', fontSize: 13, marginBottom: r.ai_diagnosis ? 12 : 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {r.message}
                                        </div>
                                        {r.ai_diagnosis && (
                                            <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.05)', borderLeft: '3px solid rgba(34,197,94,0.4)' }}>
                                                <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>AI ASSESSMENT · </span>
                                                <span style={{ fontSize: 12, color: '#86efac' }}>{r.ai_diagnosis}</span>
                                            </div>
                                        )}
                                        <div style={{ fontSize: 12, color: '#2d4a36', marginTop: 8 }}>
                                            {new Date(r.created_at || r.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Available Experts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h2 style={{ fontSize: 18, marginBottom: 8, color: '#f0fdf4' }}>Verified Scientists</h2>
                    {loading ? (
                        <div className="spinner" style={{ alignSelf: 'center', margin: 40 }} />
                    ) : experts.map(e => (
                        <div key={e.id} className="glass-card" style={{ padding: 20, opacity: e.available ? 1 : 0.6 }}>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,197,94,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', flexShrink: 0,
                                }}>
                                    <Microscope size={24} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <h3 style={{ fontSize: 16, margin: 0, color: '#f0fdf4' }}>{e.name}</h3>
                                        {e.available
                                            ? <span className="status-dot online" title="Available" />
                                            : <span className="status-dot offline" title="Busy" />}
                                    </div>
                                    <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 500, marginBottom: 4 }}>{e.specialization}</div>
                                    <div style={{ fontSize: 12, color: '#4b7c5a', marginBottom: 12 }}>{e.institution}</div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {e.languages?.map(l => (
                                            <span key={l} style={{
                                                fontSize: 11, padding: '2px 8px',
                                                background: 'rgba(255,255,255,0.05)', borderRadius: 10, color: '#86efac',
                                            }}>{l}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default Expert;
