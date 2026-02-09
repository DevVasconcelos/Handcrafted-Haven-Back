const { query, transaction, findOne, findMany, findWithPagination, insertOne, updateOne, deleteOne } = require('../query');

const productRepository = {
  async create(productData) {
    const columns = Object.keys(productData);
    const values = Object.values(productData);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    
    const sql = `
      INSERT INTO products (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    const result = await insertOne(sql, values);
    return result;
  },

  async findById(id) {
    const sql = 'SELECT * FROM products WHERE id = $1';
    return findOne(sql, [id]);
  },

  async findByIdFull(id) {
    const sql = 'SELECT * FROM products_full WHERE id = $1';
    return query(sql, [id]).then(result => result.rows[0] || null);
  },

  async findBySlug(slug) {
    const sql = 'SELECT * FROM products WHERE slug = $1';
    return findOne(sql, [slug]);
  },

  async findBySlugFull(slug) {
    const sql = 'SELECT * FROM products_full WHERE slug = $1';
    return query(sql, [slug]).then(result => result.rows[0] || null);
  },

  async slugExists(slug, excludeId = null) {
    if (excludeId) {
      const sql = 'SELECT id FROM products WHERE slug = $1 AND id != $2';
      const result = await query(sql, [slug, excludeId]);
      return result.rows.length > 0;
    }
    const sql = 'SELECT id FROM products WHERE slug = $1';
    const result = await query(sql, [slug]);
    return result.rows.length > 0;
  },

  async findAll(options = {}) {
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = options;
    const validSorts = ['created_at', 'price', 'rating', 'sales_count', 'title'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const orderDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    return findWithPagination('products', { page, limit, sort: `${sortField} ${orderDirection}` });
  },

  async findAllFull(options = {}) {
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = options;
    const validSorts = ['created_at', 'price', 'rating', 'sales_count', 'title'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const orderDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const offset = (page - 1) * limit;
    const sql = `
      SELECT * FROM products_full
      ORDER BY ${sortField} ${orderDirection}
      LIMIT $1 OFFSET $2
    `;
    const countSql = 'SELECT COUNT(*) FROM products_full';
    
    const [dataResult, countResult] = await Promise.all([
      query(sql, [limit, offset]),
      query(countSql)
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

  async findBySellerId(sellerId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM products WHERE seller_id = $1';
    const params = [sellerId];
    
    if (status) {
      sql += ' AND status = $2';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const countSql = status 
      ? 'SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = $2'
      : 'SELECT COUNT(*) FROM products WHERE seller_id = $1';
    const countParams = status ? [sellerId, status] : [sellerId];
    
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

  async findBySellerIdFull(sellerId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM products_full WHERE seller_id = $1';
    const params = [sellerId];
    
    if (status) {
      sql += ' AND status = $2';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const countSql = status 
      ? 'SELECT COUNT(*) FROM products_full WHERE seller_id = $1 AND status = $2'
      : 'SELECT COUNT(*) FROM products_full WHERE seller_id = $1';
    const countParams = status ? [sellerId, status] : [sellerId];
    
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

  async findByCategoryId(categoryId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT * FROM products 
      WHERE category_id = $1 AND status = 'ACTIVE'
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const countSql = `SELECT COUNT(*) FROM products WHERE category_id = $1 AND status = 'ACTIVE'`;
    
    const [dataResult, countResult] = await Promise.all([
      query(sql, [categoryId, limit, offset]),
      query(countSql, [categoryId])
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

  async findByCategoryIdFull(categoryId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT * FROM products_full 
      WHERE category_id = $1 AND status = 'ACTIVE'
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const countSql = `SELECT COUNT(*) FROM products_full WHERE category_id = $1 AND status = 'ACTIVE'`;
    
    const [dataResult, countResult] = await Promise.all([
      query(sql, [categoryId, limit, offset]),
      query(countSql, [categoryId])
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

  async findWithFilters(filters = {}, options = {}) {
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = options;
    const { categoryId, sellerId, minPrice, maxPrice, status, handmade, customizable } = filters;
    
    const validSorts = ['created_at', 'price', 'rating', 'sales_count', 'title'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const orderDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    if (categoryId) {
      conditions.push(`category_id = $${paramCount}`);
      params.push(categoryId);
      paramCount++;
    }
    
    if (sellerId) {
      conditions.push(`seller_id = $${paramCount}`);
      params.push(sellerId);
      paramCount++;
    }
    
    if (minPrice !== undefined) {
      conditions.push(`price >= $${paramCount}`);
      params.push(minPrice);
      paramCount++;
    }
    
    if (maxPrice !== undefined) {
      conditions.push(`price <= $${paramCount}`);
      params.push(maxPrice);
      paramCount++;
    }
    
    if (status) {
      conditions.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    
    if (handmade !== undefined) {
      conditions.push(`handmade = $${paramCount}`);
      params.push(handmade);
      paramCount++;
    }
    
    if (customizable !== undefined) {
      conditions.push(`customizable = $${paramCount}`);
      params.push(customizable);
      paramCount++;
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT * FROM products_full
      ${whereClause}
      ORDER BY ${sortField} ${orderDirection}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);
    
    const countSql = `SELECT COUNT(*) FROM products_full ${whereClause}`;
    const countParams = params.slice(0, -2);
    
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

  async search(searchTerm, filters = {}, options = {}) {
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = options;
    const { categoryId, minPrice, maxPrice } = filters;
    
    const validSorts = ['created_at', 'price', 'rating', 'sales_count', 'title'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const orderDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const conditions = [
      `to_tsvector('english', title || ' ' || description || ' ' || COALESCE(tags, '')) @@ plainto_tsquery('english', $1)`
    ];
    const params = [searchTerm];
    let paramCount = 2;
    
    if (categoryId) {
      conditions.push(`category_id = $${paramCount}`);
      params.push(categoryId);
      paramCount++;
    }
    
    if (minPrice !== undefined) {
      conditions.push(`price >= $${paramCount}`);
      params.push(minPrice);
      paramCount++;
    }
    
    if (maxPrice !== undefined) {
      conditions.push(`price <= $${paramCount}`);
      params.push(maxPrice);
      paramCount++;
    }
    
    conditions.push(`status = 'ACTIVE'`);
    
    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT * FROM products_full
      ${whereClause}
      ORDER BY ${sortField} ${orderDirection}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);
    
    const countSql = `SELECT COUNT(*) FROM products_full ${whereClause}`;
    const countParams = params.slice(0, -2);
    
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
      return await this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE products 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    return await updateOne(sql, values);
  },

  async updateStock(id, stock) {
    const sql = 'UPDATE products SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await query(sql, [stock, id]);
    return result.rows[0] || null;
  },

  async updateRating(id, rating, reviewCount) {
    const sql = 'UPDATE products SET rating = $1, review_count = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
    const result = await query(sql, [rating, reviewCount, id]);
    return result.rows[0] || null;
  },

  async incrementSalesCount(id) {
    const sql = 'UPDATE products SET sales_count = sales_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  async deleteById(id) {
    const sql = 'DELETE FROM products WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  },

  async countAll() {
    const sql = 'SELECT COUNT(*) FROM products';
    const result = await query(sql);
    return parseInt(result.rows[0].count);
  },

  async countByFilters(filters = {}) {
    const { categoryId, sellerId, status } = filters;
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    if (categoryId) {
      conditions.push(`category_id = $${paramCount}`);
      params.push(categoryId);
      paramCount++;
    }
    
    if (sellerId) {
      conditions.push(`seller_id = $${paramCount}`);
      params.push(sellerId);
      paramCount++;
    }
    
    if (status) {
      conditions.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT COUNT(*) FROM products ${whereClause}`;
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
};

module.exports = productRepository;
