const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        name: { type: String , required: true },
        // name of organization
        
        tradingName: { type: String },
        //brand/trade name if the organization has it
        
        type: { type: String },
        //its value can be "SP", "Customer"
        
        mainSite: { type: Schema.Types.ObjectId , ref: 'CustomerSite' },
        // it will be considered main site/location or headoffice 
        
        sites: [{ type: Schema.Types.ObjectId, ref: 'CustomerSite' }],
        //list of sites associated with the organization
        
        contacts: [{ type: Schema.Types.ObjectId, ref: 'CustomerContact' }],
        // list of contact associated with organization
        
        primaryBillingContact: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },
        // primary Billing Contact for the customer
        
        primaryTechnicalContact: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },
        // primary Technical Contact for the customer
        
        accountManager: { type: Schema.Types.ObjectId , ref: 'CustomerContact' },
        // account manager for this customer from Howick Side 
        
        projectManager: { type: Schema.Types.ObjectId , ref: 'CustomerContact' },
        // technical project manager for this customer from Howick Side
        
        supportManager: { type: Schema.Types.ObjectId , ref: 'CustomerContact' },
        // support project manager for this customer from Howick Side
},
{
        collection: 'Customers'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Customer', docSchema);