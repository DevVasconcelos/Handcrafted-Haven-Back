const multer = require('multer');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Tipo de arquivo não permitido. Use JPEG, PNG, WEBP ou GIF'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'Arquivo muito grande. Tamanho máximo: 5MB'));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new ApiError(400, 'Muitos arquivos. Máximo: 10 arquivos'));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ApiError(400, 'Campo de arquivo inesperado'));
    }
    return next(new ApiError(400, `Erro no upload: ${error.message}`));
  }
  next(error);
};

module.exports = {
  upload,
  handleMulterError,
  single: (fieldName) => [upload.single(fieldName), handleMulterError],
  array: (fieldName, maxCount = 10) => [upload.array(fieldName, maxCount), handleMulterError],
  fields: (fields) => [upload.fields(fields), handleMulterError],
};
