module.exports = baseSchema = {
    isDisabled: { type: Boolean, default: false },
    // a site can be disabled. A disabled site can not be used to 
    // perform any new action like selling machines or new contact, etc. 
     
    isArchived: { type: Boolean, default: false },
    // a site can be archived. An archived site and its associated 
    // data will not appear in reports
    
    createdAt: { type: Date , default: Date.now() },
    // Date/Time for record creation. more detail is in auditlog collection
    
    updatedAt: { type: Date , dfault: Date.now() }
    // Date/Time for record last updated. more detail is in auditlog collection
}