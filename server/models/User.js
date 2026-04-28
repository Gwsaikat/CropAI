const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, minlength: 6 },
        region: { type: String, default: 'Unknown' },
        state: { type: String, default: '' },
        farmSize: { type: Number, default: 0 }, // in acres
        crops: [{ type: String }],
        federatedRoundsParticipated: { type: Number, default: 0 },
        role: { type: String, enum: ['farmer', 'expert', 'admin'], default: 'farmer' },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
