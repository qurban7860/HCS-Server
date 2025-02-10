const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        
        // receiverInvitationUser: { type: Schema.ObjectId, ref: 'SecurityUser', required: true },
        // // guid of receiver user.
        
        // Invitation metadata
        senderInvitationUser: { type: Schema.ObjectId, ref: 'SecurityUser', required: true },
        receiverInvitationEmail: { type: String },
        // Receiver Email Address. 
        inviteCode: { type: String, required: true },
        inviteExpireTime: { type: Date, required: true },
        invitationStatus: { 
                type: String, 
                enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED'],
                default: 'PENDING'
        },
        statusUpdatedAt: { type: Date },
        inviteSentCount: { type: Number, default: 1 },
        lastInviteSentAt: { type: Date },

        // Reference to SecurityUser (populated after acceptance)
        securityUser: { type: Schema.ObjectId, ref: 'SecurityUser' },

        // USer Data
        customer: { type: Schema.ObjectId, ref: 'Customer', required: true },
        contact: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },
        name: { type: String, required: true },
        phone: { type: String },
        email: { type: String },
        login: { type: String, required: true },
        roles: [{ type: Schema.Types.ObjectId, ref: 'SecurityRole' }],
        dataAccessibilityLevel: {
                type: String,
                enum: ['RESTRICTED', 'GLOBAL'],
                default: 'RESTRICTED'
        },
        regions: [{ type: Schema.Types.ObjectId, ref: 'Region' }],
        customers: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
        machines: [{ type: Schema.Types.ObjectId, ref: 'Machine' }],
},
{
        collection: 'SecurityUserInvites'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

// docSchema.index({"receiverInvitationUser":1})
docSchema.index({"senderInvitationUser":1})
docSchema.index({"receiverInvitationEmail":1})
docSchema.index({"customer": 1});
docSchema.index({"email": 1});
docSchema.index({"login": 1});
docSchema.index({"inviteCode":1})
docSchema.index({"inviteExpireTime":1})
docSchema.index({"invitationStatus":1})
docSchema.index({"senderUser": 1});
docSchema.index({"securityUser": 1});

module.exports = mongoose.model('SecurityUserInvite', docSchema);