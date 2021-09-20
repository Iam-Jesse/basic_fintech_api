const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  password: String,
  balance: {
    type: mongoose.Decimal128,
    default: 0
  }
});

const User = mongoose.model('User', userSchema)

module.exports = User;