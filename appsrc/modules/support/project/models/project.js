const mongoose = require('mongoose');
const baseSchema = require('../../../../base/baseSchema');

const Schema = mongoose.Schema;

const docSchema = new Schema({

    projectNo: { type: String },
    
    name: { type: String , required: true },

    startDate: { type: Date },

    endDate: { type: Date },
    
    description: { type: String },

    customerAccess: { type: Boolean, default: false },
    
},
{
    collection: 'Projects'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('Projects', docSchema);
