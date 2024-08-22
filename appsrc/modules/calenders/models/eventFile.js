const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        event: [{ type: Schema.Types.ObjectId , ref: 'Event', required: true }],
        // machine service record current version 

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
        collection: 'EventFiles'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"name":1})
docSchema.index({"event":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('EventFile', docSchema);