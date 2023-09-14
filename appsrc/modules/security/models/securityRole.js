const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
                
  name: { type: String, required: true},
  // name of role
  
  description: { type: String },
  // description of role
  
  roleType : { type: String, required: true, default: 'normal'},
  // SuperAdmin/Developer/Normal
  
  allModules: { type: Boolean, default: false},
  //will be used to assign all module , like Administrator
  
  disableDelete: { type: Boolean, default: false},
  //if true, nothing can be deleted in system

  allWriteAccess: { type: Boolean, default: false},
  //enable write access for all module , like for Administrator
  
  modules: [
    {
      module: { type: Schema.Types.ObjectId, ref: 'SecurityModule' },
      writeAccess: { type: Boolean, default: false}
    }
  ],

            
},
{
        collection: 'SecurityRoles'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"name":1})
docSchema.index({"roleType":1})
docSchema.index({"disableDelete":1})
docSchema.index({"allWriteAccess":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})


module.exports = mongoose.model('SecurityRole', docSchema);