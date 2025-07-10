const express = require('express');
const app = express();
const Joi = require('joi');


exports.signupSchema = Joi.object({
  email: Joi.string().min(6).max(60).required().email({
    tlds: { allow: ['com', 'net'] }, // Only allow 'com' and 'net' TLDs for email validation
  }),

  password: Joi.string()
  .required()
  .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')) // At least 8 characters, 1 uppercase, 1 lowercase, 1 number

});

exports.signinSchema = Joi.object({
  email: Joi.string().min(6).max(60).required().email({
    tlds: { allow: ['com', 'net'] }, // Only allow 'com' and 'net' TLDs for email validation
  }),

  password: Joi.string()
  .required()
  .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')) // At least 8 characters, 1 uppercase, 1 lowercase, 1 number

});