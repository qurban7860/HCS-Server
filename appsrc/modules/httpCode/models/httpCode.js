const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
    subject: { type: String, required: true },
    internalCode: { type: Number, required: true },
    userCode: { type: Number, required: true },
    slug: { type: String, required: true },
    description: { type: String },
},
    {
        collection: 'HttpCode'
    });

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({ "isActive": 1 })
docSchema.index({ "isArchived": 1 })

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('HttpCodes', docSchema);