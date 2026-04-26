const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

const reflectionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [100, 'Subject cannot exceed 100 characters'],
    },
    weekNumber: {
      type: Number,
      min: 1,
      max: 52,
    },
    periodType: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'weekly',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    // Core reflection fields
    studiedTopics: {
      type: String,
      required: [true, 'Please describe what you studied'],
      trim: true,
      maxlength: [3000, 'Field cannot exceed 3000 characters'],
    },
    conceptsUnderstood: {
      type: String,
      required: [true, 'Please describe concepts understood'],
      trim: true,
      maxlength: [3000, 'Field cannot exceed 3000 characters'],
    },
    challengesFaced: {
      type: String,
      trim: true,
      maxlength: [3000, 'Field cannot exceed 3000 characters'],
    },
    nextSteps: {
      type: String,
      trim: true,
      maxlength: [1000, 'Field cannot exceed 1000 characters'],
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'struggling'],
      default: 'good',
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 30,
      },
    ],
    status: {
      type: String,
      enum: ['submitted', 'reviewed'],
      default: 'submitted',
    },
    feedback: [feedbackSchema],
  },
  { timestamps: true }
);

// Index for efficient queries
reflectionSchema.index({ student: 1, date: -1 });
reflectionSchema.index({ subject: 1 });
reflectionSchema.index({ status: 1 });

module.exports = mongoose.model('Reflection', reflectionSchema);
