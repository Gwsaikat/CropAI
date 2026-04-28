const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        specialization: { type: String },
        farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        disease: { type: String },
        message: { type: String },
        status: { type: String, enum: ['pending', 'contacted', 'resolved'], default: 'pending' },
        aiDiagnosis: { type: String },
        predictionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Expert', expertSchema);
