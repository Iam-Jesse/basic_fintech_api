const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: String,
  status: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema)

module.exports = Transaction;