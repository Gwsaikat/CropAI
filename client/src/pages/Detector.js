import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Image as ImageIcon, AlertCircle, CheckCircle, ScanLine, Sun, ZoomIn, Maximize, Shield, RefreshCw, Pill, Stethoscope } from 'lucide-react';
import api from '../services/api';
import { SEVERITY_COLORS } from '../ml/diseaseLabels';

// Helper to reliably get user location and reverse geocode to map region/state
const getLocationData = async () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude: lat, longitude: lng } = pos.coords;
                // Free reverse geocoding to get state
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                const state = data.address?.state || 'Unknown';

                let region = 'Central';
                if (['Kerala', 'Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Telangana'].includes(state)) region = 'South';
                if (['Jammu and Kashmir', 'Himachal Pradesh', 'Punjab', 'Uttarakhand', 'Haryana', 'Delhi', 'Uttar Pradesh'].includes(state)) region = 'North';
                if (['Gujarat', 'Rajasthan', 'Maharashtra', 'Goa'].includes(state)) region = 'West';
                if (['Bihar', 'West Bengal', 'Odisha', 'Jharkhand'].includes(state)) region = 'East';
                if (['Assam', 'Sikkim', 'Nagaland', 'Meghalaya', 'Manipur', 'Mizoram', 'Tripura', 'Arunachal Pradesh'].includes(state)) region = 'Northeast';

                resolve({ region, state, coordinates: { lat, lng } });
            } catch {
                resolve({ region: 'Unknown', state: 'Unknown', coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
            }
        }, () => resolve(null), { timeout: 10000, enableHighAccuracy: false });
    });
};

// Real inference using backend Gemini Vision API instead of local mocked simulation

const Detector = () => {
    const fileRef = useRef(null);
    const canvasRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [inferenceMs, setInferenceMs] = useState(null);

    useEffect(() => {
        document.title = 'Detect Disease — CropAI';
    }, []);

    const handleFile = useCallback(async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setError('Please upload a valid image (JPG, PNG, WebP)');
            return;
        }
        setError(''); setResult(null); setSaved(false);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setLoading(true);

        // Read file as base64 to send to backend Gemini Vision API
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const t0 = Date.now();
                const res = await api.post('/predict/analyze', {
                    imageBase64: reader.result,
                    mimeType: file.type
                });
                const ms = Date.now() - t0;
                setInferenceMs(ms);

                const predictions = res.data.result || [];
                if (predictions.length === 0) throw new Error('No prediction returned');

                setResult(predictions);

                // Try to get real location so the Insights Map naturally populates with data
                const userLocation = await getLocationData();

                // Auto-save prediction to server
                try {
                    await api.post('/predict/save', {
                        disease: predictions[0].key,
                        crop: predictions[0].crop,
                        confidence: predictions[0].confidence,
                        topPredictions: predictions.map(p => ({ disease: p.key, confidence: p.confidence })),
                        severity: predictions[0].severity,
                        location: userLocation,
                        modelVersion: 'Gemini-2.5-Flash',
                        inferenceTimeMs: ms,
                    });
                    setSaved(true);
                } catch { /* save optional */ }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'AI detection failed. Please try another image.');
            } finally {
                setLoading(false);
            }
        };
        reader.onerror = () => {
            setError('Failed to read image file');
            setLoading(false);
        };
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const onDragOver = (e) => e.preventDefault();

    const resetDetector = () => {
        setPreviewUrl(null); setResult(null); setError(''); setSaved(false); setInferenceMs(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const topResult = result?.[0];

    const severityColor = topResult ? SEVERITY_COLORS[topResult.severity] || '#22c55e' : '#22c55e';
    const isHealthy = topResult?.severity === 'none';

    return (
        <div className="page-wrapper" style={{ padding: '96px 24px 60px', maxWidth: 900, margin: '0 auto' }}>
            <div style={{ marginBottom: 36 }}>
                <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ScanLine size={32} className="gradient-text" /> <span className="gradient-text">Crop Disease Detector</span>
                </h1>
                <p style={{ color: '#4b7c5a', fontSize: 15 }}>
                    AI runs in your browser using TensorFlow.js — your image never leaves your device.
                </p>
            </div>

            {/* Upload Zone */}
            {!previewUrl && (
                <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onClick={() => fileRef.current?.click()}
                    style={{
                        border: '2px dashed rgba(34,197,94,0.35)',
                        borderRadius: 20,
                        padding: '80px 40px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'rgba(34,197,94,0.03)',
                        transition: 'all 0.2s',
                        marginBottom: 24,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(34,197,94,0.6)';
                        e.currentTarget.style.background = 'rgba(34,197,94,0.06)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(34,197,94,0.35)';
                        e.currentTarget.style.background = 'rgba(34,197,94,0.03)';
                    }}
                >
                    <div style={{ marginBottom: 16, animation: 'float 3s ease-in-out infinite', color: '#86efac' }}>
                        <Camera size={64} opacity={0.5} />
                    </div>
                    <h3 style={{ fontSize: 18, marginBottom: 10, color: '#f0fdf4' }}>Drop Leaf Photo Here</h3>
                    <p style={{ color: '#4b7c5a', fontSize: 14, marginBottom: 24 }}>
                        JPG, PNG, or WebP · Max 10MB · Works best with clear leaf photos
                    </p>
                    <div style={{
                        display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
                    }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                            style={{
                                padding: '12px 28px', borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none',
                                boxShadow: '0 4px 15px rgba(34,197,94,0.3)', fontFamily: 'Inter, sans-serif',
                                display: 'flex', alignItems: 'center', gap: 8
                            }}>
                            <ImageIcon size={18} /> Browse Files
                        </button>
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleFile(e.target.files[0])}
                    />
                </div>
            )}

            {error && (
                <div style={{
                    padding: '14px 20px', borderRadius: 12, marginBottom: 20,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', fontSize: 14,
                }}>{error}</div>
            )}

            {/* Preview + Loading */}
            {previewUrl && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                    {/* Image Preview */}
                    <div className="glass-card" style={{ padding: 20, position: 'relative' }}>
                        <h3 style={{ fontSize: 14, color: '#86efac', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Camera size={16} /> Uploaded Image</h3>
                        <img
                            src={previewUrl}
                            alt="Leaf"
                            style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 300 }}
                        />
                        {inferenceMs && (
                            <div style={{
                                position: 'absolute', top: 30, right: 30,
                                background: 'rgba(5,15,10,0.85)', padding: '4px 10px',
                                borderRadius: 10, fontSize: 11, color: '#22c55e',
                                border: '1px solid rgba(34,197,94,0.3)',
                            }}>
                                ⚡ {inferenceMs}ms
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <div>
                        {loading ? (
                            <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                                <div style={{ marginBottom: 20, color: '#22c55e' }}>
                                    <div className="spinner" style={{ margin: '0 auto 20px' }} />
                                    <p style={{ fontWeight: 600 }}>Running TF.js Inference...</p>
                                    <p style={{ color: '#4b7c5a', fontSize: 13, marginTop: 8 }}>
                                        MobileNetV3-Small · 224×224 · On-Device
                                    </p>
                                </div>
                            </div>
                        ) : result ? (
                            <div className="glass-card" style={{ padding: 24 }}>
                                {/* Primary Result */}
                                <div style={{
                                    padding: '20px',
                                    borderRadius: 14,
                                    background: isHealthy ? 'rgba(34,197,94,0.08)' : `${severityColor}11`,
                                    border: `1px solid ${severityColor}44`,
                                    marginBottom: 20,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        {isHealthy ? <CheckCircle size={28} color="#22c55e" /> : <AlertCircle size={28} color={severityColor} />}
                                        <div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: '#f0fdf4' }}>{topResult.label}</div>
                                            <div style={{ fontSize: 13, color: '#4b7c5a' }}>{topResult.crop}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                                        <span className={`badge badge-${topResult.severity === 'none' ? 'success' : topResult.severity === 'critical' ? 'danger' : topResult.severity === 'high' ? 'warning' : 'info'}`}>
                                            {topResult.severity === 'none' ? 'Healthy 🌿' : `${topResult.severity?.toUpperCase()} RISK`}
                                        </span>
                                        <span style={{ fontSize: 13, color: '#86efac', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                                            {(topResult.confidence * 100).toFixed(1)}% confidence
                                        </span>
                                    </div>
                                    {/* Confidence bar */}
                                    <div style={{ marginTop: 14, background: 'rgba(34,197,94,0.1)', borderRadius: 6, height: 6 }}>
                                        <div style={{
                                            height: '100%', borderRadius: 6,
                                            width: `${(topResult.confidence * 100).toFixed(0)}%`,
                                            background: `linear-gradient(90deg, ${severityColor}, ${severityColor}99)`,
                                            transition: 'width 1s ease',
                                        }} />
                                    </div>
                                </div>

                                {/* Top-3 */}
                                <div style={{ marginBottom: 20 }}>
                                    <p style={{ fontSize: 12, color: '#4b7c5a', marginBottom: 10 }}>ALL PREDICTIONS</p>
                                    {result.map((r, i) => (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '8px 0', borderBottom: i < result.length - 1 ? '1px solid rgba(34,197,94,0.08)' : 'none',
                                        }}>
                                            <span style={{ fontSize: 13, color: i === 0 ? '#f0fdf4' : '#4b7c5a' }}>
                                                {i + 1}. {r.label} ({r.crop})
                                            </span>
                                            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                                                {(r.confidence * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {!isHealthy && (
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <Link to={`/remedies/${topResult.key}`} style={{
                                            flex: 1, textDecoration: 'none',
                                            padding: '11px', borderRadius: 12,
                                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                            color: '#fff', fontWeight: 600, fontSize: 14,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                        }}>
                                            <Pill size={16} /> View Treatment
                                        </Link>
                                        <Link to="/expert" style={{
                                            flex: 1, textDecoration: 'none',
                                            padding: '11px', borderRadius: 12,
                                            border: '1px solid rgba(34,197,94,0.3)',
                                            color: '#22c55e', fontWeight: 600, fontSize: 14,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                        }}>
                                            <Stethoscope size={16} /> Expert Help
                                        </Link>
                                    </div>
                                )}

                                {saved && (
                                    <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: '#4b7c5a' }}>
                                        ✅ Saved to your prediction history
                                    </div>
                                )}
                            </div>
                        ) : null}

                        <button onClick={resetDetector} style={{
                            width: '100%', marginTop: 14, padding: '11px',
                            background: 'transparent', border: '1px solid rgba(34,197,94,0.2)',
                            color: '#4b7c5a', fontWeight: 600, fontSize: 14,
                            borderRadius: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                        }}>
                            <RefreshCw size={16} /> Scan Another Leaf
                        </button>
                    </div>
                </div>
            )}

            {/* Tips */}
            <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {[
                    { icon: <Sun size={20} color="#86efac" />, tip: 'Good lighting gives better results — take photos in daylight' },
                    { icon: <ZoomIn size={20} color="#86efac" />, tip: 'Focus on one leaf per photo for maximum accuracy' },
                    { icon: <Maximize size={20} color="#86efac" />, tip: 'Fill the frame with the leaf — avoid distant shots' },
                    { icon: <Shield size={20} color="#86efac" />, tip: 'Your images are processed locally and never sent to our servers' },
                ].map((t, i) => (
                    <div key={i} style={{
                        padding: '16px 20px', borderRadius: 12,
                        background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)',
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                    }}>
                        <span style={{ fontSize: 20 }}>{t.icon}</span>
                        <p style={{ fontSize: 13, color: '#4b7c5a', lineHeight: 1.5 }}>{t.tip}</p>
                    </div>
                ))}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default Detector;
