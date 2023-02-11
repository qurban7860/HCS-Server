module.exports = docAuditSchema = {
    createdAt: { type: Date , default: Date.now() },
    // Date/Time for record creation. more detail is in auditlog collection

    createdBy: { type: Schema.Types.ObjectId , ref: 'User' },
    // System user information who has created document. more detail is in auditlog collection

    updatedAt: { type: Date , dfault: Date.now() },
    // Date/Time for record last updated. more detail is in auditlog collection

    updatedBy: { type: Schema.Types.ObjectId , ref: 'User' },
    // System user information who has updated document. more detail is in auditlog collection
}

module.exports = docVisibilitySchema = {
    isDisabled: { type: Boolean, default: false },
    // a document can be disabled. A disabled document can not be used to 
    // perform any new action like new selection in other document, etc. 
     
    isArchived: { type: Boolean, default: false },
    // a document can be archived. An archived document and its associated 
    // data will not appear in reports
}

module.exports = docAddressSchema = {
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
    }
}

module.exports = docContactSchema = {
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