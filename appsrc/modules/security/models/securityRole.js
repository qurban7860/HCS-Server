const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
                
  name: { type: String, required: true},
  // name of role
  
  description: { type: String, required: true},
  // description of role
  
  roleType : { type: String, required: true},
  // SuperAdmin/Developer/Normal
  
  allModules: { type: Boolean, default: false},
  //will be used to assign all module , like Administrator
  
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

module.exports = mongoose.model('SecurityRole', docSchema);