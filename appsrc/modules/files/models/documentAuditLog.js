const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({
    document: { type: Schema.Types.ObjectId, required:true, ref: 'Document' },
    // document information 

    activityType: { type: String },
    // action Type (Create, Update, Delete)
    
    activitySummary: { type: String },
    // action summary like Create document, Update document, etc. 
    
    activityDetail: { type: String }
    // action detail - content of changes
    
},
{
    collection: 'DocumentAuditLogs'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('DocumentAuditLog', docSchema);
