const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);

const Schema = mongoose.Schema;

const machineCategorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    // name of model 

    description: { type: String },
    // description of model
    },
    {
        collection: 'MachineCategories'
    }
);

const docAuditSchema = require('./baseSchema');
machineCategorySchema.add(docAuditSchema);

machineCategorySchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineCategory', machineCategorySchema);
