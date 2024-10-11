const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        customerName: { type: String , required: true },
        
        contactPersonName: { type: String,  }, 
        
        email: { type: String, required: true  },
        
        address: { type: String },
        
        phoneNumber: { type: String  },

        status: { type: String, enum: [ "NEW", "APPROVED", "REJECTED", "PENDING" ] },

        customerNote: { type: String  },

        internalRemarks: { type: String  },

        machineSerialNos: { type: String, required: true  },

},
{
        collection: 'CustomerRegistrationRequests'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('CustomerRegistration', docSchema);