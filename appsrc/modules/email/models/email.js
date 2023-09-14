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
    
        // emailAddresses:[ {type: String } ],
        // array of email addresses.

        fromEmail: {type: String, required: true },
        // from email address.
        
        toEmails:[ {type: String } ],
        // array of email addresses in to.
        
        ccEmails:[ {type: String } ],
        // array of email addresses in cc.
        
        bccEmails:[ {type: String } ],
        // array of email addresses in bcc.
        
        customer: { type: Schema.Types.ObjectId , ref: 'Customer' },
        // customer information.
        
        toContacts: [{ type: Schema.Types.ObjectId , ref: 'CustomerContact' }],
        // customer information.
        
        toUsers: [{ type: Schema.Types.ObjectId , ref: 'SecurityUser' }],
        // customer information.
},
{
        collection: 'Emails'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"fromEmail":1})
docSchema.index({"customer":1})
docSchema.index({"subject":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Email', docSchema);