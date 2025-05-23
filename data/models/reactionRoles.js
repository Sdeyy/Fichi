const mongoose = require('mongoose')

const reactionRoles = new mongoose.Schema ({
    guildID: String,
    roles: Array,
})

module.exports = mongoose.model('reactionRoles', reactionRoles)