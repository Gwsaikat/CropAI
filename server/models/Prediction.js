const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        disease: { type: String, required: true },
        crop: { type: String, required: true },
        confidence: { type: Number, required: true },
        topPredictions: [
            {
                disease: String,
                confidence: Number,
            },
        ],
        imageHash: { type: String }, // SHA256 hash of image (not the image itself)
        location: {
            region: { type: String },
            state: { type: String },
            coordinates: {
                lat: { type: Number },
                lng: { type: Number },
            },
        },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        modelVersion: { type: String, default: '1.0' },
        inferenceTimeMs: { type: Number },
        sharedForFederated: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Prediction', predictionSchema);
