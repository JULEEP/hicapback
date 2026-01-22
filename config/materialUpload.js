// materialUpload.js में ये changes करें:
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Ensure upload folder exists
const materialUploadPath = "uploads/materials";
if (!fs.existsSync(materialUploadPath)) {
  fs.mkdirSync(materialUploadPath, { recursive: true });
}

const materialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("📁 Destination called for file:", file.originalname);
    cb(null, materialUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const newFilename = `${baseName}-${uniqueSuffix}${ext}`;
    console.log("📝 New filename:", newFilename);
    cb(null, newFilename);
  },
});

// Multer configuration में ये changes करें:
const materialUpload = multer({ 
  storage: materialStorage,
  fileFilter: function (req, file, cb) {
    console.log("🔍 File filter checking:", {
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain"
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      console.log("✅ File type allowed");
      cb(null, true);
    } else {
      console.log("❌ File type rejected:", file.mimetype);
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
  },
  limits: { 
    fileSize: 10 * 1024 * 1024,
    fields: 0,  // No form fields expected
    files: 1,   // Only 1 file
    parts: 10   // Limit parts in multipart
  }
});

module.exports = materialUpload;
