const axios = require("axios");

const paystackInstance = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json"
  }
});

module.exports = paystackInstance;
// This module exports an Axios instance configured for Paystack API requests.
// It sets the base URL and includes the necessary authorization header with the Paystack secret key.