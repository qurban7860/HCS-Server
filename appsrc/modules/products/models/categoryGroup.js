const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
        name: { type: String, required: true, unique: true },
        category: { type: Schema.Types.ObjectId , ref: 'MachineCategory' },
        isDefault: { type: Boolean, default:false }
    },
    {
        collection: 'CategoryGroups'
    }
);
docSchema.set('timestamps', true);


docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);


docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('CategoryGroup', docSchema);
