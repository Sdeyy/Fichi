import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const inviteSchema = new Schema({
	inviterId: String,
	inviteeId: String,
	inviteCode: String,
	timestamp: { type: Date, default: Date.now },
});

export type InviteDocument = InferSchemaType<typeof inviteSchema>;

const Invite: Model<InviteDocument> =
	(mongoose.models.invites as Model<InviteDocument>) ??
	model<InviteDocument>('invites', inviteSchema);

export default Invite;
