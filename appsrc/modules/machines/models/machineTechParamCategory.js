const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const machineTechParamCategorySchema = new Schema({
    name: { type: String , required: true, unique: true },
    // name of TechnicalParam 
    
    description: { type: String },
    // description of TechnicalParam
},
{
    collection: 'MachineTechParamCategories'
});

const baseSchema = require('./baseSchema');
machineTechParamCategorySchema.add(baseSchema);

machineTechParamCategorySchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineTechParamCategorySchema', machineTechParamCategorySchema);
