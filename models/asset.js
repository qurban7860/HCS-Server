const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const assetSchema = new Schema({
    name: { type: String , required: false },
    assetTag: { type: Date  , required: false },
    modelId: {type: Number , required: false },
    serial: { type: Date , required: false },
    purchaseDate: {type: Mixed , required: false },
    purchaseCost: {  type: Mixed , required: false },
    orderNumber: { type: Mixed , required: false },
    assignedTo: {  type: Mixed , required: false },
    notes: {type: String , required: false },
    image: { type: String , required: false },
    createdAt: {  type: Date , required: false },
    updatedAt: {  type: Date , required: false },
    physical: {  type: Mixed , required: false },
    deletedAt: {  type: Mixed , required: false },
    statusId: {  type: Number , required: false },
    archived: {  type: Mixed , required: false },
    warrantyMonths: {  type: Mixed , required: false },
    depreciate: {  type: Mixed , required: false },
    supplierId: {  type: Number , required: false },
    requestable: {  type: Mixed , required: false },
    rtdLocationId: {  type: Mixed , required: false },
    accepted: {  type: Mixed , required: false },
    lastCheckout: {  type: Mixed , required: false },
    expectedCheckin: {  type: Mixed , required: false },
    departmentId: {  type: Number , required: false },
    assignedType: {  type: Mixed , required: false },
    lastAuditDate: {  type: Mixed , required: false },
    nextAuditDate: {  type: Mixed , required: false },
    locationId: {  type: Number , required: false },
    checkinCounter: {  type: Number , required: false },
    checkoutCounter: {  type: Number , required: false },
    requestsCounter: {  type: Number , required: false },
    customFields: {  type: Mixed , required: false },
    directCustomFields: {  type: String , required: false },
    imageExpireAt: {  type: Mixed , required: false },
    purchaseCurrency: {  type: String , required: false },
    linkedIssues: {  type: Mixed , required: false },
    LocationId: {  type: Number , required: false },
    canDelete: {  type: Boolean , required: false },
    isExpire: {  type: Boolean
    , required: false },
    log: {
      type: [    Mixed, required: false
      ]
    }

  // image: { type: String, required: false },
  // places: [{ type: mongoose.Types.ObjectId, required: false, ref: 'Place' }]
});

assetSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Asset', assetSchema);
