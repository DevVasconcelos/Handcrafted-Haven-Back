const express = require('express');
const categoryController = require('../controllers/categoryController');
const validate = require('../middlewares/validate');
const { createCategorySchema, updateCategorySchema } = require('../validations/categoryValidation');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

router.post('/', authenticate, requireRole('SELLER'), validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', authenticate, requireRole('SELLER'), validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', authenticate, requireRole('SELLER'), categoryController.deleteCategory);

module.exports = router;
