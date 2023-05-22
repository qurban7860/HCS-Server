const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        subject: { type: String },
        //Subject of a email
        
        body: { type: String },
        //body of a email
    
        emailAddresses:[ {type: String } ],
        // array of email addresses.

        customer: { type: Schema.Types.ObjectId , ref: 'Customer' },
        // customer information.
},
{
        collection: 'Emails'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Email', docSchema);