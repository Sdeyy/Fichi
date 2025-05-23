async function getNumber(ticketCounter, ticketDB, guildID) {
    if (ticketCounter === 0) {
        await ticketDB.findOneAndUpdate({ guildID }, { $set: { ticketCounter: 1 } });
    } else {
        await ticketDB.findOneAndUpdate({ guildID }, { $inc: { ticketCounter: 1 } });
    }

    const dataNum = await ticketDB.findOne({ guildID });
    const zeroPad = (num, places) => String(num).padStart(places, '0');
    return zeroPad(dataNum.ticketCounter, 4);
}

module.exports = getNumber;