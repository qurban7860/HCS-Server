const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');


const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
                customer: { type: Schema.Types.ObjectId, ref: 'customers' },               
                site: { type: Schema.Types.ObjectId, ref: 'customersites' },               
                contact: { type: Schema.Types.ObjectId, ref: 'customercontacts' },               
                user: { type: Schema.Types.ObjectId, ref: 'users' },               
                note: { type: Schema.Types.ObjectId, ref: 'customernotes' },               
                activityType: {type: String},               
                activitySummary:{type: String, required: true},               
                activityDetail:{type: String, required: true},               
                createdAt: { type: Date , default: Date.now, required: true },               
                createdBy: { type: Schema.ObjectId , ref: 'users'},               
                createdIP: { type: String }
});

auditLogSchema.plugin(uniqueValidator);

module.exports = mongoose.model('CustomerAuditLog', auditLogSchema);
