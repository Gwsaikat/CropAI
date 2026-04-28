const mongoose = require('mongoose');

const federatedRoundSchema = new mongoose.Schema(
    {
        roundNumber: { type: Number, required: true },
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        participantCount: { type: Number, default: 0 },
        weightDeltas: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                deltaHash: { type: String }, // Hash of submitted weights
                submittedAt: { type: Date },
            },
        ],
        globalModelAccuracy: { type: Number },
        modelVersion: { type: String },
        status: { type: String, enum: ['open', 'aggregating', 'complete'], default: 'open' },
        aggregationMethod: { type: String, default: 'FedAvg' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('FederatedRound', federatedRoundSchema);
