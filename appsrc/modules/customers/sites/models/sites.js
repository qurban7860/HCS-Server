const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);

const Schema = mongoose.Schema;

const sitesSchema = new Schema({
    customerId: { type: Schema.Types.ObjectId, ref: 'customers' },
    name: { type: String, required: true },
    billingSite: { type: Schema.Types.ObjectId, ref: 'customersites' },
    phone: { type: String },
    email: { type: String },
    fax: { type: String },
    website: { type: String },
    address: {
        street: { type: String },
        suburb: { type: String },
        city: { type: String },
        region: { type: String },
        postcode: { type: String },
        country: { type: String }

    },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'customercontacts' }],
    isDisabled: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, required: true },
    updatedAt: { type: Date, default: Date.now, required: true }
});

sitesSchema.plugin(uniqueValidator);

module.exports = mongoose.model('CustomerSite', sitesSchema);
