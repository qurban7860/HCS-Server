const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({
    document: { type: Schema.Types.ObjectId, ref: 'Document' },
    // document information 

    documentVersion: { type: Schema.Types.ObjectId, ref: 'DocumentVersion' },
    // document information 

    documentFile: { type: Schema.Types.ObjectId, ref: 'DocumentFile' },
    // document information 

    documentCategory: { type: Schema.Types.ObjectId, ref: 'DocumentCategory' },
    // document information 

    documentType: { type: Schema.Types.ObjectId, ref: 'DocumentType' },
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

docSchema.index({"document":1})
docSchema.index({"documentType":1})
docSchema.index({"documentCategory":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('DocumentAuditLog', docSchema);
