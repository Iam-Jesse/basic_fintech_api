const axios = require('axios');

module.exports = axios.create({
  baseURL: 'https://api.paystack.co/',
  headers: {'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json'}
});