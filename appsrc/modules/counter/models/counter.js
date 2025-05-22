const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;
const baseSchema = require('../../../base/baseSchema');

const counterSchema = new Schema({

    counters: {
        serviceReport: { type: Number, default: 0 },
        supportTicket: { type: Number, default: 0 },
        article: { type: Number, default: 0 },
    },

    paddingSize: { 
        type: Number, 
        default: 5 
    },
    
}, {
    collection: 'Counters'
});

counterSchema.add(baseSchema.docVisibilitySchema);
counterSchema.add(baseSchema.docAuditSchema);

counterSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Counter', counterSchema);
