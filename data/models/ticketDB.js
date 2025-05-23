const mongoose = require('mongoose')

const ticketDB = new mongoose.Schema ({
    guildID: String,
    staffRole: String,
    adminRole: String,
    tickets: Array,
    ticketCounter: Number,
})

module.exports = mongoose.model('ticketsDB', ticketDB)