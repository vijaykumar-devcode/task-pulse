const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF documents are allowed'));
      return;
    }
    cb(null, true);
  },
});

const uploadDocuments = upload.array('documents', 3);

module.exports = { uploadDocuments };
