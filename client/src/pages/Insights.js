import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Map, AlertTriangle, TrendingUp, Brain, RefreshCw } from 'lucide-react';
import api from '../services/api';

import ReactMarkdown from 'react-markdown';

const ALL_STATES = [
    'All States', 'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const RiskLegend = () => (
    <div style={{
        position: 'absolute', bottom: 20, left: 20, zIndex: 1000,
        background: 'rgba(13,31,20,0.85)', padding: '12px 16px',
        borderRadius: 12, border: '1px solid rgba(34,197,94,0.3)',
        backdropFilter: 'blur(10px)', color: '#fff', fontSize: 13,
    }}>
        <h4 style={{ marginBottom: 8, fontSize: 14 }}>Disease Intensity</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} /> High (&gt;30 cases)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} /> Medium (10–30)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} /> Low (&lt;10 cases)
        </div>
    </div>
);

const Insights = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedState, setSelectedState] = useState('');
    const [selectedDays, setSelectedDays] = useState('30');

    const fetchData = (state = '', days = '30') => {
        setLoading(true);
        const params = new URLSearchParams();
        if (state && state !== 'All States') params.set('state', state);
        if (days) params.set('days', days);

        api.get(`/insights/regional?${params.toString()}`)
            .then(res => setData(res.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        document.title = 'Regional Insights — CropAI';
        fetchData();
    }, []);

    const handleStateChange = (e) => {
        setSelectedState(e.target.value);
        fetchData(e.target.value, selectedDays);
    };

    const handleDaysChange = (e) => {
        setSelectedDays(e.target.value);
        fetchData(selectedState, e.target.value);
    };

    const getMarkerColor = (count) => {
        if (count > 30) return '#ef4444';
        if (count > 10) return '#f97316';
        return '#fbbf24';
    };

    const mapCenter = [22.5, 78.5];
    const mapZoom = 5;

    // Parse AI trend summary bullet points for clean display
    // const renderAiSummary = ... (replaced by ReactMarkdown)

    return (
        <div className="page-wrapper" style={{ padding: '96px 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Map size={32} className="gradient-text" /> <span className="gradient-text">Regional Insights</span>
                    </h1>
                    <p style={{ color: '#4b7c5a', fontSize: 15, maxWidth: 600 }}>
                        Real-time geospatial visualization of crop diseases reported by the CropAI community across India.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        className="input-field"
                        style={{ width: 180, padding: '10px 14px', fontSize: 14 }}
                        value={selectedState}
                        onChange={handleStateChange}
                    >
                        {ALL_STATES.map(s => <option key={s} value={s === 'All States' ? '' : s}>{s}</option>)}
                    </select>
                    <select
                        className="input-field"
                        style={{ width: 150, padding: '10px 14px', fontSize: 14 }}
                        value={selectedDays}
                        onChange={handleDaysChange}
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                    </select>
                    <button
                        onClick={() => fetchData(selectedState, selectedDays)}
                        style={{
                            padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                            color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="glass-card" style={{ height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 16 }}>
                    <div className="spinner" />
                    <p style={{ color: '#4b7c5a', fontSize: 14 }}>Loading disease data & AI analysis...</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>

                    {/* Main Map */}
                    <div className="glass-card" style={{ height: 600, position: 'relative', overflow: 'hidden' }}>
                        <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                            <TileLayer
                                attribution='&copy; CARTO'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                            {data?.mapPoints?.map((p, i) => (
                                <CircleMarker
                                    key={i}
                                    center={[p.lat, p.lng]}
                                    radius={Math.min(24, Math.max(8, p.count * 1.5))}
                                    pathOptions={{
                                        color: getMarkerColor(p.count),
                                        fillColor: getMarkerColor(p.count),
                                        fillOpacity: 0.6,
                                        weight: 2,
                                    }}
                                >
                                    <Popup>
                                        <div style={{ padding: 4 }}>
                                            <h4 style={{ margin: '0 0 6px', fontWeight: 700, color: '#111' }}>{p.disease}</h4>
                                            <p style={{ margin: 0, fontSize: 13, color: '#333' }}>
                                                <strong>{p.count}</strong> cases · {p.crop}<br />
                                                {p.lat.toFixed(2)}°N, {p.lng.toFixed(2)}°E
                                            </p>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            ))}
                            <RiskLegend />
                        </MapContainer>

                        {/* Empty state overlay */}
                        {(!data?.mapPoints || data.mapPoints.length === 0) && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 10,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(5,15,10,0.7)', backdropFilter: 'blur(4px)',
                            }}>
                                <Map size={48} color="#4b7c5a" style={{ marginBottom: 16, opacity: 0.5 }} />
                                <p style={{ color: '#4b7c5a', textAlign: 'center', fontSize: 15 }}>
                                    No geolocation data yet.<br />
                                    <span style={{ fontSize: 13 }}>Data will appear as farmers scan crops with location enabled.</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Top Diseases */}
                        <div className="glass-card" style={{ padding: 24, flex: 1 }}>
                            <h3 style={{ fontSize: 15, marginBottom: 20, color: '#86efac', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TrendingUp size={18} /> Trending Hotspots
                            </h3>
                            {data?.topDiseases && data.topDiseases.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {data.topDiseases.map((d, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{
                                                width: 28, height: 28, borderRadius: '50%',
                                                background: i < 3 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)',
                                                color: i < 3 ? '#f87171' : '#22c55e',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 12, fontWeight: 700, flexShrink: 0,
                                            }}>{i + 1}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, color: '#f0fdf4', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {d.disease}
                                                </div>
                                                <div style={{ color: '#4b7c5a', fontSize: 12 }}>{d.state} · {d.crop}</div>
                                            </div>
                                            <div style={{
                                                padding: '4px 10px', background: 'rgba(239,68,68,0.1)',
                                                borderRadius: 12, color: '#f87171', fontSize: 12, fontWeight: 700, flexShrink: 0,
                                            }}>
                                                {d.count}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '30px 0', color: '#4b7c5a' }}>
                                    <TrendingUp size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                                    <p>No disease reports in this period.</p>
                                </div>
                            )}
                        </div>

                        {/* AI Trend Analysis — Gemini powered */}
                        <div className="glass-card" style={{
                            padding: 24,
                            background: data?.aiTrendSummary
                                ? 'rgba(34,197,94,0.04)'
                                : 'rgba(239,68,68,0.05)',
                            borderColor: data?.aiTrendSummary
                                ? 'rgba(34,197,94,0.2)'
                                : 'rgba(239,68,68,0.3)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                {data?.aiTrendSummary
                                    ? <Brain size={22} color="#22c55e" />
                                    : <AlertTriangle size={22} color="#f87171" />}
                                <h3 style={{ fontSize: 15, color: data?.aiTrendSummary ? '#86efac' : '#f87171', margin: 0 }}>
                                    {data?.aiTrendSummary ? 'Gemini AI — Trend Analysis' : 'Regional Alert'}
                                </h3>
                                {data?.aiTrendSummary && (
                                    <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: 11 }}>Live AI</span>
                                )}
                            </div>
                            {data?.aiTrendSummary ? (
                                <div style={{ color: '#f0fdf4', fontSize: 14, lineHeight: 1.6 }}>
                                    <ReactMarkdown>{data.aiTrendSummary}</ReactMarkdown>
                                    <p style={{ color: '#4b7c5a', fontSize: 12, marginTop: 14, marginBottom: 0, borderTop: '1px solid rgba(34,197,94,0.1)', paddingTop: 12 }}>
                                        ✨ Analysis generated by Gemini AI based on community reports
                                    </p>
                                </div>
                            ) : (
                                <p style={{ color: '#f0fdf4', fontSize: 14, lineHeight: 1.6, marginBottom: 0 }}>
                                    {data && Object.keys(data).length > 0
                                        ? 'Insufficient data for AI analysis. More scans needed in this region.'
                                        : 'No disease reports found for the selected period and region.'}
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            )}

            <style>{`
                .leaflet-popup-content-wrapper { background: rgba(255,255,255,0.95); border-radius: 12px; }
                .leaflet-popup-tip { background: rgba(255,255,255,0.95); }
                .leaflet-container { font-family: 'Inter', sans-serif; }
            `}</style>
        </div>
    );
};

export default Insights;
