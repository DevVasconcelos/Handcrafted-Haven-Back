const { query } = require('../db/query');

class DashboardService {
  async getOverview(sellerId) {
    const result = await query(
      `
      SELECT 
        (SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status != 'DELETED') as total_products,
        (SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = 'ACTIVE') as active_products,
        (SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = 'OUT_OF_STOCK') as out_of_stock_products,
        (SELECT COUNT(*) FROM products WHERE seller_id = $1 AND stock = 0) as zero_stock,
        (SELECT COUNT(*) FROM reviews WHERE seller_id = $1) as total_reviews,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE seller_id = $1) as average_rating,
        (SELECT SUM(review_count) FROM products WHERE seller_id = $1) as total_product_reviews
      `,
      [sellerId]
    );

    return {
      products: {
        total: parseInt(result.rows[0].total_products),
        active: parseInt(result.rows[0].active_products),
        outOfStock: parseInt(result.rows[0].out_of_stock_products),
        zeroStock: parseInt(result.rows[0].zero_stock)
      },
      reviews: {
        total: parseInt(result.rows[0].total_reviews),
        averageRating: parseFloat(result.rows[0].average_rating),
        totalProductReviews: parseInt(result.rows[0].total_product_reviews || 0)
      }
    };
  }

  async getProductStats(sellerId) {
    const byCategory = await query(
      `
      SELECT 
        c.name as category_name,
        c.slug as category_slug,
        COUNT(p.id) as product_count,
        AVG(p.rating) as average_rating,
        SUM(p.review_count) as total_reviews
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.seller_id = $1
      GROUP BY c.id, c.name, c.slug
      ORDER BY product_count DESC
      `,
      [sellerId]
    );

    const topRated = await query(
      `
      SELECT 
        id,
        title,
        slug,
        price,
        rating,
        review_count,
        stock
      FROM products
      WHERE seller_id = $1 AND rating > 0
      ORDER BY rating DESC, review_count DESC
      LIMIT 5
      `,
      [sellerId]
    );

    const recentProducts = await query(
      `
      SELECT 
        id,
        title,
        slug,
        price,
        status,
        stock,
        created_at
      FROM products
      WHERE seller_id = $1
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [sellerId]
    );

    return {
      byCategory: byCategory.rows.map(row => ({
        categoryName: row.category_name,
        categorySlug: row.category_slug,
        productCount: parseInt(row.product_count),
        averageRating: parseFloat(row.average_rating || 0),
        totalReviews: parseInt(row.total_reviews || 0)
      })),
      topRated: topRated.rows,
      recentProducts: recentProducts.rows
    };
  }

  async getReviewStats(sellerId) {
    const distribution = await query(
      `
      SELECT 
        rating,
        COUNT(*) as count
      FROM reviews
      WHERE seller_id = $1
      GROUP BY rating
      ORDER BY rating DESC
      `,
      [sellerId]
    );

    const recentReviews = await query(
      `
      SELECT 
        r.id,
        r.rating,
        r.text,
        r.created_at,
        u.first_name || ' ' || u.last_name as reviewer_name,
        u.avatar as reviewer_avatar,
        p.title as product_title,
        p.slug as product_slug
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.seller_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10
      `,
      [sellerId]
    );

    const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.rows.forEach(row => {
      ratingDist[row.rating] = parseInt(row.count);
    });

    return {
      distribution: ratingDist,
      recentReviews: recentReviews.rows
    };
  }

  async getTimelineStats(sellerId, period = 'month') {
    let dateFormat;
    let dateInterval;

    switch (period) {
      case 'week':
        dateFormat = 'YYYY-MM-DD';
        dateInterval = "NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFormat = 'YYYY-MM-DD';
        dateInterval = "NOW() - INTERVAL '30 days'";
        break;
      case 'year':
        dateFormat = 'YYYY-MM';
        dateInterval = "NOW() - INTERVAL '1 year'";
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        dateInterval = "NOW() - INTERVAL '30 days'";
    }

    const productsTimeline = await query(
      `
      SELECT 
        TO_CHAR(created_at, '${dateFormat}') as date,
        COUNT(*) as count
      FROM products
      WHERE seller_id = $1 AND created_at >= ${dateInterval}
      GROUP BY TO_CHAR(created_at, '${dateFormat}')
      ORDER BY date ASC
      `,
      [sellerId]
    );

    const reviewsTimeline = await query(
      `
      SELECT 
        TO_CHAR(created_at, '${dateFormat}') as date,
        COUNT(*) as count,
        AVG(rating) as average_rating
      FROM reviews
      WHERE seller_id = $1 AND created_at >= ${dateInterval}
      GROUP BY TO_CHAR(created_at, '${dateFormat}')
      ORDER BY date ASC
      `,
      [sellerId]
    );

    return {
      period,
      products: productsTimeline.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count)
      })),
      reviews: reviewsTimeline.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count),
        averageRating: parseFloat(row.average_rating)
      }))
    };
  }

  async getDashboard(sellerId, period = 'month') {
    const [overview, productStats, reviewStats, timeline] = await Promise.all([
      this.getOverview(sellerId),
      this.getProductStats(sellerId),
      this.getReviewStats(sellerId),
      this.getTimelineStats(sellerId, period)
    ]);

    return {
      overview,
      products: productStats,
      reviews: reviewStats,
      timeline
    };
  }
}

module.exports = new DashboardService();
