const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const counterSchema = new Schema({

    counters: {
        serviceReport: { type: Number, default: 0 },
        supportTicket: { type: Number, default: 0 },
    },

    paddingSize: { 
        type: Number, 
        default: 5 
    },
    
}, {
    collection: 'Counters'
});

docSchema.add(baseSchema.docAuditSchema);
docSchema.add(baseSchema.docVisibilitySchema);

counterSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Counter', counterSchema);
