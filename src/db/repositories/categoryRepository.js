const { query, insertOne, findOne, findMany, updateOne, deleteOne } = require('../query');

const create = async (categoryData) => {
  const { name, slug, description, icon, gradient } = categoryData;
  
  const sql = `
    INSERT INTO categories (name, slug, description, icon, gradient)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  return await insertOne(sql, [name, slug, description, icon, gradient]);
};

const findById = async (id) => {
  const sql = 'SELECT * FROM categories WHERE id = $1';
  return await findOne(sql, [id]);
};

const findBySlug = async (slug) => {
  const sql = 'SELECT * FROM categories WHERE slug = $1';
  return await findOne(sql, [slug]);
};

const findAll = async () => {
  const sql = 'SELECT * FROM categories ORDER BY name ASC';
  return await findMany(sql);
};

const findWithProductCount = async () => {
  const sql = `
    SELECT 
      c.*,
      COUNT(DISTINCT p.id) as products_count,
      COUNT(DISTINCT p.seller_id) as artisans_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.status = 'ACTIVE'
    GROUP BY c.id
    ORDER BY c.name ASC
  `;
  return await findMany(sql);
};

const update = async (id, categoryData) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (categoryData.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(categoryData.name);
  }
  if (categoryData.slug !== undefined) {
    fields.push(`slug = $${paramCount++}`);
    values.push(categoryData.slug);
  }
  if (categoryData.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(categoryData.description);
  }
  if (categoryData.icon !== undefined) {
    fields.push(`icon = $${paramCount++}`);
    values.push(categoryData.icon);
  }
  if (categoryData.gradient !== undefined) {
    fields.push(`gradient = $${paramCount++}`);
    values.push(categoryData.gradient);
  }

  if (fields.length === 0) {
    return await findById(id);
  }

  values.push(id);
  const sql = `
    UPDATE categories 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  return await updateOne(sql, values);
};

const deleteById = async (id) => {
  const sql = 'DELETE FROM categories WHERE id = $1 RETURNING id';
  const result = await deleteOne(sql, [id]);
  return !!result;
};

const slugExists = async (slug, excludeId = null) => {
  let sql = 'SELECT id FROM categories WHERE slug = $1';
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
  findById,
  findBySlug,
  findAll,
  findWithProductCount,
  update,
  deleteById,
  slugExists,
};
