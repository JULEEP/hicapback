const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mentor",
  },

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },

  title: {
    type: String,
  },

  description: {
    type: String,
    default: ""
  },

  // questions stored directly inside main schema
  questions: [
    {
      question: { type: String, },
      options: { type: [String], },
      correctAnswer: { type: String,},
      points: { type: Number, }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Quiz", quizSchema);
