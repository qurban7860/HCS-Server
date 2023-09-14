const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
        customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
        // guid of customer from customers collection.
        
        site: { type: Schema.Types.ObjectId, ref: 'CustomerSite' },
        // guid of side from sites collection.
      
        contact: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },
        // guid of contact from contacts collection.
      
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        // guid of user from users collection.
        
        note: { type: String, required: true },
        // This will be used to handle any kind of comments or notes against any above field
},
{
        collection: 'CustomerNotes'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"site":1})
docSchema.index({"customer":1})
docSchema.index({"user":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('CustomerNote', docSchema);
