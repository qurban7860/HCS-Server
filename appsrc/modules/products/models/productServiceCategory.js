const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
    name: { type: String, required: true, unique: true },
    // name of model 
    description: { type: String, },
    // description of model
    },
    {
        collection: 'MachineServiceCategories'
    }
);
docSchema.set('timestamps', true);


docSchema.index({"name":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})


docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);


docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineServiceCategories', docSchema);
