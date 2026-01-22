const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema({
  className: { type: String },
  enrollmentIdRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Enrollment",
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mentor",
  },
  subjectName: { type: String },
  date: { type: Date },
  timing: { type: String },
  link: { type: String },

  // ✅ New field for materials
  materials: [
    {
      fileName: String,
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("LiveClass", liveClassSchema);
