const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const mentorController = require("../controllers/ourMentorsController");

// REGISTER & LOGIN
router.post('/mentor/register', mentorController.registerMentor);
router.post('/mentor/login', mentorController.loginMentor);

// READ
router.get('/mentors', mentorController.getAll);
router.get('/mentor/:id', mentorController.getById);

// UPDATE
router.put('/mentor/:id', mentorController.update);

// DELETE
router.delete('/mentor/:id', mentorController.delete);


// 🔥 EXPERIENCE ROUTES - define FIRST to avoid :id conflicts
router.post("/experience", upload.single("image"), mentorController.createMentorExperience);
router.get("/experience", mentorController.getAllMentorExperiences);
router.get("/experience/:id", mentorController.getMentorExperienceById);
router.put("/experience/:id", upload.single("image"), mentorController.updateMentorExperience);
router.delete("/experience/:id", mentorController.deleteMentorExperience);

// 🔧 OUR MENTOR ROUTES - define AFTER specific routes
router.post("/Mentor", upload.single("image"), mentorController.createMentor);
router.get("/Mentor", mentorController.getAllMentors);
router.get("/profile/:id", mentorController.getMentorById);
router.put("/Mentor/:id", upload.single("image"), mentorController.updateMentor);
router.delete("/Mentor/:id", mentorController.deleteMentor);



//quiz module

// Create Quiz (mentorId in params)
router.post("/createquiz/:mentorId", mentorController.createQuiz);

// Get All Quizzes
router.get("/allquizz", mentorController.getAllQuizzes);

// Get all quizzes created by a mentor
router.get("/mentorquizz/:mentorId", mentorController.getMentorQuizzes);

// Update Quiz (mentorId in params for security)
router.put("/updatequiz/:quizId/:mentorId", mentorController.updateQuiz);

// Delete Quiz (mentorId in params)
router.delete("/deletequiz/:quizId/:mentorId", mentorController.deleteQuiz);

router.get("/mentor-submissions/:mentorId", mentorController.getMentorSubmittedQuizzes);

router.get("/allsubmissionquizz", mentorController.getAllSubmittedQuizzes);
router.delete("/deletequiz-attempt/:attemptId", mentorController.deleteSubmittedQuiz);

module.exports = router;
