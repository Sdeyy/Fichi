async function newTicket(totalopenTickets, ticketDB, guildID) {
    if (totalopenTickets = 0) {
        await ticketDB.findOneAndUpdate({ guildID: guildID }, { $set: { totalopenTickets: 1 } })
    } else {
        await ticketDB.findOneAndUpdate({ guildID: guildID }, { $inc: { totalopenTickets: 1 } })
        let dataNum = await ticketDB.findOne({ guildID: guildID })
        const zeroPad = (num, places) => String(num).padStart(places, '0')
        var newTicket = zeroPad(dataNum.totalopenTickets, 1);
    }
    return newTicket;
}

module.exports = newTicket;