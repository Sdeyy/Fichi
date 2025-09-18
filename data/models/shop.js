const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    itemID: {type: String, require: true, unique: true},
    name: {type: String, require: true},
    description: {type: String, require: true},
    price: {type: Number, require: true},
    type: {type: String, require: true, enum: ['role']},
    value: {type: String, require: true},
})

const model = mongoose.model("shop", shopSchema);

module.exports = model;
