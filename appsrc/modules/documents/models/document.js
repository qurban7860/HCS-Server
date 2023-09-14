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

        docType: { type: Schema.Types.ObjectId , ref: 'DocumentType' },
        // document name.

        docCategory: { type: Schema.Types.ObjectId , ref: 'DocumentCategory' },
        // document category.

        versionPrefix: { type: String },
        //prefix of version like v.

        documentVersions: [{ type: Schema.Types.ObjectId , ref: 'DocumentVersion' }],
        // list of versions. 

        referenceNumber: { type: String },
        
        customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
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

        machineModel: { type: Schema.Types.ObjectId , ref: 'MachineModel' },
        // machine information.

        shippingDate: { type: Date },
        // lshipping date

        installationDate: { type: Date },
        // installation date
},
{
        collection: 'Documents'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"name":1})
docSchema.index({"customer":1})
docSchema.index({"docType":1})
docSchema.index({"docCategory":1})
docSchema.index({"site":1})
docSchema.index({"machine":1})
docSchema.index({"machineModel":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})


docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Document', docSchema);