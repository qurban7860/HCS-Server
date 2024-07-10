const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        machine: { type: Schema.Types.ObjectId , ref: 'Machine', required: true },
        // machine information.

        serviceRecord: { type: Schema.Types.ObjectId , ref: 'MachineServiceRecord', required: true},
        // service record id.
        
        serviceId: { type: Schema.Types.ObjectId , ref: 'MachineServiceRecord' },
        // purpose is to maintain parent service record config uuid
        
        machineCheckItem: {type: Schema.Types.ObjectId , ref: 'MachineCheckItems', required: true},
        //checkitem reference id
        
        checkItemListId: {type: Schema.Types.ObjectId , ref: 'MachineServiceRecordConfig.checkItemLists', required: true}, 
        //this will refer to the list to which checkitem is belong to,

        name: { type: String },
        // name/title of field

        path: { type: String },
        // file path 

        fileType: {type: String, required: true},
        // image, video, text, word, excel, pdf , etc. 

        extension: {type: String},
        // file extension.

        thumbnail: {type: String},
        // thumbnail generated and saved in db

        awsETag: { type: String },
        // file path 

        eTag: { type: String },
        // file path 

},
{
        collection: 'MachineServiceRecordValueFiles'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"name":1})
docSchema.index({"machineServiceRecord":1})
docSchema.index({"machine":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineServiceRecordValueFile', docSchema);