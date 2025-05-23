
const mongoose = require('mongoose')

const statistics = new mongoose.Schema ({
    guildID: String,
    ticketsOpen: {type: Number, default: 0},
    ticketsClaimed: {type: Number, default: 0},

})

module.exports = mongoose.model('stats', statistics)