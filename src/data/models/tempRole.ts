import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const tempRoleSchema = new Schema({
	guildId: { type: String, required: true },
	userId: { type: String, required: true },
	roleId: { type: String, required: true },
	expiresAt: { type: Date, required: true },
});

export type TempRoleDocument = InferSchemaType<typeof tempRoleSchema>;

const TempRole: Model<TempRoleDocument> =
	(mongoose.models.tempRole as Model<TempRoleDocument>) ??
	model<TempRoleDocument>('tempRole', tempRoleSchema);

export default TempRole;
