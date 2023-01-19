const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  address: { type: String, required: false },
  country: { type: String, required: false },
  state: { type: String, required: false },
  city: { type: String, required: false },
  zip: { type: String, required: false },
  about: { type: String, required: false },
  addedBy: { type: String },
  image: { type: String, required: false },
  status: { type: String, default: '1' }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
