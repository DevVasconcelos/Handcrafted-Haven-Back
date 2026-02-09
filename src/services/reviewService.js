const reviewRepository = require('../db/repositories/reviewRepository');
const sellerRepository = require('../db/repositories/sellerRepository');
const productRepository = require('../db/repositories/productRepository');
const userRepository = require('../db/repositories/userRepository');
const ApiError = require('../utils/ApiError');

const reviewService = {
  async createReview(reviewerId, reviewData) {
    const seller = await sellerRepository.findById(reviewData.seller_id);
    if (!seller) {
      throw new ApiError(404, 'Seller not found');
    }

    const reviewer = await userRepository.findById(reviewerId);
    if (!reviewer) {
      throw new ApiError(404, 'User not found');
    }

    if (seller.user_id === reviewerId) {
      throw new ApiError(400, 'You cannot review your own profile');
    }

    const isProductReview = Boolean(reviewData.product_id);

    if (isProductReview) {
      const product = await productRepository.findById(reviewData.product_id);
      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      if (product.seller_id !== reviewData.seller_id) {
        throw new ApiError(400, 'The product does not belong to this seller');
      }

      const alreadyReviewedProduct = await reviewRepository.checkIfUserReviewedProduct(
        reviewerId,
        reviewData.product_id
      );

      if (alreadyReviewedProduct) {
        throw new ApiError(400, 'You have already reviewed this product');
      }
    } else {
      const alreadyReviewedSeller = await reviewRepository.checkIfUserReviewedSeller(
        reviewerId,
        reviewData.seller_id
      );

      if (alreadyReviewedSeller) {
        throw new ApiError(400, 'You have already reviewed this seller');
      }
    }

    const review = await reviewRepository.create({
      reviewer_id: reviewerId,
      ...reviewData
    });

    if (reviewData.product_id) {
      await this.updateProductRating(reviewData.product_id);
    }

    return this.getReviewById(review.id);
  },

  async getReviewById(id) {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw new ApiError(404, 'Review not found');
    }
    return review;
  },

  async getReviewsBySeller(sellerId, options = {}) {
    const seller = await sellerRepository.findById(sellerId);
    if (!seller) {
      throw new ApiError(404, 'Seller not found');
    }

    return reviewRepository.findBySellerId(sellerId, options);
  },

  async getReviewsByProduct(productId, options = {}) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    return reviewRepository.findByProductId(productId, options);
  },

  async getMyReviews(reviewerId) {
    return reviewRepository.findByReviewerId(reviewerId);
  },

  async updateReview(id, reviewerId, updates) {
    const review = await reviewRepository.findById(id);
    
    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    if (review.reviewer_id !== reviewerId) {
      throw new ApiError(403, 'You do not have permission to edit this review');
    }

    const updatedReview = await reviewRepository.update(id, updates);

    if (review.product_id) {
      await this.updateProductRating(review.product_id);
    }

    return this.getReviewById(id);
  },

  async deleteReview(id, reviewerId) {
    const review = await reviewRepository.findById(id);
    
    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    if (review.reviewer_id !== reviewerId) {
      throw new ApiError(403, 'You do not have permission to delete this review');
    }

    const productId = review.product_id;
    await reviewRepository.deleteById(id);

    if (productId) {
      await this.updateProductRating(productId);
    }

    return { deleted: true };
  },

  async updateProductRating(productId) {
    const { reviewCount, averageRating } = await reviewRepository.getProductRating(productId);
    
    await productRepository.updateRating(
      productId, 
      Math.round(averageRating * 100) / 100,
      reviewCount
    );

    return { reviewCount, averageRating };
  },

  async getSellerStats(sellerId) {
    const seller = await sellerRepository.findById(sellerId);
    if (!seller) {
      throw new ApiError(404, 'Seller not found');
    }

    const { reviewCount, averageRating } = await reviewRepository.getSellerRating(sellerId);
    const distribution = await reviewRepository.getRatingDistribution(sellerId);

    return {
      reviewCount,
      averageRating: Math.round(averageRating * 100) / 100,
      distribution
    };
  },

  async canUserReview(reviewerId, sellerId) {
    const alreadyReviewed = await reviewRepository.checkIfUserReviewedSeller(reviewerId, sellerId);
    return !alreadyReviewed;
  }
};

module.exports = reviewService;
