const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        coilBatchName : { type: String },
        
        ccThickess : { type: String },
        
        coilLength : {type: String },
        
        operator : { type: String },

        frameSet : { type: String },
        
        componentLabel : { type: String },
        
        componentLength : { type: String },

        componentWeight : { type: String },
        
        webWidth : { type: String },
        
        flangeHeight : { type: String },
        
        profileShape : { type: String },
        
        waste : { type: String },
        
        type : { type: String, enum: [ 'ERP','EVENT','HOURLYRATE', 'JOBS', 'LICENSE', 'MODE_DURATION','PRODUCTION','SYSTEM','TOOLCOUNT','WASTE','ALERT','COIL'] },
        
        time : { type: String },
        
        date : { type: Date },
        
        customer : { type: Schema.Types.ObjectId , ref: 'Customer' },
        
        machine : { type: Schema.Types.ObjectId , ref: 'Machine' },
        
},
{
        collection: 'Logs'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

module.exports = mongoose.model('Log', docSchema);