import TicketDB from '../data/models/ticketDB';

/**
 * Returns the next ticket number for a guild, padded to 4 digits.
 *
 * Mirrors `functions/numberTicket.js`, but uses an atomic `$inc` so concurrent
 * ticket creations cannot produce duplicated numbers.
 */
export async function nextTicketNumber(guildId: string): Promise<string> {
	const updated = await TicketDB.findOneAndUpdate(
		{ guildID: guildId },
		{ $inc: { ticketCounter: 1 } },
		{ new: true, upsert: true, setDefaultsOnInsert: true },
	).lean();

	const counter = updated?.ticketCounter ?? 1;

	return String(counter).padStart(4, '0');
}

/** Current counter without incrementing it. */
export async function currentTicketCounter(guildId: string): Promise<number> {
	const data = await TicketDB.findOne({ guildID: guildId }).lean();

	return data?.ticketCounter ?? 0;
}
