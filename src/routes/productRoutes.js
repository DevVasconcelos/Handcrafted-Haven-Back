const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createProductSchema, updateProductSchema, addImagesSchema } = require('../validations/productValidation');

router.get('/', productController.getAllProducts);
router.get('/search', productController.getAllProducts);
router.get('/my-products', authenticate, requireRole('SELLER'), productController.getMyProducts);
router.get('/seller/:id', productController.getProductsBySeller);
router.get('/category/:id', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);
router.get('/slug/:slug', productController.getProductBySlug);

router.post('/', authenticate, requireRole('SELLER'), validate(createProductSchema), productController.createProduct);
router.put('/:id', authenticate, requireRole('SELLER'), validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', authenticate, requireRole('SELLER'), productController.deleteProduct);

router.post('/:id/images', authenticate, requireRole('SELLER'), validate(addImagesSchema), productController.addImages);
router.delete('/images/:imageId', authenticate, requireRole('SELLER'), productController.removeImage);
router.patch('/images/:imageId/primary', authenticate, requireRole('SELLER'), productController.setPrimaryImage);

router.patch('/:id/stock', authenticate, requireRole('SELLER'), productController.updateStock);

module.exports = router;
