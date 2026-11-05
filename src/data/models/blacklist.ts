import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const usersBlacklistedSchema = new Schema({
	guildID: { type: String, required: true },
	userID: { type: String, required: true },
	reason: String,
});

export type BlacklistDocument = InferSchemaType<typeof usersBlacklistedSchema>;

const Blacklist: Model<BlacklistDocument> =
	(mongoose.models.usersBlacklisted as Model<BlacklistDocument>) ??
	model<BlacklistDocument>('usersBlacklisted', usersBlacklistedSchema);

export default Blacklist;
