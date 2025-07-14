const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    unique: [true , 'Email already exists'],
    minLength: [5, 'Email must be at least 5 characters long'],
    lowercase: true
  },
  password: { 
    type: String,
    required: [true, 'Password is required'],
    trim: true,
    select: false, // Don't return password by default
    minLength: [6, 'Password must be at least 6 characters long']
  },

  verified: { 
    type: Boolean,
    default: false, 
  },

    verificationCode: { 
        type: String,
        select: false, // Don't return verification code by default
    },

    verificationCodeValidation: { 
        type: String,
        select: false, // Don't return verification code by default
    },

    forgotPasswordCode: { 
        type: String,
        select: false, // Don't return verification code by default
    },

    verificationCodeExpiresAt: { // To store the timestamp when the code expires
        type: Number, // Storing as Unix timestamp (milliseconds)
        default: null
    },

    forgotPasswordCodeValidation: { 
        type: Number,
        select: false, // Don't return verification code by default
    },
});
 timestamps: true, // Automatically add createdAt and updatedAt fields
    
 module.exports = mongoose.model('User', userSchema);