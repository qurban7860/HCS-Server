const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const notesSchema = new Schema({
        customer: { type: Schema.Types.ObjectId, ref: 'customers' },
        site: { type: Schema.Types.ObjectId, ref: 'customersites' },
        contact: { type: Schema.Types.ObjectId, ref: 'customercontacts' },
        user: { type: Schema.Types.ObjectId, ref: 'users' },
        note: { type: String },
        isArchived: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now, required: true },
        updatedAt: { type: Date, default: Date.now, required: true }
});

notesSchema.plugin(uniqueValidator);

module.exports = mongoose.model('CustomerNote', notesSchema);
