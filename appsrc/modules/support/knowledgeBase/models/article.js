const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../../base/baseSchema');

const Schema = mongoose.Schema;
const articleSchema = new Schema({

                serialNumber: { type: String },
                // name/title of field

                title: { type: String, required: true },
                // name/title of field

                category: { type: mongoose.Schema.Types.ObjectId, ref: 'ArticleCategories', required: true },

                description: { type: String },
                // detailed description of field

        },
        {
                collection: 'Articles'
        });

articleSchema.set('timestamps', true);
articleSchema.add(baseSchema.docVisibilitySchema);
articleSchema.add(baseSchema.docAuditSchema);

articleSchema.index({ "category": 1 })
articleSchema.index({ "isActive": 1 })
articleSchema.index({ "isArchived": 1 })

articleSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Articles', articleSchema);