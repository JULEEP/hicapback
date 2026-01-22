const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserRegister',
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  answers: {
    type: Map,
    of: String,
  },
  score: {
    type: Number,
  },
  percentage: {
    type: Number,
  },
  correctCount: {
    type: Number,
  },
  incorrectCount: {
    type: Number,
  },
  unansweredCount: {
    type: Number,
  },
  totalQuestions: {
    type: Number,
  },
  totalPossiblePoints: {
    type: Number,
  },
  detailedResults: [{
    questionId: mongoose.Schema.Types.ObjectId,
    question: String,
    userAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    points: Number,
    earnedPoints: Number,
    status: String // 'correct', 'incorrect', 'unanswered'
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);