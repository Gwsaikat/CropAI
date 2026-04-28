const express = require('express');
const supabase = require('../config/supabase');
const ai = require('../services/ai');
const router = express.Router();

// GET /api/insights/regional — Community disease trends
router.get('/regional', async (req, res) => {
    try {
        const { state, crop, days = 30 } = req.query;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        let query = supabase
            .from('predictions')
            .select('disease, crop, confidence, location, created_at')
            .gte('created_at', since);

        if (state) query = query.eq('location->>state', state);
        if (crop) query = query.eq('crop', crop);

        const { data: predictions, error } = await query;

        if (error) return res.status(500).json({ message: error.message });

        const preds = predictions || [];

        // Aggregate: disease by region
        const regionMap = {};
        const diseaseCount = {};
        const mapPointsObj = {};

        preds.forEach(p => {
            const loc = p.location || {};
            const region = loc.region || 'Unknown';
            const pState = loc.state || 'Unknown';
            const key = `${region}|${pState}|${p.disease}|${p.crop}`;

            regionMap[key] = regionMap[key] || { region, state: pState, disease: p.disease, crop: p.crop, count: 0, totalConf: 0 };
            regionMap[key].count++;
            regionMap[key].totalConf += p.confidence;

            diseaseCount[p.disease] = diseaseCount[p.disease] || { disease: p.disease, crop: p.crop, count: 0 };
            diseaseCount[p.disease].count++;

            // Map heatmap points
            const lat = loc?.coordinates?.lat;
            const lng = loc?.coordinates?.lng;
            if (lat && lng) {
                const mapKey = `${lat}|${lng}`;
                mapPointsObj[mapKey] = mapPointsObj[mapKey] || { lat, lng, count: 0, disease: p.disease, crop: p.crop };
                mapPointsObj[mapKey].count++;
            }
        });

        const diseaseByRegion = Object.values(regionMap)
            .map(r => ({ ...r, avgConfidence: r.totalConf / r.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 100);

        const topDiseases = Object.values(diseaseCount)
            .map(d => ({ disease: d.disease, count: d.count, crop: d.crop, state: d.state || 'India' }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const mapPoints = Object.values(mapPointsObj);

        // Gemini AI trend summary if data available
        let aiTrendSummary = null;
        if (diseaseByRegion.length > 0) {
            aiTrendSummary = await ai.analyzeTrends(diseaseByRegion);
        }

        res.json({ diseaseByRegion, topDiseases, mapPoints, aiTrendSummary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
