const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        machine: { type: Schema.Types.ObjectId , ref: 'Machine' },
        // machine information.

        machineServiceReport: [{ type: Schema.Types.ObjectId , ref: 'MachineServiceReport', required: true }],
        // machine service Report current version 

        primaryServiceReportId: { type: Schema.Types.ObjectId , ref: 'MachineServiceReport', required: true  },
        // machine service Report parent

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

        isReportDoc: { type: Boolean, default: false },
        // file path 

},
{
        collection: 'MachineServiceReportFiles'
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

module.exports = mongoose.model('MachineServiceReportFile', docSchema);