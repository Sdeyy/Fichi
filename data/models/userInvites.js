const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    userId: String,
    invites: { type: Number, default: 0 }
})

const model = mongoose.model('userInvites', inviteSchema);

module.exports = model;