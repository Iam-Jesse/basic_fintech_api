const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
  bank_name: String,
  account_name: String,
  account_number: String,
  recipient_code: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const Bank = mongoose.model('Bank', bankSchema)

module.exports = Bank;