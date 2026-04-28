const express = require('express');
const router = express.Router();
const ai = require('../services/ai');

const REMEDIES_DB = {
    'Apple___Apple_scab': {
        disease: 'Apple Scab',
        crop: 'Apple',
        severity: 'medium',
        description: 'Fungal disease causing dark, scabby lesions on leaves and fruit.',
        symptoms: ['Dark olive-green spots on leaves', 'Scabby lesions on fruit', 'Premature leaf drop'],
        causes: ['Venturia inaequalis fungus', 'Wet spring weather', 'Poor air circulation'],
        remedies: [
            { type: 'organic', title: 'Neem Oil Spray', instructions: 'Mix 2 tsp neem oil with 1L water, spray every 7-10 days', effectiveness: 72 },
            { type: 'chemical', title: 'Captan Fungicide', instructions: 'Apply 2g/L at 7-day intervals during wet weather', effectiveness: 88 },
            { type: 'cultural', title: 'Pruning & Air Flow', instructions: 'Prune for open canopy. Remove infected leaves. Avoid overhead watering.', effectiveness: 65 },
        ],
        prevention: ['Choose resistant varieties', 'Apply dormant copper sprays', 'Maintain good sanitation'],
        estimatedYieldLoss: '30-70% if untreated',
    },
    'Tomato___Late_blight': {
        disease: 'Tomato Late Blight',
        crop: 'Tomato',
        severity: 'critical',
        description: 'Devastating oomycete disease that can destroy entire crops within days in humid conditions.',
        symptoms: ['Water-soaked lesions on leaves', 'White mold on leaf undersides', 'Brown-black fruit rot', 'Rapid plant collapse'],
        causes: ['Phytophthora infestans', 'Cool, humid weather (10-25°C)', 'Poor drainage'],
        remedies: [
            { type: 'chemical', title: 'Mancozeb + Metalaxyl', instructions: 'Apply 2.5g/L every 5-7 days preventively during humid weather', effectiveness: 91 },
            { type: 'organic', title: 'Copper-based Fungicide', instructions: 'Spray copper hydroxide 3g/L at 10-day intervals', effectiveness: 78 },
            { type: 'biological', title: 'Trichoderma harzianum', instructions: 'Soil drench + foliar spray every 15 days', effectiveness: 68 },
        ],
        prevention: ['Use certified disease-free seeds', 'Stake plants for air circulation', 'Avoid wetting foliage'],
        estimatedYieldLoss: '70-100% if untreated',
    },
    'Rice___Blast': {
        disease: 'Rice Blast',
        crop: 'Rice',
        severity: 'high',
        description: 'Most destructive rice disease globally, caused by the Magnaporthe oryzae fungus.',
        symptoms: ['Diamond-shaped lesions on leaves', 'Gray center with brown border', 'Node and neck infection', 'Panicle blast causing empty grains'],
        causes: ['Magnaporthe oryzae fungus', 'Excess nitrogen', 'Temperature 25-28°C with high humidity'],
        remedies: [
            { type: 'chemical', title: 'Tricyclazole', instructions: 'Apply 0.6g/L at tillering and heading stages', effectiveness: 92 },
            { type: 'chemical', title: 'Isoprothiolane', instructions: 'Spray 1.5ml/L as foliar application at disease onset', effectiveness: 87 },
            { type: 'organic', title: 'Silicon Amendment', instructions: 'Apply silica-rich fertilizer to strengthen cell walls', effectiveness: 60 },
        ],
        prevention: ['Use blast-resistant varieties (IR-64, Pusa-1121)', 'Balanced nitrogen application', 'Maintain proper water management'],
        estimatedYieldLoss: '50-80% in severe outbreaks',
    },
    'Potato___Late_blight': {
        disease: 'Potato Late Blight',
        crop: 'Potato',
        severity: 'critical',
        description: 'The same disease that caused the Irish Famine. Spreads extremely rapidly.',
        symptoms: ['Water-soaked dark lesions', 'White sporulation on leaf undersides', 'Tuber brown rot', 'Distinctive musty odor'],
        causes: ['Phytophthora infestans', 'Cool moist conditions', 'Infected seed tubers'],
        remedies: [
            { type: 'chemical', title: 'Cymoxanil+Mancozeb', instructions: 'Apply 2g/L preventively every 7 days in wet weather', effectiveness: 90 },
            { type: 'organic', title: 'Copper Oxychloride', instructions: 'Spray 3g/L every 10-14 days', effectiveness: 74 },
        ],
        prevention: ['Plant certified seed tubers', 'Hill soil around plant base', 'Harvest quickly after vines die'],
        estimatedYieldLoss: '100% if untreated in favorable conditions',
    },
    'Corn_(maize)___Northern_Leaf_Blight': {
        disease: 'Northern Leaf Blight',
        crop: 'Maize',
        severity: 'medium',
        description: 'Fungal disease reducing photosynthesis through large leaf lesions.',
        symptoms: ['Long cigar-shaped gray-green lesions', 'Lesions 2.5-15 cm long', 'Upper leaves infected first', 'Grayish sporulation in humid conditions'],
        causes: ['Exserohilum turcicum fungus', 'Moderate temperatures (18-27°C)', 'Extended leaf wetness'],
        remedies: [
            { type: 'chemical', title: 'Propiconazole', instructions: 'Apply 1ml/L at early disease onset, repeat in 14 days', effectiveness: 84 },
            { type: 'cultural', title: 'Crop Rotation', instructions: 'Rotate with non-host crops for 2 seasons', effectiveness: 70 },
        ],
        prevention: ['Plant resistant hybrids', 'Manage crop debris', 'Ensure proper plant spacing'],
        estimatedYieldLoss: '30-50% in severe cases',
    },
    'Wheat___Leaf_rust': {
        disease: 'Wheat Leaf Rust',
        crop: 'Wheat',
        severity: 'high',
        description: 'One of the most widespread wheat diseases worldwide.',
        symptoms: ['Small orange-brown pustules on leaves', 'Yellow halos around pustules', 'Premature leaf death'],
        causes: ['Puccinia triticina fungus', 'Mild temperatures (15-22°C)', 'Humid conditions'],
        remedies: [
            { type: 'chemical', title: 'Tebuconazole', instructions: 'Apply 0.75ml/L at first sign of disease', effectiveness: 89 },
            { type: 'chemical', title: 'Propiconazole', instructions: 'Spray 0.5ml/L as preventive treatment', effectiveness: 85 },
        ],
        prevention: ['Grow rust-resistant varieties', 'Timely sowing', 'Avoid excessive nitrogen'],
        estimatedYieldLoss: '20-40% in susceptible varieties',
    },
};

// GET /api/remedies/:disease - Get treatment info
router.get('/:disease', async (req, res) => {
    const diseaseKey = req.params.disease;
    const remedy = REMEDIES_DB[diseaseKey];

    if (!remedy) {
        // Fallback to Gemini AI for unknown diseases
        try {
            const aiRemedy = await ai.getRemedies('crop', diseaseKey.replace(/___/g, ' on ').replace(/_/g, ' '));
            if (aiRemedy) {
                return res.json({ ...aiRemedy, source: 'Gemini AI Analysis' });
            }
        } catch (err) {
            console.error('AI Fallback Error:', err);
        }

        // Return generic remedy info if AI fails
        return res.json({
            disease: diseaseKey.replace(/_/g, ' ').replace(/___/g, ' - '),
            description: 'Disease detected. Consult your local agricultural extension officer for specific treatment recommendations.',
            remedies: [
                { type: 'cultural', title: 'Remove Infected Parts', instructions: 'Remove and destroy infected plant material immediately', effectiveness: 60 },
                { type: 'chemical', title: 'Broad-spectrum Fungicide', instructions: 'Apply appropriate fungicide per label instructions', effectiveness: 75 },
                { type: 'cultural', title: 'Improve Air Circulation', instructions: 'Ensure proper plant spacing and pruning', effectiveness: 50 },
            ],
            prevention: ['Use certified seeds', 'Practice crop rotation', 'Monitor regularly'],
        });
    }

    res.json(remedy);
});

// GET /api/remedies - List all diseases
router.get('/', (req, res) => {
    const list = Object.entries(REMEDIES_DB).map(([key, val]) => ({
        key,
        disease: val.disease,
        crop: val.crop,
        severity: val.severity,
    }));
    res.json({ diseases: list });
});

module.exports = router;
