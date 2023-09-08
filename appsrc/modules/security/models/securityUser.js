const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        
        customer: { type: Schema.ObjectId, ref: 'Customer', required: true },
        // guid of customer from customers collection.
        
        contact: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },
        // guid of contact of customer if linked to contact
            
        name: { type: String, required: true},
        // Full name of user
        
        phone: { type: String },
        // phone/mobile numbers. Phone number must with country code.  
        
        email: { type: String },
        // Email addresses. 
        
        login: { type: String, required: true },
        // Login. Email & Login may have same values . 
        
        password: { type: String, required: true },
        // password to access portal

        multiFactorAuthenticationCode: {type: String},
        // code to access portal

        multiFactorAuthentication: {type: Boolean, default: false},
        //Authentification 

        multiFactorAuthenticationExpireTime: {type: Date},
        // Date/Time for code expiry.

        inviteCode: {type: String},

        inviteExpireTime: {type: Date},

        expireAt: { type: Date},
        // Date/Time for password expiry.

        currentEmployee: { type: Boolean, default: false },
        
        roles: [
            { type: Schema.Types.ObjectId, ref: 'SecurityRole' }
        ],

        regions: [
            { type: Schema.Types.ObjectId, ref: 'Region' }
        ],

        customers: [
            { type: Schema.Types.ObjectId, ref: 'Customer' }
        ],

        machines: [
            { type: Schema.Types.ObjectId, ref: 'Machine' }
        ],
        
        whiteListIPs: [{ type: String}],
        // list of white IPs
        
        token: {
          accessToken: {type: Object},
          
          tokenCreation: { type: Date},
          // Date/Time for token  creation.
          tokenExpiry: { type: Date}
          // Date/Time for token expiry.
        }
                          
},
{
        collection: 'SecurityUsers'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"name":1})
docSchema.index({"customer":1})
docSchema.index({"contact":1})
docSchema.index({"email":1})
docSchema.index({"login":1})
docSchema.index({"token.accessToken":1})

module.exports = mongoose.model('SecurityUser', docSchema);