const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');


const Schema = mongoose.Schema;

const contactSchema = new Schema({
        customerId: { type: Schema.Types.ObjectId, ref: 'customers' },       
        firstName: { type: String, required: true},       
        lastName: { type: String, required: true },       
        title: { type: String },       
        contactTypes: [],   
        phone: { type: String },       
        email: { type: String },       
        isPrimary: { type: Boolean },          
        isDisabled: { type: Boolean, default: false },       
        isArchived: { type: Boolean, default: false },       
        createdAt: { type: Date , default: Date.now, required: true }, 
        updatedAt: { type: Date , default: Date.now, required: true }
});

contactSchema.plugin(uniqueValidator);

module.exports = mongoose.model('CustomerContact', contactSchema);
