const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    inviterId: String,
    inviteeId: String,
    inviteCode: String,
    timestamp: { type: Date, default: Date.now }
})

const model = mongoose.model('invites', inviteSchema);

module.exports = model;