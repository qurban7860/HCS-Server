const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;
const customerSchema = new Schema({
        name: { type: String, required: true },

        tradingName: { type: String },

        mainSite: { type: Schema.Types.ObjectId, ref: 'sites' },

        sites: [{ type: Schema.ObjectId, ref: 'sites' }],

        contacts: [{ type: Schema.ObjectId, ref: 'contacts' }],

        accountManager: { type: Schema.Types.ObjectId, ref: 'users' },

        projectManager: { type: Schema.Types.ObjectId, ref: 'users' },

        supportManager: { type: Schema.Types.ObjectId, ref: 'users' },

        isDisabled: { type: Boolean, default: false },

        isArchived: { type: Boolean, default: false },

        createdAt: { type: Date, default: Date.now, required: true },

        updatedAt: { type: Date, default: Date.now, required: true }
},
        {
                collection: 'Customers'
        });

customerSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Customer', customerSchema);