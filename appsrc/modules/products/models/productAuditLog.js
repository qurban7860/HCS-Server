const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const baseSchema = require('../../../base/baseSchema');


const Schema = mongoose.Schema;

const docSchema = new Schema({
    recordType: {
        type: String,
        enum: ['PRODUCT', 'PRODUCTCATEGORY', 'PRODUCTLICENSE', 'PRODUCTMODEL', 'PRODUCTSTATUS', 'PRODUCTSUPPLIER',
            'PRODUCTTECHPARAM', 'PRODUCTTECHPARAMCATEGORY', 'PRODUCTTECHPARAMVALUE', 'PRODUCTTOOL'
            , 'PRODUCTTOOLINSTALLED', 'PRODUCTCONNECTION', 'PRODUCTDRAWING', 'PRODUCTCHECKITEM', 'PRODUCTSERVICERECORDSCONFIG',
            'PRODUCTSERVICERECORDS', 'PRODUCTCHECKITEMCATEGORY', 'PRODUCTPROFILE', 'PRODUCTSERVICERECORDVALUE', 'CATEGORYGROUP'],
        default: 'OTHER'
    },

    machine: { type: Schema.Types.ObjectId, required: true, ref: 'Machine' },

    globelMachineID: { type: Schema.Types.ObjectId, required: true, ref: 'Machine' },

    customer: { type: Schema.Types.ObjectId, required: true, ref: 'Customer' },

    activityType: {
        type: String,
        enum: ['CREATE', 'UPDATE', 'ARCHIVE', 'TRANSFERRED'],
        default: 'OTHER'
    },

    activitySummary: {
        type: String
    },

    newObject: { type: Schema.Types.Mixed },
    oldObject: { type: Schema.Types.Mixed },
    objectDifference: { type: Schema.Types.Mixed }
},
    {
        collection: 'MachineAuditLogs'
    });
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({ "machine": 1 })

module.exports = mongoose.model('MachineAuditLog', docSchema);
