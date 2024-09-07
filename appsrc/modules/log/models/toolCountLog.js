const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        coilBatchName : { type: String },
        
        ccThickness : { type: Number },
        
        ccThicknessUnit : { type: String },
        
        coilLength : {type: Number },
        
        coilLengthUnit : {type: String },
        
        operator : { type: String },

        frameSet : { type: String },
        
        componentLabel : { type: String },
        
        componentLength : { type: Number },
        
        componentLengthUnit : { type: String },

        componentWeight : { type: Number },
        
        componentWeightUnit : { type: String },
        
        webWidth : { type: Number },
        
        webWidthUnit : { type: String },
        
        flangeHeight : { type: Number },
        
        flangeHeightUnit : { type: String },
        
        profileShape : { type: String },
        
        waste : { type: Number },
        
        wasteUnit : { type: String },
        
        time : { type: Number },
        
        timeUnit : { type: String },
        
        date : { type: Date },
        
        customer : { type: Schema.Types.ObjectId , ref: 'Customer' },
        
        machine : { type: Schema.Types.ObjectId , ref: 'Machine' },

        archivedByMachine: {type: Boolean, default: false},
        
},
{
        collection: 'ToolCountLogs'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

module.exports = mongoose.model('ToolCountLog', docSchema);