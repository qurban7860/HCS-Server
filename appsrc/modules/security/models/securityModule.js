const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
  name: { type: String, required: true},
  // name of module/task

  description: { type: String, required: true},
  // discription of module/task

  accessForNormalUsers: { type: Boolean, default: false },
  // is this module for users who are not super admin
                          
},
{
        collection: 'SecurityModules'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"name":1})


module.exports = mongoose.model('SecurityModule', docSchema);