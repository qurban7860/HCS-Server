const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let docAuditSchema = {
    createdBy: { type: Schema.Types.ObjectId , ref: 'SecurityUser' },
    // System user information who has created document. more detail is in auditlog collection
    createdIP: {type: String},
    //user ip address
    
    updatedBy: { type: Schema.Types.ObjectId , ref: 'SecurityUser' },
    // System user information who has updated document. more detail is in auditlog collection
    updatedIP: {type: String},
    //user ip address
}

let  docVisibilitySchema = {
    isActive: { type: Boolean, default: true },
    // a document can be disabled. A disabled document can not be used to 
    // perform any new action like new selection in other document, etc. 
     
    isArchived: { type: Boolean, default: false },
    // a document can be archived. An archived document and its associated 
    // data will not appear in reports
}

let  docAddressSchema = {
    address: {
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
    }
}

let  docContactSchema = {
    phone: { type: String },
    // phone/mobile numbers. Phone number must with country code. 
    // There can be multiple comma separated entries 
    
    email: { type: String },
    // Email addresses. There can be multiple comma separated entries
    
    fax: { type: String },
    // Fax nuer. There can be multiple comma separated entries
    
    website: { type: String },
    // website address of organization / site . 
}

 module.exports = {docAuditSchema, docVisibilitySchema, docAddressSchema, docContactSchema };

 