const mongoose = require('mongoose');
const baseSchema = require('../../../../base/baseSchema');

const Schema = mongoose.Schema;

const docSchema = new Schema({

    releaseNo: { type: String },

    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Projects', required: true },
    
    name: { type: String , required: true },

    status: { type: String, enum: ['To Do', 'In Progress', 'Complete'], required: true, default: 'To Do' },

    releaseDate: { type: Date },
    
    description: { type: String },
    
},
{
    collection: 'Releases'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({ "project": 1 })
docSchema.index({"isActive": 1})
docSchema.index({"isArchived": 1})

module.exports = mongoose.model('Releases', docSchema);
