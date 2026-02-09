const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createReviewSchema, updateReviewSchema } = require('../validations/reviewValidation');

router.get('/my-reviews', authenticate, reviewController.getMyReviews);
router.get('/seller/:sellerId', reviewController.getReviewsBySeller);
router.get('/seller/:sellerId/stats', reviewController.getSellerStats);
router.get('/seller/:sellerId/can-review', authenticate, reviewController.canUserReview);
router.get('/product/:productId', reviewController.getReviewsByProduct);
router.get('/:id', reviewController.getReviewById);

router.post('/', authenticate, validate(createReviewSchema), reviewController.createReview);
router.put('/:id', authenticate, validate(updateReviewSchema), reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

module.exports = router;
