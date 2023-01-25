const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  passwordText: { type: String},
  phoneNumber: { type: Number },
  address: { type: String, required: false },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  zip: { type: String },
  about: { type: String },
  addedBy: { type: String },
  image: { type: String },
  status: { type: String, default: 'Active' },
  isVerified: { type: Boolean, default: true },
  role: { type: String },
  createdAt: { type: Date },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date },
});
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
