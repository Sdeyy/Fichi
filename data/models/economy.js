const mongoose = require('mongoose');

const ecoSchema = new mongoose.Schema({
    userID: {type: String, require: true, unique: true},
    money: {type: Number, default: 500},
    bank: {type: Number, default: 100},
    daily: String,
    work: String,
    inventory: {type: Array, default: []}, // array of itemIDs
    badges: {type: Array, default: []}, // array of badge names
    totalEarned: {type: Number, default: 0},
    totalSpent: {type: Number, default: 0},
})

const model = mongoose.model("economy", ecoSchema);

module.exports = model;
