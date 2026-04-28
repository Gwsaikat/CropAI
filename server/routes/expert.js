const express = require('express');
const supabase = require('../config/supabase');
const ai = require('../services/ai');
const { protect } = require('../middleware/auth');
const router = express.Router();

const EXPERTS_LIST = [
    { id: 'e1', name: 'Dr. Priya Sharma', specialization: 'Rice & Wheat Diseases', institution: 'ICAR-CRRI, Cuttack', languages: ['Hindi', 'English', 'Odia'], available: true },
    { id: 'e2', name: 'Dr. Rajesh Kumar', specialization: 'Vegetable Crop Pathology', institution: 'Punjab Agriculture University', languages: ['Punjabi', 'Hindi', 'English'], available: true },
    { id: 'e3', name: 'Dr. Meena Patel', specialization: 'Cotton & Maize Diseases', institution: 'CICR, Nagpur', languages: ['Gujarati', 'Hindi', 'English'], available: false },
    { id: 'e4', name: 'Dr. Arjun Reddy', specialization: 'Foliar Diseases & Biocontrol', institution: 'ANGRAU, Hyderabad', languages: ['Telugu', 'English'], available: true },
];

// GET /api/expert/list — Available experts
router.get('/list', (req, res) => {
    res.json({ experts: EXPERTS_LIST });
});

// POST /api/expert/connect — Request expert consultation (with AI pre-diagnosis)
router.post('/connect', protect, async (req, res) => {
    try {
        const { name, email, disease, crop, message, predictionId, expertId } = req.body;

        // Get AI diagnosis first
        const diagnosis = await ai.getDiagnosis(crop || 'target crop', disease, message);

        const { data: request, error } = await supabase
            .from('expert_requests')
            .insert({
                farmer_id: req.userId,
                name,
                email,
                disease,
                message,
                prediction_id: predictionId || null,
                status: 'pending',
                ai_diagnosis: diagnosis,
            })
            .select()
            .single();

        if (error) return res.status(500).json({ message: error.message });

        res.status(201).json({
            message: 'Consultation request submitted! AI has provided an initial assessment while you wait for a human expert.',
            requestId: request.id,
            aiDiagnosis: diagnosis,
            estimatedResponse: '24 hours',
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/expert/requests — User's consultation history
router.get('/requests', protect, async (req, res) => {
    try {
        const { data: requests, error } = await supabase
            .from('expert_requests')
            .select('*')
            .eq('farmer_id', req.userId)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ message: error.message });

        res.json({ requests: requests || [] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
