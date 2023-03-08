const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');
const GUID = require('mongoose-guid')(mongoose);

const Schema = mongoose.Schema;

const docSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' , required: true},
    // guid of customer from customers collection. 
    
    name: { type: String , required: true },
    // name of site. default will be organization name

    primaryBillingContact: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },
    // primary Billing Contact for the site
    
    primaryTechnicalContact: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },
    // primary Technical Contact for the site
    
    contacts: [{ type: Schema.Types.ObjectId, ref: 'CustomerContact' }],
    // list of associated other contacts (GUIDs) from contacts collection
},
{
    collection: 'CustomerSites'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docContactSchema);
docSchema.add(baseSchema.docAddressSchema);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('CustomerSite', docSchema);
