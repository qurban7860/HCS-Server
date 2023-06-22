const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        name: { type: String, required: true, unique: true },
        // name/title of field

        description: { type: String },
        // detailed description of field

        docCategory: { type: Schema.Types.ObjectId , ref: 'DocumentCategory' },
        // document category.

        customerAccess: {type: Boolean, default: false},
        //can customer access documents and files under this type.
},
{
        collection: 'DocumentTypes'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"name":1})
docSchema.index({"docCategory":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('DocumentType', docSchema);