import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const ticketItemSchema = new Schema(
	{
		customID: { type: String, required: true },
		ticketName: { type: String, required: true },
		ticketDescription: { type: String, required: true },
		ticketCategory: { type: String, required: true },
		ticketEmoji: { type: String, required: true },
		ticketStyle: { type: String, required: true },
		ticketRoles: { type: [String], default: [] },
	},
	{ _id: false },
);

const ticketSchema = new Schema({
	guildID: { type: String, required: true },
	staffRole: String,
	adminRole: String,
	channelLog: String,
	tickets: { type: [ticketItemSchema], default: [] },
	ticketCounter: { type: Number, default: 0 },
});

export type TicketItem = InferSchemaType<typeof ticketItemSchema>;
export type TicketDocument = InferSchemaType<typeof ticketSchema>;

const TicketDB: Model<TicketDocument> =
	(mongoose.models.ticketsDB as Model<TicketDocument>) ??
	model<TicketDocument>('ticketsDB', ticketSchema);

export default TicketDB;
