const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.use(authenticate);
router.use(requireRole('SELLER'));

router.get('/', dashboardController.getDashboard);
router.get('/overview', dashboardController.getOverview);
router.get('/products', dashboardController.getProductStats);
router.get('/reviews', dashboardController.getReviewStats);
router.get('/timeline', dashboardController.getTimelineStats);

module.exports = router;
