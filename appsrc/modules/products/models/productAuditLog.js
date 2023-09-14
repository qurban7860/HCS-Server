const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');


const Schema = mongoose.Schema;

const docSchema = new Schema({
    machine: { type: Schema.Types.ObjectId, required:true, ref: 'Machine' },
    // machine information 

    category: { type: Schema.Types.ObjectId , ref: 'MachineCategory' },
    // configuration name
    model: { type: Schema.Types.ObjectId , ref: 'MachineModel' },
    // configuration name

    supplier: { type: Schema.Types.ObjectId , ref: 'MachineSupplier' },
    // machine supplier
    
    status: { type: Schema.Types.ObjectId , ref: 'MachineStatus' },
    // status information
    
    note: { type: Schema.Types.ObjectId , ref: 'MachineNote' },
    // note information
    
    tool: { type: Schema.Types.ObjectId , ref: 'MachineTool' },
    // tools
    
    machineTechParam: { type: Schema.Types.ObjectId , ref: 'MachineTechParam' },
    // configuration names
    
    machineTechParamValue: { type: Schema.Types.ObjectId , ref: 'MachineTechParamValue' },
    // configurations of machine
    
    activityType: { type: String },
    // action Type (Create, Update, Delete)
    
    activitySummary: { type: String },
    // action summary like Create machine, Update machine, etc. 
    
    activityDetail: { type: String }
    // action detail - content of changes
    
},
{
    collection: 'MachineAuditLogs'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"machine":1})
docSchema.index({"category":1})
docSchema.index({"model":1})
docSchema.index({"status":1})
docSchema.index({"tool":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

// docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineAuditLog', docSchema);
