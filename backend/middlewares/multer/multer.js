const fs = require('fs');
const path = require('path');

const multer = require('multer');

function init() {
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join('uploads', req.params.roomName);
      if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

      return cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now();
      return cb(null, `${uniqueSuffix}_${file.originalname}`);
    }
  });

  return multer({ storage: storage, limits: { fieldSize: 52428800 } });
}

module.exports = init;