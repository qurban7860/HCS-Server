const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        
        senderInvitationUser: { type: Schema.ObjectId, ref: 'SecurityUser', required: true },
        // guid of sender user.
        
        receiverInvitationUser: { type: Schema.ObjectId, ref: 'SecurityUser', required: true },
        // guid of receiver user.
        
        receiverInvitationEmail: { type: String },
        // Receiver Email Address. 

        inviteCode: {type: String},

        inviteExpireTime: {type: Date},

        invitationStatus: {  type: String, enum: ['PENDING','ACCEPTED','DECLINED', 'EXPIRED', 'REVOKED'], default: 'PENDING'},                  
},
{
        collection: 'SecurityUserInvites'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"senderInvitationUser":1})
docSchema.index({"receiverInvitationUser":1})
docSchema.index({"receiverInvitationEmail":1})
docSchema.index({"inviteCode":1})
docSchema.index({"inviteExpireTime":1})
docSchema.index({"invitationStatus":1})

module.exports = mongoose.model('SecurityUserInvite', docSchema);