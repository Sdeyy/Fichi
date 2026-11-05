import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const shopSchema = new Schema({
	itemID: { type: String, required: true, unique: true },
	name: { type: String, required: true },
	description: { type: String, required: true },
	price: { type: Number, required: true },
	type: { type: String, required: true, enum: ['role'] },
	value: { type: String, required: true },
});

export type ShopDocument = InferSchemaType<typeof shopSchema>;

const Shop: Model<ShopDocument> =
	(mongoose.models.shop as Model<ShopDocument>) ?? model<ShopDocument>('shop', shopSchema);

export default Shop;
