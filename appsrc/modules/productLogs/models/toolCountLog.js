const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        coilBatchName : { type: String },
        
        ccThickness : { type: String },
        
        ccThicknessUnit : { type: String },
        
        coilLength : {type: String },
        
        coilLengthUnit : {type: String },
        
        operator : { type: String },

        frameSet : { type: String },
        
        componentLabel : { type: String },
        
        componentLength : { type: String },
        
        componentLengthUnit : { type: String },

        componentWeight : { type: String },
        
        componentWeightUnit : { type: String },
        
        webWidth : { type: String },
        
        webWidthUnit : { type: String },
        
        flangeHeight : { type: String },
        
        flangeHeightUnit : { type: String },
        
        profileShape : { type: String },
        
        waste : { type: String },
        
        wasteUnit : { type: String },
        
        time : { type: String },
        
        timeUnit : { type: String },
        
        date : { type: Date },
        
        customer : { type: Schema.Types.ObjectId , ref: 'Customer' },
        
        machine : { type: Schema.Types.ObjectId , ref: 'Machine' },

        archivedByMachine: {type: Boolean, default: false},
        
},
{
        collection: 'ToolCountLogs',
        strict: false
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

module.exports = mongoose.model('ToolCountLog', docSchema);