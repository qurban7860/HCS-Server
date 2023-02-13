const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
    name: { type: String , required: true, unique: true },
    // name of TechnicalParam 
    
    code: { type: String, required: true, unique: true },
    // any reserved text for config name
    
    description: { type: String },
    // description of TechnicalParam
    
    category: { type: Schema.Types.ObjectId , ref: 'machineTechParamCategory' }
    // Param category
},
{
    collection: 'MachineTechParams'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineTechParam', docSchema);
