const mongoose = require("mongoose");

const mentorSchema = new mongoose.Schema({
  firstName: { type: String, },
  lastName: { type: String, },
  email: { type: String, unique: true },
  phoneNumber: { type: String, unique: true },
  password: { type: String },
  expertise: { type: String }, // Add expertise area
  subjects: [String],
  assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" }],
  enrolledBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" }] // NEW: Track batches mentor is enrolled in
}, { timestamps: true });

// OurMentor Schema
const ourMentorSchema = new mongoose.Schema({
  image: { type: String, },
  name: { type: String, },
  role: { type: String, },
  content: { type: String, },
}, { timestamps: true });

// MentorExperience Schema
const mentorExperienceSchema = new mongoose.Schema({
  name: { type: String, },
  image: { type: String, },
  content: { type: String, }
}, { timestamps: true });

// Export both models
const OurMentor = mongoose.model("OurMentor", ourMentorSchema);
const MentorExperience = mongoose.model("MentorExperience", mentorExperienceSchema);
const Mentor = mongoose.model('Mentor', mentorSchema);

module.exports = {
  OurMentor,
  MentorExperience,
  Mentor
};
