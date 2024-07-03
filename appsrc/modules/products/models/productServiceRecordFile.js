const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        machineServiceRecord: [{ type: Schema.Types.ObjectId , ref: 'MachineServiceRecords' }],
        // machine service record

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

        machine: { type: Schema.Types.ObjectId , ref: 'Machine' },
        // machine information.

},
{
        collection: 'MachineServiceRecordsFiles'
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

module.exports = mongoose.model('MachineServiceRecordFile', docSchema);