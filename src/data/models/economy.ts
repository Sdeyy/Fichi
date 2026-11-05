import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const economySchema = new Schema({
	userID: { type: String, required: true, unique: true },
	money: { type: Number, default: 500 },
	bank: { type: Number, default: 100 },
	daily: { type: String, default: null },
	work: { type: String, default: null },
	inventory: { type: [String], default: [] },
	badges: { type: [String], default: [] },
	totalEarned: { type: Number, default: 0 },
	totalSpent: { type: Number, default: 0 },
});

export type EconomyDocument = InferSchemaType<typeof economySchema>;

const Economy: Model<EconomyDocument> =
	(mongoose.models.economy as Model<EconomyDocument>) ??
	model<EconomyDocument>('economy', economySchema);

export default Economy;
