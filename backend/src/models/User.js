const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    name: {
        type: String,
        trim: true,
        default: ''
    },
    passwordHash: {
        type: String,
        required: true
    },
    // Relacionado con Ley 25.326: ID anónimo opaco para métricas (evidenciando separación)
    anonymousId: {
        type: String,
        required: true,
        unique: true,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
