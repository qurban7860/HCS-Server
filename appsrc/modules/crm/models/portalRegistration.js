const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        customer: { type: Schema.Types.ObjectId, ref: 'Customer' },

        contact: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },

        customerName: { type: String , required: true },
        
        contactPersonName: { type: String,  }, 
        
        email: { type: String, required: true  },
        
        country: { type: String },
        
        address: { type: String },
        
        phoneNumber: { type: String  },

        status: { type: String, enum: [ "NEW", "APPROVED", "REJECTED", "PENDING" ], default:"NEW" },

        customerNote: { type: String  },

        internalNote: { type: String  },

        machineSerialNos: [{ type: String, required: true  }],

},
{
        collection: 'PortalRegistrationRequests'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('PortalRegistration', docSchema);