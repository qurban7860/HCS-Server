const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const customerSchema = new Schema({
    name: { type: String, required: true },
    tradingname: { type: String },
    defaultSite: {
        type: Schema.Types.ObjectId,
        ref: 'Sites'
    },
    // sites: [{ type: schema.ObjectId, ref: sites }],
    // contacts: [{ type: schema.ObjectId, ref: contacts }],
    isArchived: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, required: true },
    updatedAt: { type: Date, dfault: Date.now, required: true }
});

customerSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Customer', customerSchema);