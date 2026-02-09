const dashboardService = require('../services/dashboardService');

const dashboardController = {
  async getDashboard(req, res, next) {
    try {
      const sellerId = req.seller.id;
      const { period } = req.query;

      const dashboard = await dashboardService.getDashboard(sellerId, period);

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  },

  async getOverview(req, res, next) {
    try {
      const sellerId = req.seller.id;

      const overview = await dashboardService.getOverview(sellerId);

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      next(error);
    }
  },

  async getProductStats(req, res, next) {
    try {
      const sellerId = req.seller.id;

      const stats = await dashboardService.getProductStats(sellerId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  async getReviewStats(req, res, next) {
    try {
      const sellerId = req.seller.id;

      const stats = await dashboardService.getReviewStats(sellerId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  async getTimelineStats(req, res, next) {
    try {
      const sellerId = req.seller.id;
      const { period } = req.query;

      const timeline = await dashboardService.getTimelineStats(sellerId, period);

      res.json({
        success: true,
        data: timeline
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = dashboardController;
