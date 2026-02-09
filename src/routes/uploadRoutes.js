const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate, requireRole } = require('../middlewares/auth');
const { single, array } = require('../middlewares/upload');

router.post('/single', authenticate, requireRole('SELLER'), ...single('image'), uploadController.uploadSingleImage);
router.post('/multiple', authenticate, requireRole('SELLER'), ...array('images', 10), uploadController.uploadMultipleImages);

router.delete('/single', authenticate, requireRole('SELLER'), uploadController.deleteImage);
router.delete('/multiple', authenticate, requireRole('SELLER'), uploadController.deleteMultipleImages);

router.get('/list', authenticate, requireRole('SELLER'), uploadController.listImages);

module.exports = router;
