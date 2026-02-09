const reviewService = require('../services/reviewService');

const reviewController = {
  async createReview(req, res, next) {
    try {
      const reviewerId = req.user.id;
      const review = await reviewService.createReview(reviewerId, req.body);
      
      res.status(201).json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  },

  async getReviewById(req, res, next) {
    try {
      const { id } = req.params;
      const review = await reviewService.getReviewById(parseInt(id));
      
      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  },

  async getReviewsBySeller(req, res, next) {
    try {
      const { sellerId } = req.params;
      const { page = 1, limit = 20, productId } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        productId: productId ? parseInt(productId) : undefined
      };
      
      const result = await reviewService.getReviewsBySeller(parseInt(sellerId), options);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  },

  async getReviewsByProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const result = await reviewService.getReviewsByProduct(parseInt(productId), options);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyReviews(req, res, next) {
    try {
      const reviewerId = req.user.id;
      const reviews = await reviewService.getMyReviews(reviewerId);
      
      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      next(error);
    }
  },

  async updateReview(req, res, next) {
    try {
      const { id } = req.params;
      const reviewerId = req.user.id;
      
      const review = await reviewService.updateReview(parseInt(id), reviewerId, req.body);
      
      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      const reviewerId = req.user.id;
      
      await reviewService.deleteReview(parseInt(id), reviewerId);
      
      res.json({
        success: true,
        message: 'Avaliação deletada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  },

  async getSellerStats(req, res, next) {
    try {
      const { sellerId } = req.params;
      const stats = await reviewService.getSellerStats(parseInt(sellerId));
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  async canUserReview(req, res, next) {
    try {
      const { sellerId } = req.params;
      const reviewerId = req.user.id;
      
      const canReview = await reviewService.canUserReview(reviewerId, parseInt(sellerId));
      
      res.json({
        success: true,
        data: { canReview }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reviewController;
