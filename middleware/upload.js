const multer = require("multer");

// webcam snapshot uploaded as multipart/form-data, straight to the Snap column
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;