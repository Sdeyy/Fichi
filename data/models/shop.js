const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    itemID: {type: String, require: true, unique: true},
    name: {type: String, require: true},
    description: {type: String, require: true},
    price: {type: Number, require: true},
    type: {type: String, require: true, enum: ['role', 'badge']}, // role or badge
    value: {type: String, require: true}, // roleID or badgeName
})

const model = mongoose.model("shop", shopSchema);

module.exports = model;
