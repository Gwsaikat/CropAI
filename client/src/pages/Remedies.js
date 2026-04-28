import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Stethoscope, Pill, ShieldAlert, Sparkles, Leaf, Recycle, Beaker, Search, ChevronRight } from 'lucide-react';
import api from '../services/api';

const Remedies = () => {
    const { disease } = useParams();
    const [data, setData] = useState(null);
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        document.title = 'Treatment Remedies — CropAI';
        if (disease) {
            api.get(`/remedies/${disease}`)
                .then(res => setData(res.data))
                .finally(() => setLoading(false));
        } else {
            api.get('/remedies')
                .then(res => setList(res.data.diseases))
                .finally(() => setLoading(false));
        }
    }, [disease]);

    const filteredList = list.filter(d =>
        d.disease.toLowerCase().includes(search.toLowerCase()) ||
        d.crop.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page-wrapper" style={{ padding: '96px 24px 60px', maxWidth: 1000, margin: '0 auto' }}>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : disease && data ? (
                // Single Disease View
                <div className="fade-in">
                    <Link to="/remedies" style={{ color: '#22c55e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14 }}>
                        <ArrowLeft size={16} /> Back to all diseases
                    </Link>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
                        <div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                                <span className={`badge badge-${data.severity === 'critical' ? 'danger' : data.severity === 'high' ? 'warning' : 'success'}`}>
                                    {data.severity?.toUpperCase()} SEVERITY
                                </span>
                                <span className="badge" style={{ background: 'transparent', border: '1px solid #4b7c5a' }}>{data.crop}</span>
                            </div>
                            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 16 }}>{data.disease}</h1>
                            <p style={{ color: '#86efac', fontSize: 16, maxWidth: 700, lineHeight: 1.6 }}>{data.description}</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
                        <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ fontSize: 16, color: '#f87171', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}><ShieldAlert size={20} /> Symptoms</h3>
                            <ul style={{ paddingLeft: 20, color: '#f0fdf4', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15 }}>
                                {data.symptoms?.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>

                        <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ fontSize: 16, color: '#22c55e', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}><Sparkles size={20} /> Prevention</h3>
                            <ul style={{ paddingLeft: 20, color: '#f0fdf4', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15 }}>
                                {data.prevention?.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                            <div style={{ marginTop: 24, padding: 16, background: 'rgba(239,68,68,0.1)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)' }}>
                                <div style={{ fontSize: 12, color: '#f87171', fontWeight: 600, marginBottom: 4 }}>ESTIMATED YIELD LOSS IF UNTREATED</div>
                                <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{data.estimatedYieldLoss}</div>
                            </div>
                        </div>
                    </div>

                    <h2 style={{ fontSize: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}><Pill size={24} className="gradient-text" /> <span className="gradient-text">Recommended Treatments</span></h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {data.remedies?.map((r, i) => (
                            <div key={i} className="glass-card" style={{ padding: 24, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                <div style={{
                                    width: 60, height: 60, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: r.type === 'organic' ? 'rgba(34,197,94,0.1)' : r.type === 'chemical' ? 'rgba(14,165,233,0.1)' : 'rgba(245,158,11,0.1)'
                                }}>
                                    {r.type === 'organic' ? <Leaf size={28} color="#22c55e" /> : r.type === 'chemical' ? <Beaker size={28} color="#0ea5e9" /> : <Recycle size={28} color="#f59e0b" />}
                                </div>
                                <div style={{ flex: 1, minWidth: 250 }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                                        <h3 style={{ fontSize: 18, m: 0 }}>{r.title}</h3>
                                        <span className="badge" style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)' }}>{r.type.toUpperCase()}</span>
                                    </div>
                                    <p style={{ color: '#86efac', fontSize: 15, marginBottom: 0 }}>{r.instructions}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 11, color: '#4b7c5a', marginBottom: 4 }}>EFFECTIVENESS</div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <div style={{ width: 100, height: 6, background: 'rgba(34,197,94,0.1)', borderRadius: 4 }}>
                                            <div style={{ height: '100%', width: `${r.effectiveness}%`, background: '#22c55e', borderRadius: 4 }} />
                                        </div>
                                        <span style={{ fontWeight: 700, color: '#f0fdf4' }}>{r.effectiveness}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 40, textAlign: 'center' }}>
                        <Link to="/expert" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <Stethoscope size={18} /> Need specific diagnosis? Consult an Expert
                        </Link>
                    </div>
                </div>
            ) : (
                // List View
                <div className="fade-in">
                    <div style={{ marginBottom: 40, textAlign: 'center' }}>
                        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                            <Stethoscope size={36} className="gradient-text" /> <span className="gradient-text">Treatment DB</span>
                        </h1>
                        <p style={{ color: '#4b7c5a', fontSize: 16, maxWidth: 600, margin: '0 auto 32px' }}>
                            Search for organic, biological, and chemical treatments for over 38 crop diseases.
                        </p>
                        <div style={{ position: 'relative', maxWidth: 500, margin: '0 auto' }}>
                            <Search size={20} color="#4b7c5a" style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search diseases or crops (e.g. Rice Blast)..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', padding: '14px 24px 14px 52px', fontSize: 16, borderRadius: '30px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                        {filteredList.map((item, i) => (
                            <Link key={i} to={`/remedies/${item.key}`} className="glass-card" style={{ padding: 24, textDecoration: 'none', display: 'block' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span className="badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>{item.crop}</span>
                                    {item.severity === 'critical' && <span className="badge badge-danger">High Risk</span>}
                                </div>
                                <h3 style={{ fontSize: 18, color: '#f0fdf4', marginBottom: 8 }}>{item.disease}</h3>
                                <span style={{ color: '#4b7c5a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    Browse treatments <ChevronRight size={14} />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Remedies;
