const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../../base/baseSchema');

const Schema = mongoose.Schema;
const articleCategorySchema = new Schema({

                name: { type: String, required: true },
                // name/title of field

                description: { type: String },
                // detailed description of field

        },
        {
                collection: 'ArticleCategories'
        });

articleCategorySchema.set('timestamps', true);
articleCategorySchema.add(baseSchema.docVisibilitySchema);
articleCategorySchema.add(baseSchema.docAuditSchema);

articleCategorySchema.index({ "isActive": 1 })
articleCategorySchema.index({ "isArchived": 1 })

articleCategorySchema.plugin(uniqueValidator);

module.exports = mongoose.model('ArticleCategories', articleCategorySchema);