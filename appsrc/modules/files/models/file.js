const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        name: { type: String },
        // name/title of field

        displayName: { type: String },
        // name/title to print at reports. default is same as name 

        description: { type: String },
        // detailed description of field

        path: { type: String },
        // file path 

        type: { type: String, required: true },
        // image, video, text, word, excel, pdf , etc. 

        extension: { type: String },
        // file extension.

        uri: { type: String  },
        // file content to save in database

        isActiveVersion: {type: Boolean, default: true},


        documentName: { type: Schema.Types.ObjectId, ref: 'DocumentName' },
        // document name.

        documentVersion: { type: Number },
        // version number. It will be increased based on customer, machine, etc.

        category: { type: Schema.Types.ObjectId, ref: 'FileCategory' },
        // file category.

        customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
        // customer information.

        customerAccess: { type: Boolean, default: false },
        //can customer access this doocument. 

        site: { type: Schema.Types.ObjectId, ref: 'CustomerSite' },
        // site information.

        contact: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },
        // contact information.

        user: { type: Schema.Types.ObjectId, ref: 'SecurityUser' },
        // contact information.

        machine: { type: Schema.Types.ObjectId, ref: 'Machine' },
        // machine information.

},
{
        collection: 'Files'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('File', docSchema);