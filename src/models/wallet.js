const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    deposit: {
        type: Number,
        required: true,
        default: 0
    },
    bonus: {
        type: Number,
        required: true,
        default: 0
    },
    wining: {
        type: Number,
        required: true,
        default: 0
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
        required: true,
        ref: 'User'
    },
}, {
    timestamp: true
})

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;