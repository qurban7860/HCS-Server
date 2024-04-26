const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

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
        
        reportingTo: { type: Schema.Types.ObjectId, ref: 'CustomerContact'},
        // Reporting to person.
        
        department: { type: Schema.Types.ObjectId, ref: 'Department'},
        // Reporting to person.
        
        sites: [{ type: Schema.Types.ObjectId, ref: 'CustomerSite' }],
        // list of sites with which this contact is associated. 
        // It may not required at this moment

        formerEmployee: { type: Boolean , default: false },

        archivedByCustomer: {type: Boolean, default: false},

},
{
        collection: 'CustomerContacts'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docContactSchema);
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
