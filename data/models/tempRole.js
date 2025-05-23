const mongoose = require('mongoose')

const tempRoleSchema = new mongoose.Schema ({
    guildId: String,
    userId: String,
    roleId: String,
    expiresAt: Date,
})

module.exports = mongoose.model('tempRole', tempRoleSchema)