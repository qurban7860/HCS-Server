const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        document: { type: Schema.Types.ObjectId , ref: 'Document' },
        // document.
    
        versionNo: { type: Number },
        // version number like 0.1, 0.2, 1.0, 1.1 etc 

        files: [{ type: Schema.Types.ObjectId , ref: 'DocumentFile' }],
        // files attached with this version.

        customer: { type: Schema.Types.ObjectId , ref: 'Customer' },
        // customer information.

        site: { type: Schema.Types.ObjectId , ref: 'CustomerSite' },
        // site information.

        contact: { type: Schema.Types.ObjectId , ref: 'CustomerContact' },
        // contact information.

        user: { type: Schema.Types.ObjectId , ref: 'SecurityUser' },
        // contact information.

        machine: { type: Schema.Types.ObjectId , ref: 'Machine' },
        // machine information.

},
{
        collection: 'DocumentVersions'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('DocumentVersion', docSchema);