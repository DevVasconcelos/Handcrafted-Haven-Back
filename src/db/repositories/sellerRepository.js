const { query, insertOne, findOne, findMany, updateOne } = require('../query');

const create = async (sellerData) => {
  const { userId, slug, location, specialty, bio, memberSince, gradient } = sellerData;
  
  const sql = `
    INSERT INTO sellers (user_id, slug, location, specialty, bio, member_since, gradient)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  return await insertOne(sql, [userId, slug, location, specialty, bio, memberSince, gradient]);
};

const findByUserId = async (userId) => {
  const sql = 'SELECT * FROM sellers WHERE user_id = $1';
  return await findOne(sql, [userId]);
};

const findById = async (id) => {
  const sql = 'SELECT * FROM sellers WHERE id = $1';
  return await findOne(sql, [id]);
};

const findBySlug = async (slug) => {
  const sql = `
    SELECT 
      s.*,
      u.first_name,
      u.last_name,
      u.email,
      u.avatar,
      u.created_at as user_created_at
    FROM sellers s
    JOIN users u ON s.user_id = u.id
    WHERE s.slug = $1
  `;
  return await findOne(sql, [slug]);
};

const findBySlugWithStats = async (slug) => {
  const sql = `
    SELECT 
      s.id,
      s.slug,
      s.bio,
      s.gradient,
      s.location,
      s.specialty,
      s.member_since,
      u.first_name || ' ' || u.last_name AS name,
      u.avatar,
      u.email,
      COUNT(DISTINCT p.id) AS products_count,
      COALESCE(AVG(r.rating), 0) AS average_rating,
      COUNT(DISTINCT r.id) AS reviews_count,
      COALESCE(SUM(p.sales_count), 0) AS total_sales
    FROM sellers s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN products p ON s.id = p.seller_id
    LEFT JOIN reviews r ON s.id = r.seller_id
    WHERE s.slug = $1
    GROUP BY s.id, s.slug, s.bio, s.gradient, s.location, s.specialty, s.member_since, u.first_name, u.last_name, u.avatar, u.email
  `;
  return await findOne(sql, [slug]);
};

const update = async (id, sellerData) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (sellerData.slug !== undefined) {
    fields.push(`slug = $${paramCount++}`);
    values.push(sellerData.slug);
  }
  if (sellerData.location !== undefined) {
    fields.push(`location = $${paramCount++}`);
    values.push(sellerData.location);
  }
  if (sellerData.specialty !== undefined) {
    fields.push(`specialty = $${paramCount++}`);
    values.push(sellerData.specialty);
  }
  if (sellerData.bio !== undefined) {
    fields.push(`bio = $${paramCount++}`);
    values.push(sellerData.bio);
  }
  if (sellerData.gradient !== undefined) {
    fields.push(`gradient = $${paramCount++}`);
    values.push(sellerData.gradient);
  }

  if (fields.length === 0) {
    return await findById(id);
  }

  values.push(id);
  const sql = `
    UPDATE sellers 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  return await updateOne(sql, values);
};

const findAll = async () => {
  const sql = `
    SELECT 
      s.*,
      u.first_name,
      u.last_name,
      u.avatar
    FROM sellers s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
  `;
  return await findMany(sql);
};

const findAllWithStats = async () => {
  const sql = 'SELECT * FROM seller_stats ORDER BY total_sales DESC';
  return await findMany(sql);
};

const findAllPublic = async () => {
  const sql = `
    SELECT 
      s.id,
      s.slug,
      u.first_name || ' ' || u.last_name AS name,
      u.avatar,
      s.location,
      s.specialty,
      s.member_since,
      s.gradient,
      COUNT(DISTINCT p.id) AS products_count,
      COALESCE(AVG(r.rating), 0) AS average_rating,
      COUNT(DISTINCT r.id) AS reviews_count,
      COALESCE(SUM(p.sales_count), 0) AS total_sales
    FROM sellers s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN products p ON s.id = p.seller_id
    LEFT JOIN reviews r ON s.id = r.seller_id
    GROUP BY s.id, s.slug, u.first_name, u.last_name, u.avatar, s.location, s.specialty, s.member_since, s.gradient
    ORDER BY s.created_at DESC
  `;

  return await findMany(sql);
};

const getStats = async (sellerId) => {
  const sql = `
    SELECT 
      COUNT(DISTINCT p.id) as products_count,
      COALESCE(AVG(r.rating), 0) as average_rating,
      COUNT(DISTINCT r.id) as reviews_count,
      COALESCE(SUM(p.sales_count), 0) as total_sales
    FROM sellers s
    LEFT JOIN products p ON s.id = p.seller_id
    LEFT JOIN reviews r ON s.id = r.seller_id
    WHERE s.id = $1
    GROUP BY s.id
  `;
  return await findOne(sql, [sellerId]);
};

const getTotalSales = async (sellerId) => {
  const sql = `
    SELECT COALESCE(SUM(p.sales_count), 0) AS total_sales
    FROM products p
    WHERE p.seller_id = $1
  `;
  return await findOne(sql, [sellerId]);
};

const slugExists = async (slug, excludeId = null) => {
  let sql = 'SELECT id FROM sellers WHERE slug = $1';
  const params = [slug];
  
  if (excludeId) {
    sql += ' AND id != $2';
    params.push(excludeId);
  }
  
  const result = await findOne(sql, params);
  return !!result;
};

module.exports = {
  create,
  findByUserId,
  findById,
  findBySlug,
  findBySlugWithStats,
  update,
  findAll,
  findAllWithStats,
  findAllPublic,
  getStats,
  getTotalSales,
  slugExists,
};
