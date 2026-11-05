import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const reactionRolesSchema = new Schema({
	guildID: { type: String, required: true },
	roles: {
		type: [
			new Schema(
				{
					roleId: String,
					roleDescription: { type: String, default: null },
					roleEmoji: { type: String, default: null },
				},
				{ _id: false },
			),
		],
		default: [],
	},
});

export type ReactionRolesDocument = InferSchemaType<typeof reactionRolesSchema>;

const ReactionRoles: Model<ReactionRolesDocument> =
	(mongoose.models.reactionRoles as Model<ReactionRolesDocument>) ??
	model<ReactionRolesDocument>('reactionRoles', reactionRolesSchema);

export default ReactionRoles;
