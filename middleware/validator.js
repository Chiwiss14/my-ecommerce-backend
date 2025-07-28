// const express = require('express');
// const app = express();

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
exports.acceptCodeSchema = Joi.object({
  email: Joi.string().min(6).max(60).required().email({ 
    tlds: { allow: ['com', 'net'] }, // Only allow 'com' and 'net' TLDs for email validation
  }),
  code: Joi.number().required()
});

exports.changePasswordSchema = Joi.object({
  newPassword: Joi.string()
  .required()
  .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')) // At least 8 characters, 1 uppercase, 1 lowercase, 1 number

  ,
  oldPassword: Joi.string()
  .required()
  .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')) // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
});

exports.acceptCodeSchema = Joi.object({
  email: Joi.string().min(6).max(60).required().email({
    tlds: { allow: ['com', 'net'] }, // Only allow 'com' and 'net' TLDs for email validation
  }), 
  code: Joi.number().required()
});

exports.resetPasswordSchema = Joi.object({
    email: Joi.string()
        .min(6)
        .max(60)
        .required()
        .email({
            tlds: { allow: ['com', 'net'] },
        }),
    code: Joi.string() // The 6-digit code received via email
        .length(6)
        .pattern(/^[0-9]+$/)
        .required(),
    newPassword: Joi.string()
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')), // Your desired password pattern
});


// ✅ Product creation validation (admin)
exports.productSchemaValidation = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().min(0).required(),
  description: Joi.string().min(5).max(1000).optional(),
  category: Joi.string().optional(),
  stock: Joi.number().min(0).optional(),
  image: Joi.string().uri().optional(), // Optional field for image URL
  ratings: Joi.number().min(0).max(5).optional(), // Optional field for ratings
  comment: Joi.string().optional(), // Optional field for comments  
  numOfReviews: Joi.number().min(0).optional(), // Optional field for number of reviews
});


// ✅ Product update validation (admin)
exports.productSchemaUpdateValidation = Joi.object({
  name: Joi.string().min(2).max(100),
  price: Joi.number().min(0),
  description: Joi.string().min(5).max(1000),
  category: Joi.string(),
  stock: Joi.number().min(0),
  image: Joi.string().uri().optional(), // Optional field for image URL
  ratings: Joi.number().min(0).max(5).optional(), // Optional field
  comment: Joi.string().optional(), // Optional field for comments
  numOfReviews: Joi.number().min(0).optional(), // Optional field for number of reviews

}).min(1); // Require at least one field for update


exports.validateContactMessage = (req, res, next) => {
  const contactSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    subject: Joi.string().min(2).max(100).required(),
    message: Joi.string().min(5).max(500).required()
  });

  const { error } = contactSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  next();
};


