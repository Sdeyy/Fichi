const mongoose = require('mongoose')

const usersBlacklisted = new mongoose.Schema ({
    guildID: String,
    userID: String,
    reason: String
})

module.exports = mongoose.model('usersBlacklisted', usersBlacklisted)