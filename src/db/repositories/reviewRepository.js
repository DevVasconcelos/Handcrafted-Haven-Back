const { query, findOne, insertOne, updateOne } = require('../query');

const reviewRepository = {
  async create(reviewData) {
    const columns = Object.keys(reviewData);
    const values = Object.values(reviewData);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    
    const sql = `
      INSERT INTO reviews (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    const result = await insertOne(sql, values);
    return result;
  },

  async findById(id) {
    const sql = `
      SELECT 
        r.*,
        u.first_name || ' ' || u.last_name as reviewer_name,
        u.avatar as reviewer_avatar,
        s.slug as seller_slug,
        p.title as product_title,
        p.slug as product_slug
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      JOIN sellers s ON r.seller_id = s.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.id = $1
    `;
    return findOne(sql, [id]);
  },

  async findBySellerId(sellerId, options = {}) {
    const { page = 1, limit = 20, productId } = options;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT 
        r.*,
        u.first_name || ' ' || u.last_name as reviewer_name,
        u.avatar as reviewer_avatar,
        p.title as product_title,
        p.slug as product_slug
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.seller_id = $1
    `;
    
    const params = [sellerId];
    let paramCount = 2;
    
    if (productId) {
      sql += ` AND r.product_id = $${paramCount}`;
      params.push(productId);
      paramCount++;
    }
    
    sql += ` ORDER BY r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const countSql = productId
      ? 'SELECT COUNT(*) FROM reviews WHERE seller_id = $1 AND product_id = $2'
      : 'SELECT COUNT(*) FROM reviews WHERE seller_id = $1';
    const countParams = productId ? [sellerId, productId] : [sellerId];
    
    const [dataResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, countParams)
    ]);
    
    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  },

  async findByProductId(productId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT 
        r.*,
        u.first_name || ' ' || u.last_name as reviewer_name,
        u.avatar as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countSql = 'SELECT COUNT(*) FROM reviews WHERE product_id = $1';
    
    const [dataResult, countResult] = await Promise.all([
      query(sql, [productId, limit, offset]),
      query(countSql, [productId])
    ]);
    
    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  },

  async findByReviewerId(reviewerId) {
    const sql = `
      SELECT 
        r.*,
        s.slug as seller_slug,
        u.first_name || ' ' || u.last_name as seller_name,
        p.title as product_title,
        p.slug as product_slug
      FROM reviews r
      JOIN sellers s ON r.seller_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.reviewer_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await query(sql, [reviewerId]);
    return result.rows;
  },

  async checkIfUserReviewedSeller(reviewerId, sellerId) {
    const sql = 'SELECT id FROM reviews WHERE reviewer_id = $1 AND seller_id = $2';
    const result = await query(sql, [reviewerId, sellerId]);
    return result.rows.length > 0;
  },

  async checkIfUserReviewedProduct(reviewerId, productId) {
    const sql = 'SELECT id FROM reviews WHERE reviewer_id = $1 AND product_id = $2';
    const result = await query(sql, [reviewerId, productId]);
    return result.rows.length > 0;
  },

  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount++}`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      const sql = 'SELECT * FROM reviews WHERE id = $1';
      return findOne(sql, [id]);
    }

    values.push(id);
    const sql = `
      UPDATE reviews 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    return await updateOne(sql, values);
  },

  async deleteById(id) {
    const sql = 'DELETE FROM reviews WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  },

  async getSellerRating(sellerId) {
    const sql = `
      SELECT 
        COUNT(*) as review_count,
        COALESCE(AVG(rating), 0) as average_rating
      FROM reviews
      WHERE seller_id = $1
    `;
    const result = await query(sql, [sellerId]);
    return {
      reviewCount: parseInt(result.rows[0].review_count),
      averageRating: parseFloat(result.rows[0].average_rating)
    };
  },

  async getProductRating(productId) {
    const sql = `
      SELECT 
        COUNT(*) as review_count,
        COALESCE(AVG(rating), 0) as average_rating
      FROM reviews
      WHERE product_id = $1
    `;
    const result = await query(sql, [productId]);
    return {
      reviewCount: parseInt(result.rows[0].review_count),
      averageRating: parseFloat(result.rows[0].average_rating)
    };
  },

  async countBySellerId(sellerId) {
    const sql = 'SELECT COUNT(*) FROM reviews WHERE seller_id = $1';
    const result = await query(sql, [sellerId]);
    return parseInt(result.rows[0].count);
  },

  async countByProductId(productId) {
    const sql = 'SELECT COUNT(*) FROM reviews WHERE product_id = $1';
    const result = await query(sql, [productId]);
    return parseInt(result.rows[0].count);
  },

  async getRatingDistribution(sellerId) {
    const sql = `
      SELECT 
        rating,
        COUNT(*) as count
      FROM reviews
      WHERE seller_id = $1
      GROUP BY rating
      ORDER BY rating DESC
    `;
    const result = await query(sql, [sellerId]);
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    result.rows.forEach(row => {
      distribution[row.rating] = parseInt(row.count);
    });
    
    return distribution;
  }
};

module.exports = reviewRepository;
