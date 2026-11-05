import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const statisticsSchema = new Schema({
	guildID: { type: String, required: true },
	ticketsOpen: { type: Number, default: 0 },
	ticketsClaimed: { type: Number, default: 0 },
});

export type StatisticsDocument = InferSchemaType<typeof statisticsSchema>;

const Statistics: Model<StatisticsDocument> =
	(mongoose.models.stats as Model<StatisticsDocument>) ??
	model<StatisticsDocument>('stats', statisticsSchema);

export default Statistics;
