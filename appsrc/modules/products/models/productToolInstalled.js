const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({
 
    machine: { type: Schema.Types.ObjectId, required:true, ref: 'Machine' },
   
    tool: { type: Schema.Types.ObjectId, required: true, ref: 'MachineTool' },
    // name of tool 
  
    offset: { type: Number, required: false },
    // offset
    
    isApplyWaste: { type: Boolean, default: false },
    // a site can enable or disable the End Waste.

    wasteTriggerDistance: { type: Number, required: false },
    // end waste trigger distance
    
    isApplyCrimp: { type: Boolean, default: false }, 
    // does it requires Crimp

    crimpTriggerDistance: { type: Number, required: false },
    // crimp trigger distance

    isBackToBackPunch: { type: Boolean, default: false },
    // single punch for back to back components
    
    isManualSelect: { type: Boolean, default: false },  
    // can manual select
    
    isAssign: { type: Boolean, default: false },
    // can assign to component
    
    operations: { type: Number },
    // number of operations
    
    toolType: {type: String, enum: ['GENERIC TOOL','SINGLE TOOL','COMPOSIT TOOL'], default: "GENERIC TOOL"},
    
    singleToolConfig: {
        engageSolenoidLocation: { type: Number },
        // engage solenoid port 
        
        returnSolenoidLocation: { type: Number },
        // disengage solenoid port
        
        engageOnCondition: {  type: String, enum: ['PASS','NO CONDITION','PROXIMITY SENSOR']  },
        // soilenoid port engage on conditions
        
        engageOffCondition: { type: String, enum: ['PASS','TIMER','PROXIMITY SENSOR','PRESSURE TARGET','DISTANCE SENSOR','PRESSURE TRIGGERS TIMER']},
        // soilenoid port engage off conditions
        
        timeOut: { type: Date },
        // timeout time
    
        engagingDuration: { type: Number },
        // engage duration
    
        returningDuration: { type: Number },
        // disengage duration
        
        twoWayCheckDelayTime: { type: Number },
        // two way check time
    
        homeProximitySensorLocation: { type: Number }, 
        // home proximity sensor location
        
        engagedProximitySensorLocation: { type: Number },
        // engaged proximity sensor location
    
        pressureTarget: { type: Number },
        // pressure sensor target
        
        distanceSensorLocation: { type: Number },
        // distance sensor location
        
        distanceSensorTarget: { type: Number },
        // distance sensor target
        
        isHasTwoWayCheck: { type: Boolean },
        // has two way check valves
        
        isEngagingHasEnable: { type: Boolean },
        // engaging has enable
        
        isReturningHasEnable: { type: Boolean },
        // disengaging has enable
        
        movingPunchCondition: { type: String, enum: ['NO PUNCH','PUNCH WHILE JOGGING','PUNCH WHILE RUNNING'] },
        // moving punch conditions, 
    },
   
    compositeToolConfig: [{
        engageInstruction: { type: Schema.Types.ObjectId, ref: 'MachineToolsInstalled' },
        // will inherit list of conditions from Machine Tool Installed
        
        disengageInstruction: { type: Schema.Types.ObjectId, ref: 'MachineToolsInstalled' },
        // will inherit list of conditions from Machine Tool Installed
    }],

},
{
    collection: 'MachineToolsInstalled'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"tool":1})
docSchema.index({"offset": 1})
docSchema.index({"wasteTriggerDistance": 1})
docSchema.index({"crimpTriggerDistance": 1})
docSchema.index({"Operations": 1}),
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('MachineToolInstalled', docSchema);
