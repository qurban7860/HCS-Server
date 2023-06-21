const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;

const docSchema = new Schema({
        
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true},
        // guid of customer from customers collection.
        
        firstName: { type: String, required: true},
        // First name of contact person
        
        lastName: { type: String },
        // Last name of contact person
        
        title: { type: String },
        // designation of the contact in organization
        
        contactTypes: [{type: String}],
        // a contact can be of technical, financial, etc. type. 
        // One contact can be of multiple types
        
        phone: { type: String },
        // phone/mobile numbers. Phone number must with country code. 
        // There can be multiple comma separated entries 
        
        email: { type: String },
        // Email addresses. There can be multiple comma separated entries
        
        sites: [{ type: Schema.Types.ObjectId, ref: 'CustomerSite' }],
        // list of sites with which this contact is associated. 
        // It may not required at this moment
},
{
        collection: 'CustomerContacts'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docAddressSchema);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"firstName":1})
docSchema.index({"customer":1})
docSchema.index({"title":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('CustomerContact', docSchema);
