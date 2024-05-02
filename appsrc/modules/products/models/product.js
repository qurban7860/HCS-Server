const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
    
    serialNo: { type: String , required: true },
    // Serial No of machine

    parentMachine: { type: Schema.Types.ObjectId , ref: 'Machine' },
    // parent machine id

    globelMachineID: { type: Schema.Types.ObjectId , ref: 'Machine' },
    // This field serves as an identifier that remains unchanged with every machine transfer. It is initially populated and maintains its consistency with each subsequent transfer.
  
    parentSerialNo: { type: String },
    // Serial No of parent machine

    name: { type: String },
    // name/title of machine
    
    alias: [{ type: String  }],

    description: { type: String },
    // detailed description of machine

    
    purchaseDate: { type: Date },
    // Purchased Date

    transferredDate: {
        type: Date,
        validate: {
            validator: function(transferDate) {
                if (this.shippingDate && transferDate > this.shippingDate) {
                    return false;
                }
                if (this.installationDate && transferDate > this.installationDate) {
                    return false;
                }
                return true;
            },
            message: props => `transferred Date must be less than or equal to both shippingDate and installationDate`
        }
    },
    // date of transfer
    

    transferredToMachine: { type: Schema.Types.ObjectId , ref: 'Machine' },
    // transferred machine having new/updated customer data

    transferredFromMachine: { type: Schema.Types.ObjectId , ref: 'Machine' },
    // parent machine ID(ownership transfer)

    status: { type: Schema.Types.ObjectId , ref: 'MachineStatus' },
    // Status information of machine
  
    supplier: { type: Schema.Types.ObjectId , ref: 'MachineSupplier' },
    // supplier information
  
    machineModel: { type: Schema.Types.ObjectId , ref: 'MachineModel' },
    // Status information of machine
  
    workOrderRef: { type: String },
    // information about work order, purchase order or quotation ref no
    
    machineConnections: [{ type: Schema.Types.ObjectId , ref: 'MachineConnection' }],
    // list of connections with other machines like decoiler

    financialCompany: { type: Schema.Types.ObjectId , ref: 'Customer' },
    // Financial Customer for this machine

    customer: { type: Schema.Types.ObjectId , ref: 'Customer' },
    // customer for this machine
  
    instalationSite: { type: Schema.Types.ObjectId , ref: 'CustomerSite' },
    // site where machine is installed 
  
    billingSite: { type: Schema.Types.ObjectId , ref: 'CustomerSite' },
    // site which will be used billing purpose
  
    operators: [ {type: Schema.Types.ObjectId , ref: 'CustomerContact'}],
    // list of contacts from customer end who will work at this machine
  
    accountManager: [{ type: Schema.Types.ObjectId , ref: 'CustomerContact' }],
    // account manager for this machine from Howick
  
    projectManager: [{ type: Schema.Types.ObjectId , ref: 'CustomerContact' }],
    // technical project manager for this machine from Howick
  
    supportManager: [{ type: Schema.Types.ObjectId , ref: 'CustomerContact' }],
    // support project manager for this machine from Howick
  
    license: { type: Schema.Types.ObjectId , ref: 'MachineLicense' },
    // current applied license
  
    logo: { type: Schema.Types.ObjectId  },
    // primary/logo image for the files collection  ref: 'SystemFile'
  
    tools: [{ type: Schema.Types.ObjectId , ref: 'MachineTool' }],
    // tools
    
    internalTags: [{ type: String }],
    // list of tags used for reporting internally (Howick)

    supportExpireDate: { type: Date },
    // supportExpireDate date
    
    manufactureDate: { type: Date },
    // manufactureDate date

    shippingDate: { type: Date },
    // shipping date

    installationDate: { type: Date },
    // installation date
  
    customerTags: [{ type: String }],
    // list of tags used for reporting by customer

    siteMilestone: { type: String },

    verifications : [{
        verifiedBy : { type: Schema.Types.ObjectId , ref: 'SecurityUser' },
        verifiedDate: { type: Date }
    }],

    statusChangeHistory : [{
        status : { type: Schema.Types.ObjectId , ref: 'MachineStatus' },
        dated: { type: Date }
    }]
},
{
    collection: 'Machines'
});

docSchema.set('timestamps', true);

docSchema.index({"name":1})
docSchema.index({"serialNo":1})
docSchema.index({"parentMachine":1})
docSchema.index({"parentSerialNo":1})
docSchema.index({"transferredToMachine":1})
docSchema.index({"transferredFromMachine":1})
docSchema.index({"status":1})
docSchema.index({"supplier":1})
docSchema.index({"machineModel":1})
docSchema.index({"customer":1})
docSchema.index({"instalationSite":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);


docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Machine', docSchema);
