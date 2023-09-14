const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        document: { type: Schema.Types.ObjectId , ref: 'Document' },
        // document.

        version: { type: Schema.Types.ObjectId , ref: 'DocumentVersion' },
        // document version .

        name: { type: String },
        // name/title of field

        displayName: { type: String },
        // name/title to print at reports. default is same as name 

        description: { type: String },
        // detailed description of field

        path: { type: String },
        // file path 

        fileType: {type: String, required: true},
        // image, video, text, word, excel, pdf , etc. 

        extension: {type: String},
        // file extension.

        thumbnail: {type: String},
        // thumbnail generated and saved in db

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
        collection: 'DocumentFiles'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);


docSchema.index({"name":1})
docSchema.index({"document":1})
docSchema.index({"version":1})
docSchema.index({"customer":1})
docSchema.index({"site":1})
docSchema.index({"machine":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})


docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('DocumentFile', docSchema);