const mongoose = require('mongoose');

// Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
  batchNumber: { type: String, },
  batchName: { type: String, },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", },
  startDate: { type: Date, },
  timings: { type: String,  },
  duration: { type: String, },
  category: { type: String, },
  assignedMentors: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Mentor"
  }],
  enrolledUsers: [
    { type: mongoose.Schema.Types.ObjectId, ref: "UserRegister" }
  ],
   status: { 
    type: String, 
    enum: ['Upcoming', 'Ongoing', 'Completed'], 
    default: 'Upcoming' // Default is "Upcoming"
  },
}, { timestamps: true });

// Certificate Schema
const certificateSchema = new mongoose.Schema({
  enrolledId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserRegister', },
  certificateFile: { type: String, }, // Cloudinary URL
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  }
}, { timestamps: true });



const OurCertificateSchema = new mongoose.Schema(
  {
    certificateImage: { type: String }, // Cloudinary URL
    description: { type: String, },
  },
  { timestamps: true }
);


const CommunitySchema = new mongoose.Schema(
  {
    slack: { type: String, },
    discord: { type: String, },
    whatsapp: { type: String,}
  },
  { timestamps: true }
);


// Make sure you're exporting both models correctly
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
const Certificate = mongoose.model('Certificate', certificateSchema);
const OurCertificate = mongoose.model("OurCertificate", OurCertificateSchema);
const Community = mongoose.model("Community", CommunitySchema);




// Export both models
module.exports = {
  Enrollment,
  Certificate,
  OurCertificate,
  Community
};