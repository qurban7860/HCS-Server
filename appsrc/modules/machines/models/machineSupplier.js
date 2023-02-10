const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const machineSuppllierSchema = new Schema({
    name: { type: String , required: true, unique: true },
    // name of suppplier 
    
    contactName: { type: String },
    // name of contact person of suppplier
    
    contactTitle: { type: String },
    // title of contact person of suppplier
    
    phone: { type: String },
    // phone/mobile numbers. Phone number must with country code. 
    // There can be multiple comma separated entries 
    
    email: { type: String },
    // Email addresses. There can be multiple comma separated entries
    
    fax: { type: String },
    // Fax nuer. There can be multiple comma separated entries
    
    website: { type: String },
    // website address of organization / site . 
    
    Address: {
        street: { type: String },
        // street address like 117 vincent street, 5/2 grey street, etc.
        suburb: { type: String },
        // name of suburb
        city: { type: String },
        //name of city
        region: { type: String },
        //name of region, state, etc. 
        postcode: { type: String },
        // post code like 2010
        country: { type: String }
        //country code will be save here like NZ for New Zealand
    },
    // address will be in above format. 
},
{
    collection: 'MachineSupplliers'
});

const baseSchema = require('./baseSchema');
machineSuppllierSchema.add(baseSchema);

machineSuppllierSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineSuppllier', machineSuppllierSchema);
