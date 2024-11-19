const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        machine: { type: Schema.Types.ObjectId , ref: 'Machine' },
        // machine information.

        serviceReport: { type: Schema.Types.ObjectId , ref: 'MachineServiceReport', required: true},
        // service Report id.
        
        machineCheckItem: {type: Schema.Types.ObjectId , ref: 'MachineCheckItem', required: true},
        //checkitem reference id
        
        checkItemListId: {type: Schema.Types.ObjectId , ref: 'MachineServiceReportTemplate.checkItemLists', required: true }, 
        //this will refer to the list to which checkitem is belong to,

        name: { type: String },
        // name/title of field

        path: { type: String },
        // file path 

        fileType: {type: String },
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
        collection: 'MachineServiceReportValueFiles'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"name":1})
docSchema.index({"machineServiceReport":1})
docSchema.index({"machine":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineServiceReportValueFile', docSchema);