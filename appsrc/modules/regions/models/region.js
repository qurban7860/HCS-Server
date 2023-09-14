const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        name: { type: String , required: true },
        
        description: { type: String  },
        // name of organization
        countries: [{ type: Schema.Types.ObjectId, ref: 'Country' }],
},
{
        collection: 'Regions'
});

docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.set('timestamps', true);

docSchema.index({"name":1})
docSchema.index({"countries":1})

module.exports = mongoose.model('Region', docSchema);