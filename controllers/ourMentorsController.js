const { OurMentor, MentorExperience ,Mentor} = require("../models/ourMentors");
const { uploadImage } = require("../config/cloudinary");
const bcrypt = require('bcryptjs');
const generateToken = require('../config/token');
const Enrollment = require('../models/enrollment');
const mongoose = require('mongoose'); 
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");


// REGISTER MENTOR
exports.registerMentor = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, confirmpassword, expertise, assignedCourses } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmpassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmpassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existingMentor = await Mentor.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingMentor) {
      return res.status(400).json({ success: false, message: 'Email or phone already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newMentor = await Mentor.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      expertise,
      assignedCourses
    });

    res.status(201).json({
      success: true,
      message: 'Mentor registered successfully',
      data: {
        _id: newMentor._id,
        name: `${newMentor.firstName} ${newMentor.lastName}`,
        email: newMentor.email,
        phoneNumber: newMentor.phoneNumber,
        token: generateToken(newMentor._id),
        assignedCourses: newMentor.assignedCourses
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// LOGIN MENTOR
exports.loginMentor = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    const mentor = await Mentor.findOne({ phoneNumber });
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    const isMatch = await bcrypt.compare(password, mentor.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: mentor._id,
        name: `${mentor.firstName} ${mentor.lastName}`,
        email: mentor.email,
        phoneNumber: mentor.phoneNumber,
        token: generateToken(mentor._id),
        assignedCourses: mentor.assignedCourses
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// GET ALL MENTORS
exports.getAll = async (req, res) => {
  try {
    // Populate assignedCourses
    const mentors = await Mentor.find()
      .select('-password')
      .populate({
        path: 'assignedCourses', // populate assignedCourses
        populate: {
          path: 'enrolledUsers', // populate enrolledUsers inside each course
          model: 'UserRegister', // reference to user model
          select: 'firstName lastName email phoneNumber' // only required fields
        }
      });

    res.status(200).json({ success: true, data: mentors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// GET MENTOR BY ID
exports.getById = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'assignedCourses',
        populate: {
          path: 'enrolledUsers',
          model: 'UserRegister',
          select: 'firstName lastName email phoneNumber'
        }
      });

    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

    res.status(200).json({ success: true, data: mentor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// UPDATE MENTOR
exports.update = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, expertise, assignedCourses } = req.body;

    const mentor = await Mentor.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, phoneNumber, expertise, assignedCourses },
      { new: true }
    )
    .select('-password')
    .populate({
      path: 'assignedCourses',
      populate: {
        path: 'enrolledUsers',
        model: 'UserRegister',
        select: 'firstName lastName email phoneNumber'
      }
    });

    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

    res.status(200).json({ success: true, message: 'Mentor updated successfully', data: mentor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// DELETE MENTOR
exports.delete= async (req, res) => {
  try {
    const mentor = await Mentor.findByIdAndDelete(req.params.id)
      .populate({
        path: 'assignedCourses',
        populate: {
          path: 'enrolledUsers',
          model: 'UserRegister',
          select: 'firstName lastName email phoneNumber'
        }
      });

    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

    res.status(200).json({ success: true, message: 'Mentor deleted successfully', data: mentor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
// CREATE
exports.createMentor = async (req, res) => {
  try {
    const { name, role, content } = req.body;

    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const imageUrl = await uploadImage(req.file.buffer);

    const mentor = await OurMentor.create({
      image: imageUrl,
      name,
      role,
      content
    });

    res.status(201).json({ message: "Mentor created", data: mentor });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET ALL
exports.getAllMentors = async (req, res) => {
  try {
    const mentors = await OurMentor.find();
    res.status(200).json({ data: mentors });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET BY ID
exports.getMentorById = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) return res.status(404).json({ message: "Mentor not found" });
    res.status(200).json({ data: mentor });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPDATE
exports.updateMentor = async (req, res) => {
  try {
    const { name, role, content } = req.body;
    let updateData = { name, role, content };

    if (req.file) {
      const imageUrl = await uploadImage(req.file.buffer);
      updateData.image = imageUrl;
    }

    const updatedMentor = await OurMentor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedMentor) return res.status(404).json({ message: "Mentor not found" });

    res.status(200).json({ message: "Mentor updated", data: updatedMentor });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE
exports.deleteMentor = async (req, res) => {
  try {
    const deleted = await OurMentor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Mentor not found" });
    res.status(200).json({ message: "Mentor deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// CREATE
exports.createMentorExperience = async (req, res) => {
  try {
    const { name, content } = req.body;

    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const imageUrl = await uploadImage(req.file.buffer);

    const mentor = await MentorExperience.create({
      name,
      image: imageUrl,
      content
    });

    res.status(201).json({ message: "Mentor experience created", data: mentor });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// READ ALL
exports.getAllMentorExperiences = async (req, res) => {
  try {
    const data = await MentorExperience.find();
    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// READ BY ID
exports.getMentorExperienceById = async (req, res) => {
  try {
    const data = await MentorExperience.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPDATE
exports.updateMentorExperience = async (req, res) => {
  try {
    const { name, content } = req.body;
    let updateData = { name, content };

    if (req.file) {
      const imageUrl = await uploadImage(req.file.buffer);
      updateData.image = imageUrl;
    }

    const updated = await MentorExperience.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });

    res.status(200).json({ message: "Updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE
exports.deleteMentorExperience = async (req, res) => {
  try {
    const deleted = await MentorExperience.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// ===================== CREATE QUIZ ===================== //
exports.createQuiz = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { courseId, title, description, questions } = req.body;

    if (!courseId || !title || !questions) {
      return res.status(400).json({ message: "courseId, title and questions are required" });
    }

    for (let q of questions) {
      if (!q.question || !q.options || !q.correctAnswer || q.points === undefined) {
        return res.status(400).json({
          message: "Each question must have question, options, correctAnswer and points"
        });
      }
    }

    const quiz = await Quiz.create({ mentorId, courseId, title, description, questions });

    res.status(201).json({ message: "Quiz created successfully", quiz });

  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ===================== GET ALL QUIZZES ===================== //
exports.getAllQuizzes = async (req, res) => {
  try {
    let quizzes = await Quiz.find()
      .populate("mentorId", "firstName lastName role"); // fetch firstName, lastName, role

    // Add combined name
    quizzes = quizzes.map(quiz => {
      const mentor = quiz.mentorId;
      let mentorName = "";
      if (mentor) {
        mentorName = `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim();
      }

      return {
        ...quiz.toObject(), // convert mongoose doc to plain object
        mentorName,
      };
    });

    res.status(200).json({
      success: true,
      message: "All quizzes fetched successfully",
      quizzes,
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ===================== GET QUIZ BY ID ===================== //
exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    res.status(200).json({ message: "Quiz fetched successfully", quiz });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ===================== UPDATE QUIZ ===================== //
exports.updateQuiz = async (req, res) => {
  try {
    const { quizId, mentorId } = req.params;
    const { courseId, title, description, questions } = req.body;

    const quiz = await Quiz.findOne({ _id: quizId, mentorId });

    if (!quiz) return res.status(404).json({ message: "Quiz not found or you are not the mentor" });

    // Update fields
    if (courseId) quiz.courseId = courseId;
    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (questions) quiz.questions = questions;

    await quiz.save();

    res.status(200).json({ message: "Quiz updated successfully", quiz });
  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ===================== DELETE QUIZ ===================== //
exports.deleteQuiz = async (req, res) => {
  try {
    const { quizId, mentorId } = req.params;
    const quiz = await Quiz.findOneAndDelete({ _id: quizId, mentorId });

    if (!quiz) return res.status(404).json({ message: "Quiz not found or you are not the mentor" });

    res.status(200).json({ message: "Quiz deleted successfully", quiz });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



// ===================== GET ALL QUIZZES BY MENTOR ===================== //
exports.getMentorQuizzes = async (req, res) => {
  try {
    const { mentorId } = req.params; // mentor ID from URL

    const quizzes = await Quiz.find({ mentorId });

    res.status(200).json({
      message: "Quizzes fetched for this mentor",
      quizzes,
    });

  } catch (error) {
    console.error("Error fetching mentor quizzes:", error);
    res.status(500).json({ message: "Server error", error });
  }
};




// Get all submitted quiz attempts for a mentor
exports.getMentorSubmittedQuizzes = async (req, res) => {
  try {
    const { mentorId } = req.params;

    if (!mentorId) {
      return res.status(400).json({ message: "Mentor ID is required" });
    }

    // Step 1: Find all quizzes created by this mentor
    const mentorQuizzes = await Quiz.find({ mentorId }).select("_id title courseId");

    if (!mentorQuizzes.length) {
      return res.status(404).json({ message: "No quizzes found for this mentor" });
    }

    const quizIds = mentorQuizzes.map(q => q._id);

    // Step 2: Find all attempts for these quizzes
    const attempts = await QuizAttempt.find({ quizId: { $in: quizIds } })
      .populate("studentId", "name")  // populate name from UserRegister
      .populate("quizId", "title courseId") // optional: get quiz info
      .sort({ submittedAt: -1 });

    if (!attempts.length) {
      return res.status(404).json({ message: "No quiz submissions found for this mentor" });
    }

    res.status(200).json({
      success: true,
      message: "Submitted quizzes fetched successfully",
      mentorId,
      totalQuizzes: mentorQuizzes.length,
      totalSubmissions: attempts.length,
      submissions: attempts
    });

  } catch (error) {
    console.error("Error fetching mentor submitted quizzes:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all submitted quiz attempts (mentor info populated)
exports.getAllSubmittedQuizzes = async (req, res) => {
  try {
    // Step 1: Fetch all quiz attempts
    const attempts = await QuizAttempt.find()
      .populate({
        path: "quizId",
        select: "title courseId mentorId",
        populate: {
          path: "mentorId",
          select: "firstName lastName email role profileImage", // mentor details
        }
      })
      .populate("studentId", "name email userId profileImage") // student info
      .sort({ submittedAt: -1 });

    if (!attempts.length) {
      return res.status(404).json({ 
        success: true, 
        message: "No quiz submissions found", 
        totalSubmissions: 0, 
        submissions: [] 
      });
    }

    // Optionally map to include combined mentor name
    const mappedAttempts = attempts.map(attempt => ({
      _id: attempt._id,
      student: attempt.studentId,
      quiz: {
        _id: attempt.quizId?._id,
        title: attempt.quizId?.title,
        courseId: attempt.quizId?.courseId,
      },
      mentor: attempt.quizId?.mentorId
        ? {
            _id: attempt.quizId.mentorId._id,
            name: `${attempt.quizId.mentorId.firstName} ${attempt.quizId.mentorId.lastName}`,
            email: attempt.quizId.mentorId.email,
            role: attempt.quizId.mentorId.role,
            profileImage: attempt.quizId.mentorId.profileImage || null,
          }
        : null,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      submittedAt: attempt.submittedAt,
      detailedResults: attempt.detailedResults
    }));

    res.status(200).json({
      success: true,
      message: "All submitted quizzes fetched successfully",
      totalSubmissions: mappedAttempts.length,
      submissions: mappedAttempts
    });

  } catch (error) {
    console.error("Error fetching all submitted quizzes:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching submitted quizzes",
      error: error.message
    });
  }
};



exports.deleteSubmittedQuiz = async (req, res) => {
  try {
    const { attemptId } = req.params;

    console.log("DELETE QUIZ ATTEMPT ID 👉", attemptId);

    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz attempt id"
      });
    }

    const attempt = await QuizAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Quiz submission not found"
      });
    }

    // OPTIONAL: remove reference from student if stored
    // if (attempt.studentId) {
    //   await User.findByIdAndUpdate(
    //     attempt.studentId,
    //     { $pull: { quizAttempts: attempt._id } }
    //   );
    // }

    await attempt.deleteOne();

    res.status(200).json({
      success: true,
      message: "Quiz submission deleted successfully"
    });

  } catch (error) {
    console.error("DELETE QUIZ ERROR 👉", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting quiz submission",
      error: error.message
    });
  }
};