const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET /api/federated/global-model — Latest completed round info
router.get('/global-model', async (req, res) => {
    try {
        const { data: round, error } = await supabase
            .from('federated_rounds')
            .select('round_number, model_version, global_model_accuracy, participant_count, status')
            .eq('status', 'complete')
            .order('round_number', { ascending: false })
            .limit(1)
            .single();

        if (error || !round) {
            // Return baseline if no rounds exist yet
            return res.json({
                round: 0,
                modelVersion: '1.0.0',
                accuracy: 85.3,
                participants: 0,
                modelUrl: '/models/mobilenet_v3_small/model.json',
                status: 'baseline',
            });
        }

        res.json({
            round: round.round_number,
            modelVersion: round.model_version,
            accuracy: round.global_model_accuracy,
            participants: round.participant_count,
            modelUrl: '/models/mobilenet_v3_small/model.json',
            status: round.status,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/federated/update — Submit weight delta for federated learning
router.post('/update', protect, async (req, res) => {
    try {
        const { roundNumber, deltaHash, localAccuracy } = req.body;

        // Find an open round or create one
        let { data: round } = await supabase
            .from('federated_rounds')
            .select('*')
            .eq('round_number', roundNumber)
            .eq('status', 'open')
            .single();

        if (!round) {
            // Find highest existing round number
            const { data: lastRound } = await supabase
                .from('federated_rounds')
                .select('round_number')
                .order('round_number', { ascending: false })
                .limit(1)
                .single();

            const newRoundNumber = lastRound ? lastRound.round_number + 1 : 1;

            const { data: newRound, error: createError } = await supabase
                .from('federated_rounds')
                .insert({
                    round_number: newRoundNumber,
                    status: 'open',
                    model_version: `1.0.${newRoundNumber}`,
                    participant_count: 0,
                    participants: [],
                    weight_deltas: [],
                })
                .select()
                .single();

            if (createError) return res.status(500).json({ message: createError.message });
            round = newRound;
        }

        // Skip if user already participated in this round
        const alreadyJoined = (round.participants || []).includes(req.userId);
        if (!alreadyJoined) {
            const updatedParticipants = [...(round.participants || []), req.userId];
            const updatedDeltas = [
                ...(round.weight_deltas || []),
                { userId: req.userId, deltaHash, submittedAt: new Date().toISOString() },
            ];
            const newCount = round.participant_count + 1;

            // Simulate FedAvg threshold: complete at 5 participants
            const shouldComplete = newCount >= 5;
            const newAccuracy = shouldComplete
                ? Math.min(96, 85 + newCount * 0.1 + Math.random() * 2)
                : round.global_model_accuracy;

            const { data: updatedRound, error: updateError } = await supabase
                .from('federated_rounds')
                .update({
                    participants: updatedParticipants,
                    participant_count: newCount,
                    weight_deltas: updatedDeltas,
                    status: shouldComplete ? 'complete' : 'open',
                    global_model_accuracy: newAccuracy,
                })
                .eq('id', round.id)
                .select()
                .single();

            if (updateError) return res.status(500).json({ message: updateError.message });
            round = updatedRound;

            // Increment user's participation count
            await supabase.rpc('increment_federated_count', { user_id: req.userId }).catch(() => {
                // Fallback: direct update if RPC not available
                supabase
                    .from('users')
                    .update({ federated_rounds_participated: (round.participant_count) })
                    .eq('id', req.userId);
            });

            // Emit real-time update via socket.io
            const io = req.app.get('io');
            if (io && round.status === 'complete') {
                io.emit('model-updated', {
                    round: round.round_number,
                    accuracy: round.global_model_accuracy,
                    participants: round.participant_count,
                    timestamp: new Date().toISOString(),
                });
            }
        }

        res.json({
            message: 'Weight delta submitted successfully',
            roundNumber: round.round_number,
            participantCount: round.participant_count,
            status: round.status,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/federated/rounds — Completed round history
router.get('/rounds', async (req, res) => {
    try {
        const { data: rounds, error } = await supabase
            .from('federated_rounds')
            .select('round_number, participant_count, global_model_accuracy, model_version, created_at')
            .eq('status', 'complete')
            .order('round_number', { ascending: false })
            .limit(50);

        if (error) return res.status(500).json({ message: error.message });

        res.json({ rounds: rounds || [] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
