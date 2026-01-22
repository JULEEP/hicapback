const express = require('express');
const router = express.Router();
const users= require('../controllers/registerUserController');
const liveClassController = require("../controllers/liveClassController");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const stream = require("stream");



// ====== Configure Multer ======
// Ensure upload directory exists
const uploadPath = "uploads/";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath); // Folder to save uploaded CSVs
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });



// Ensure uploads folder exists
const materialUploadPath = path.join(__dirname, "../uploads/materials");
if (!fs.existsSync(materialUploadPath)) fs.mkdirSync(materialUploadPath, { recursive: true });








router.post('/userregister',users.register);
router.post('/userregisterbyadmin',users.adminCreateInvoice);
router.post('/generateinvoice', users.generateInitialInvoice);
router.get('/dashboard', users.getEducationDashboard);
router.get('/getallinvoices', users.getAllInvoices);
router.put('/updateinvoice/:id', users.updateInvoiceStatus);
router.delete('/deleteinvoice/:id', users.deleteInvoiceById);
router.get('/usercourse/:userId', users.getRegisteredCourseDetails);
router.post('/userlogin', users.login);
// Read
router.get('/allusers', users.getAllUsers);
router.get('/userregister/:id', users.getUserById);

// Update
router.put('/userregister/:id',users.updateUser);

// Delete
router.delete('/userregister/:id', users.deleteUser);

// POST: Add recommended courses
router.post('/recommend-courses', users.addRecommendedCourses);

// GET: Get recommended courses for a user
router.get('/recommend-courses/:userId', users.getRecommendedCourses);



// ➕ CREATE LIVE CLASS
router.post('/createliveclass', liveClassController.createLiveClass);
router.get('/liveclass', liveClassController.getAllLiveClasses);
router.get('/liveclass/:id', liveClassController.getLiveClassById);
router.put('/liveclass/:id', liveClassController.updateLiveClassById);
router.delete('/liveclass/:id', liveClassController.deleteLiveClassById);

// Additional routes
router.get('/mentorliveclass/:mentorId', liveClassController.getLiveClassesByMentorId);
router.get('/liveclass/enrollment/:enrollmentId', liveClassController.getLiveClassesByEnrollmentId);
router.get('/live-classes/user/:userId', liveClassController.getLiveClassesByUserId);

router.get('/userpayments',users.getAllPayments);

router.post("/uploadattendance/:mentorId",upload.single("file"),users.uploadBulkAttendanceCSV);
router.get('/getattendance/:mentorId', users.getAttendanceByMentor);
router.get('/allattendance', users.getAllAttendanceForAdmin);
router.get('/dashboard/:mentorId', users.getMentorDashboard);
router.post('/generate-otp', users.sendOtp); // Send OTP route
router.post('/validate-otp', users.verifyOtp); // Verify OTP route
router.get("/student-attendance/:enrollmentId", users.getStudentAttendanceDashboard);
router.post("/acceptchatgrpreq", users.acceptGroupInvitation);
router.get('/getchat/:chatGroupId/:userId', users.getChatMessages);
router.get('/getnotifications/:userId', users.getNotificationsByUserId);
router.get('/myquizz/:userId', users.getStudentQuizzes);
router.post('/submit-quiz/:quizId/:userId', users.submitQuiz);
router.get('/getmyquizperformance/:userId', users.getUserQuizPerformance);
router.get('/myprofile/:userId', users.getUserProfile);
router.get('/myattendance/:userId', users.getAttendanceByUserId);

// Use 'material' as form-data key
// Key in Postman or frontend: 'material'
router.post(
  "/upload-material/:mentorId/:liveClassId",
  liveClassController.uploadMaterialForLiveClass
);





module.exports = router;
