const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({  

  serviceReportTemplate: { type: Schema.Types.ObjectId , ref: 'MachineServiceReportTemplate' },
  // Report findOne used to create this Report.

  primaryServiceReportId: { type: Schema.Types.ObjectId , ref: 'MachineServiceReport' },
  // purpose is to maintain parent service Report uuid
  
  serviceDate: { type: Date , default: Date.now, required: true },
  // date of service

  versionNo: { type: Number, default: 1, required: true },
  // Maintain versionNo
  
  customer: { type: Schema.Types.ObjectId , ref: 'Customer' },
  // customer information.
  
  site: { type: Schema.Types.ObjectId , ref: 'CustomerSite' },
  // site information.
  
  machine: { type: Schema.Types.ObjectId , ref: 'Machine' },
  // machine information.
  
  decoilers: [{ type: Schema.Types.ObjectId , ref: 'Machine' }],
  // decoiler information attached to machine.
  
  technician: { type: Schema.Types.ObjectId , ref: 'CustomerContact' },
  // technician information who performed service process.
  
  serviceReportUID: { type: String, required: true  },
  //indication of current active Report status.

  status: { type: String, enum: [ 'DRAFT','UNDER REVIEW' ,'MORE INFORMATION REQUIRED!' , 'SUBMITTED', 'COMPLETED' ], default: 'DRAFT' },
  // status: { type: Schema.Types.ObjectId , ref: 'MachineServiceReportStatuses' },
  //indication of current active Report approval status.

  technicianNotes: { type: String },
  // operator comments against this Report.

  textBeforeCheckItems: { type: String },
  // display this text before fields. default will be copied from configurtation
  
  textAfterCheckItems: { type: String },
  // display this text before fields
  
  serviceNote: { type: String },
  //some notes regarding service/installation/training,
  
  recommendationNote: { type: String },
  //recommendations if required
  
  internalComments: { type: String },
  //Internal comments in machine service Report. this comments will not be printed at PDF and not visible to customer

  
  suggestedSpares: { type: String },
  //detail of suggested spares

  internalNote: { type: String },
  //internal notes will not be visibile to customer,
  
  operators: [{ type: Schema.Types.ObjectId , ref: 'CustomerContact' }],
  // operators who is training.
  
  operatorNotes: { type: String },
  // operator comments against this Report.

  isReportDocsOnly: { type: Boolean, default: false },
  // just indication of current active Report.

  isHistory: { type: Boolean, default: false },
  // just indication of current active Report.

  archivedByMachine: {type: Boolean, default: false},

  approval: {
    
    approvingContacts: [{ type: Schema.Types.ObjectId, ref: "CustomerContact", default: [] }],
    // contacts who are approving this Report. They have been sent an approving email

    approvalLogs: {
      type: [{
        evaluatedBy: { type: Schema.Types.ObjectId, ref: "CustomerContact", default: null },
        // contact who approved/rejected the service Report

        evaluationDate: { type: Date, default: null },
        // date when the service Report was approved/rejected 
        
        comments: { type: String, default: "" },
        // current active Report approval comments.
        
        status: { type: String, enum: ["APPROVED", "REJECTED", "PENDING"], default: "PENDING" },
        // current approval status of the service Report
      }],
      default: []
    } 
  },
  // approval status of this Report.
},
{
    collection: 'MachineServiceReports',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"reportType":1})
docSchema.index({"operators":1})
docSchema.index({"serviceDate":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

// Virtual for currentApprovalStatus
docSchema.virtual('currentApprovalStatus').get(function() {
  if (this.approval?.approvalLogs?.length > 0) {
    return this.approval.approvalLogs[0].status;
  }
  return "PENDING";
});

// Method to add a new approval log
docSchema.methods.addApprovalLog = function ({ evaluatedBy, status, comments = "", evaluationDate = new Date() }) {
  if (!evaluatedBy || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    throw new Error("Invalid logData: evaluatedBy and valid status are required");
  }

  this.approval.approvalLogs.unshift({ evaluatedBy, status, comments, evaluationDate });
  return this.save();
};

module.exports = mongoose.model('MachineServiceReport', docSchema);
