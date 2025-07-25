const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },

  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: [true, 'User ID is required'],
  },
  timestamps:true, // Automatically add createdAt and updatedAt fields
}) 
module.exports = mongoose.model('Post', postSchema);