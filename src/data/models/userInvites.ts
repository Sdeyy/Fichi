import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const userInvitesSchema = new Schema({
	userId: { type: String, required: true, unique: true },
	invites: { type: Number, default: 0 },
});

export type UserInvitesDocument = InferSchemaType<typeof userInvitesSchema>;

const UserInvites: Model<UserInvitesDocument> =
	(mongoose.models.userInvites as Model<UserInvitesDocument>) ??
	model<UserInvitesDocument>('userInvites', userInvitesSchema);

export default UserInvites;
