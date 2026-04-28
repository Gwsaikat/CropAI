const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const ai = require('../services/ai');
const router = express.Router();

// POST /api/predict/save — Save a prediction result
router.post('/save', protect, async (req, res) => {
    try {
        const {
            disease, crop, confidence, topPredictions,
            location, severity, modelVersion, inferenceTimeMs, imageHash,
        } = req.body;

        const { data, error } = await supabase.from('predictions').insert({
            user_id: req.userId,
            disease,
            crop,
            confidence,
            top_predictions: topPredictions || [],
            location: location || {},
            severity: severity || 'medium',
            model_version: modelVersion || '1.0',
            inference_time_ms: inferenceTimeMs,
            image_hash: imageHash,
        }).select().single();

        if (error) return res.status(500).json({ message: error.message });

        res.status(201).json({ prediction: data });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/predict/analyze — Analyze an image using Gemini Vision
router.post('/analyze', protect, async (req, res) => {
    try {
        const { imageBase64, mimeType } = req.body;
        if (!imageBase64) return res.status(400).json({ message: 'Image data is required' });

        // Ensure no data URI prefix is passed to Gemini
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const analysis = await ai.analyzeImage(base64Data, mimeType || 'image/jpeg');

        // Map to format frontend expects (like old simulated results)
        const mappedResult = {
            key: (analysis.disease || 'healthy').toLowerCase().replace(/\s+/g, '_'),
            label: analysis.label || `${analysis.crop} ${analysis.disease}`,
            crop: analysis.crop || 'Unknown Crop',
            severity: analysis.severity || 'low',
            confidence: analysis.confidence || 0.85
        };

        res.json({ result: [mappedResult] });
    } catch (err) {
        console.error('Prediction Analyze Error:', err);
        res.status(500).json({ message: 'Failed to analyze image with AI' });
    }
});

// GET /api/predict/history — User's prediction history with pagination
router.get('/history', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data: predictions, error, count } = await supabase
            .from('predictions')
            .select('*', { count: 'exact' })
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) return res.status(500).json({ message: error.message });

        const total = count || 0;
        res.json({
            predictions: predictions || [],
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/predict/stats — Disease/crop breakdown for the current user
router.get('/stats', protect, async (req, res) => {
    try {
        const { data: predictions, error } = await supabase
            .from('predictions')
            .select('disease, crop')
            .eq('user_id', req.userId);

        if (error) return res.status(500).json({ message: error.message });

        const total = predictions?.length || 0;

        // Aggregate by disease
        const diseaseMap = {};
        const cropMap = {};
        (predictions || []).forEach(p => {
            diseaseMap[p.disease] = (diseaseMap[p.disease] || 0) + 1;
            cropMap[p.crop] = (cropMap[p.crop] || 0) + 1;
        });

        const byDisease = Object.entries(diseaseMap)
            .map(([_id, count]) => ({ _id, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const byCrop = Object.entries(cropMap)
            .map(([_id, count]) => ({ _id, count }));

        res.json({ total, byDisease, byCrop });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
