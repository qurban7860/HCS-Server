const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const assetModelSchema = new Schema({
    id: {type: Number },
    name: { type: String },
    assetTag: { type: Date  },
    modelId: {type: Number },
    serial: { type: Date },
    purchaseDate: {type: Mixed },
    purchaseCost: {  type: Mixed },
    orderNumber: { type: Mixed },
    assignedTo: {  type: Mixed },
    notes: {type: String },
    image: { type: String },
    createdAt: {  type: Date },
    updatedAt: {  type: Date },
    physical: {  type: Mixed },
    deletedAt: {  type: Mixed },
    statusId: {  type: Number },
    archived: {  type: Mixed },
    warrantyMonths: {  type: Mixed },
    depreciate: {  type: Mixed },
    supplierId: {  type: Number },
    requestable: {  type: Mixed },
    rtdLocationId: {  type: Mixed },
    accepted: {  type: Mixed },
    lastCheckout: {  type: Mixed },
    expectedCheckin: {  type: Mixed },
    departmentId: {  type: Number },
    assignedType: {  type: Mixed },
    lastAuditDate: {  type: Mixed },
    nextAuditDate: {  type: Mixed },
    locationId: {  type: Number },
    checkinCounter: {  type: Number },
    checkoutCounter: {  type: Number },
    requestsCounter: {  type: Number },
    customFields: {  type: Mixed },
    directCustomFields: {  type: String },
    imageExpireAt: {  type: Mixed },
    purchaseCurrency: {  type: String },
    linkedIssues: {  type: Mixed },
    LocationId: {  type: Number },
    canDelete: {  type: Boolean },
    isExpire: {  type: Boolean
    },
    log: {
      type: [    Mixed
      ]
    }

  // image: { type: String, required: false },
  // places: [{ type: mongoose.Types.ObjectId, required: false, ref: 'Place' }]
});

assetModelSchema.plugin(uniqueValidator);

module.exports = mongoose.model('AssetModel', assetModelSchema);
