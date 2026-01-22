const { Enrollment } = require('../models/enrollment'); // Correct import
const LiveClass = require('../models/liveClass');
const { Mentor } = require('../models/ourMentors');
const {Course} = require('../models/coursesModel');
const mongoose =require("mongoose");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

// CREATE LIVE CLASS
exports.createLiveClass = async (req, res) => {
 try {
    const {
      className,
      enrollmentId,
      mentorId, // Accept mentorId from input
      subjectName,
      date,
      timing,
      link
    } = req.body;

    // Validate required fields
    if (!className || !enrollmentId || !subjectName || !date || !timing || !link) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: className, enrollmentId, subjectName, date, timing, link' 
      });
    }

    // Check if enrollmentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid enrollment ID format' 
      });
    }

    // Check if mentorId is provided and valid
    if (mentorId && !mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid mentor ID format' 
      });
    }

    // Check enrollment exists
    const enrollment = await Enrollment.findById(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enrollment not found with the provided ID' 
      });
    }

    console.log('Enrollment document:', enrollment);

    // Get courseId from enrollment
    const courseId = enrollment.courseId;
    if (!courseId) {
      return res.status(404).json({ 
        success: false, 
        message: 'No course associated with this enrollment' 
      });
    }

    let finalMentorId = mentorId;
    
    // If mentorId is not provided, try to get from enrollment
    if (!finalMentorId) {
      if (enrollment.assignedMentors && enrollment.assignedMentors.length > 0) {
        finalMentorId = enrollment.assignedMentors[0];
        console.log('Using mentor from enrollment:', finalMentorId);
      } else {
        return res.status(404).json({ 
          success: false, 
          message: 'No mentor assigned to this enrollment. Please provide a mentorId or assign a mentor to this enrollment first.' 
        });
      }
    }

    // // Check if the mentor is assigned to this enrollment
    // if (!enrollment.assignedMentors || !enrollment.assignedMentors.includes(finalMentorId)) {
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: `Mentor with ID ${finalMentorId} is not assigned to this enrollment. Available mentors for this enrollment: ${enrollment.assignedMentors ? enrollment.assignedMentors.join(', ') : 'None'}` 
    //   });
    // }

    // Check if mentor exists
    const mentor = await Mentor.findById(finalMentorId);
    if (!mentor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mentor not found with ID: ' + finalMentorId 
      });
    }

    console.log('Found mentor:', mentor);

    // Note: Admin can assign any subject regardless of mentor's expertise
    // No strict subject validation as per requirements

    // Create and save live class with mentorId and courseId
    const liveClass = new LiveClass({
      className,
      enrollmentIdRef: enrollmentId,
      mentorId: finalMentorId,
      courseId,
      subjectName,
      date,
      timing,
      link
    });

    await liveClass.save();

    // Populate the response with enrollment, course, and mentor details
    const populatedLiveClass = await LiveClass.findById(liveClass._id)
      .populate({
        path: 'enrollmentIdRef',
        populate: {
          path: 'courseId',
          select: 'name description'
        }
      })
      .populate('mentorId', 'firstName lastName email expertise subjects')
      .select('-__v');

    // Format the response
    const responseData = {
      _id: populatedLiveClass._id,
      className: populatedLiveClass.className,
      enrollmentIdRef: {
        _id: populatedLiveClass.enrollmentIdRef._id,
        courseId: populatedLiveClass.enrollmentIdRef.courseId
      },
      mentorId: {
        _id: populatedLiveClass.mentorId._id,
        firstName: populatedLiveClass.mentorId.firstName,
        lastName: populatedLiveClass.mentorId.lastName,
        email: populatedLiveClass.mentorId.email,
        expertise: populatedLiveClass.mentorId.expertise,
        subjects: populatedLiveClass.mentorId.subjects
      },
      subjectName: populatedLiveClass.subjectName,
      date: populatedLiveClass.date,
      timing: populatedLiveClass.timing,
      link: populatedLiveClass.link,
      createdAt: populatedLiveClass.createdAt,
      updatedAt: populatedLiveClass.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Live class created successfully. Note: Admin can assign any subject regardless of mentor expertise.',
      data: responseData
    });

  } catch (error) {
    console.error('Error creating live class:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// GET ALL LIVE CLASSES
exports.getAllLiveClasses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      className,
      subjectName,
      mentorId,
      enrollmentId,
      courseId
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (className) {
      filter.className = { $regex: className, $options: 'i' };
    }
    
    if (subjectName) {
      filter.subjectName = { $regex: subjectName, $options: 'i' };
    }
    
    if (mentorId && mongoose.Types.ObjectId.isValid(mentorId)) {
      filter.mentorId = mentorId;
    }
    
    if (enrollmentId && mongoose.Types.ObjectId.isValid(enrollmentId)) {
      filter.enrollmentIdRef = enrollmentId;
    }
    
    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filter.courseId = courseId;
    }

    // Execute query with pagination and sorting
    const liveClasses = await LiveClass.find(filter)
      .populate({
        path: 'enrollmentIdRef',
        populate: {
          path: 'courseId',
          select: 'name description'
        }
      })
      .populate('mentorId', 'firstName lastName email expertise subjects')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    // Get total count for pagination
    const totalCount = await LiveClass.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Live classes retrieved successfully',
      data: liveClasses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error retrieving live classes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// GET LIVE CLASSES BY USER ID
exports.getLiveClassesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    const enrollments = await Enrollment.find({ enrolledUsers: userId }).select('_id');
    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No enrollments found for this user' 
      });
    }

    const enrollmentIds = enrollments.map(e => e._id);

    const liveClasses = await LiveClass.find({ enrollmentIdRef: { $in: enrollmentIds } })
      .populate({
        path: 'enrollmentIdRef',
        populate: [
          { path: 'courseId', select: 'name description' },
          { path: 'assignedMentors', select: 'firstName lastName email expertise subjects' }
        ]
      })
      .select('-__v')
      .sort({ date: -1 });

    if (!liveClasses || liveClasses.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No live classes found for this user' 
      });
    }

    const responseData = liveClasses.map(cls => ({
      _id: cls._id,
      className: cls.className,
      enrollmentIdRef: {
        _id: cls.enrollmentIdRef?._id,
        courseId: cls.enrollmentIdRef?.courseId || null,
        assignedMentors: cls.enrollmentIdRef?.assignedMentors || []
      },
      subjectName: cls.subjectName,
      date: cls.date,
      timing: cls.timing,
      link: cls.link,
      materials: cls.materials || [],   // <-- Include materials here
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: 'Live classes fetched successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching live classes by userId:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// GET LIVE CLASS BY ID
exports.getLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid live class ID format' 
      });
    }

    const liveClass = await LiveClass.findById(id)
      .populate({
        path: 'enrollmentIdRef',
        populate: {
          path: 'courseId',
          select: 'name description'
        }
      })
      .populate('mentorId', 'firstName lastName email expertise subjects')
      .select('-__v');

    if (!liveClass) {
      return res.status(404).json({ 
        success: false, 
        message: 'Live class not found with the provided ID' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Live class retrieved successfully',
      data: liveClass
    });

  } catch (error) {
    console.error('Error retrieving live class:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// UPDATE LIVE CLASS BY ID
exports.updateLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      className,
      enrollmentId,
      mentorId,
      subjectName,
      date,
      timing,
      link
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid live class ID format' 
      });
    }

    // Check if live class exists
    const existingLiveClass = await LiveClass.findById(id);
    if (!existingLiveClass) {
      return res.status(404).json({ 
        success: false, 
        message: 'Live class not found with the provided ID' 
      });
    }

    // Validate mentorId if provided
    if (mentorId && !mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid mentor ID format' 
      });
    }

    // Validate enrollmentId if provided
    if (enrollmentId && !mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid enrollment ID format' 
      });
    }

    let finalEnrollmentId = enrollmentId || existingLiveClass.enrollmentIdRef;
    let finalMentorId = mentorId || existingLiveClass.mentorId;
    let finalCourseId = existingLiveClass.courseId;

    // If enrollmentId is being updated, validate it and get courseId
    if (enrollmentId && enrollmentId !== existingLiveClass.enrollmentIdRef.toString()) {
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ 
          success: false, 
          message: 'Enrollment not found with the provided ID' 
        });
      }
      
      if (!enrollment.courseId) {
        return res.status(404).json({ 
          success: false, 
          message: 'No course associated with this enrollment' 
        });
      }
      
      finalCourseId = enrollment.courseId;
      
      // Validate mentor assignment if mentorId is also provided or exists
      if (finalMentorId) {
        if (!enrollment.assignedMentors || !enrollment.assignedMentors.includes(finalMentorId)) {
          return res.status(400).json({ 
            success: false, 
            message: `Mentor with ID ${finalMentorId} is not assigned to enrollment ${enrollmentId}` 
          });
        }
      }
    }

    // If mentorId is being updated, validate it exists and is assigned to enrollment
    if (mentorId && mentorId !== existingLiveClass.mentorId.toString()) {
      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Mentor not found with ID: ' + mentorId 
        });
      }

      // Check if mentor is assigned to the enrollment
      const enrollment = await Enrollment.findById(finalEnrollmentId);
      if (!enrollment.assignedMentors || !enrollment.assignedMentors.includes(mentorId)) {
        return res.status(400).json({ 
          success: false, 
          message: `Mentor with ID ${mentorId} is not assigned to enrollment ${finalEnrollmentId}` 
        });
      }
    }

    // Prepare update data
    const updateData = {
      ...(className && { className }),
      ...(enrollmentId && { enrollmentIdRef: enrollmentId }),
      ...(mentorId && { mentorId }),
      ...(subjectName && { subjectName }),
      ...(date && { date }),
      ...(timing && { timing }),
      ...(link && { link }),
      ...(enrollmentId && { courseId: finalCourseId })
    };

    const updatedLiveClass = await LiveClass.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({
        path: 'enrollmentIdRef',
        populate: {
          path: 'courseId',
          select: 'name description'
        }
      })
      .populate('mentorId', 'firstName lastName email expertise subjects')
      .select('-__v');

    res.status(200).json({
      success: true,
      message: 'Live class updated successfully',
      data: updatedLiveClass
    });

  } catch (error) {
    console.error('Error updating live class:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// DELETE LIVE CLASS BY ID
exports.deleteLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid live class ID format' 
      });
    }

    const liveClass = await LiveClass.findByIdAndDelete(id);

    if (!liveClass) {
      return res.status(404).json({ 
        success: false, 
        message: 'Live class not found with the provided ID' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Live class deleted successfully',
      data: {
        _id: liveClass._id,
        className: liveClass.className,
        deleted: true
      }
    });

  } catch (error) {
    console.error('Error deleting live class:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// GET LIVE CLASSES BY MENTOR ID
exports.getLiveClassesByMentorId = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid mentor ID format' 
      });
    }

    // Check if mentor exists
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mentor not found with the provided ID' 
      });
    }

    const filter = { mentorId };

    const liveClasses = await LiveClass.find(filter)
      .populate({
        path: 'enrollmentIdRef',
        populate: {
          path: 'courseId',
          select: 'name description'
        }
      })
      .populate('mentorId', 'firstName lastName email expertise subjects')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const totalCount = await LiveClass.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: `Live classes for mentor ${mentor.firstName} ${mentor.lastName} retrieved successfully`,
      data: liveClasses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error retrieving live classes by mentor:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// GET LIVE CLASSES BY ENROLLMENT ID
exports.getLiveClassesByEnrollmentId = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid enrollment ID format' 
      });
    }

    // Check if enrollment exists
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enrollment not found with the provided ID' 
      });
    }

    const filter = { enrollmentIdRef: enrollmentId };

    const liveClasses = await LiveClass.find(filter)
      .populate({
        path: 'enrollmentIdRef',
        populate: {
          path: 'courseId',
          select: 'name description'
        }
      })
      .populate('mentorId', 'firstName lastName email expertise subjects')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const totalCount = await LiveClass.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: `Live classes for enrollment ${enrollment.batchName} retrieved successfully`,
      data: liveClasses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error retrieving live classes by enrollment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};



// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadMaterialForLiveClass = async (req, res) => {
  try {
    const { mentorId, liveClassId } = req.params;

    // Check if file is sent
    if (!req.files || !req.files.material) {
      return res.status(400).json({
        success: false,
        message: "File is required"
      });
    }

    const file = req.files.material;

    console.log("Uploading file:", file.name);

    // Check if live class exists
    const liveClass = await LiveClass.findOne({ _id: liveClassId, mentorId });
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found for this mentor"
      });
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: `liveclass_materials/${mentorId}/${liveClassId}`,
      resource_type: "auto" // supports PDF, DOC, PPT, images, etc.
    });

    console.log("Cloudinary upload result:", result.secure_url);

    const materialData = {
      fileName: file.name,
      fileUrl: result.secure_url,
      uploadedAt: new Date(),
      fileSize: file.size,
      fileType: file.mimetype
    };

    liveClass.materials = liveClass.materials || [];
    liveClass.materials.push(materialData);
    await liveClass.save();

    // Delete temp file
    fs.unlinkSync(file.tempFilePath);

    res.status(201).json({
      success: true,
      message: "Material uploaded successfully to Cloudinary",
      liveClassId,
      uploadedFile: materialData,
      totalMaterials: liveClass.materials.length
    });

  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};