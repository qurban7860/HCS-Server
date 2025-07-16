const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        ipAddress: { type: String, required: true },
        customer: { type: Schema.ObjectId, ref: 'Customer', required: true },
        user: { type: Schema.ObjectId, ref: 'SecurityUser', required: true },
        application: { type: String, required: true },
        description: { type: String },
},
        {
                collection: 'SecurityConfigWhiteListIPs'
        });

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('SecurityConfigWhiteListIP', docSchema);