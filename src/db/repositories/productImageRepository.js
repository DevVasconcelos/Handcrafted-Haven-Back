const { query, transaction, findOne, findMany, insertOne, updateOne, deleteOne } = require('../query');

const productImageRepository = {
  async create(imageData) {
    const columns = Object.keys(imageData);
    const values = Object.values(imageData);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    
    const sql = `
      INSERT INTO product_images (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    const result = await insertOne(sql, values);
    return result;
  },

  async createMany(imagesData, externalClient = null) {
    if (!imagesData || imagesData.length === 0) {
      return [];
    }

    // Permite usar um client já aberto (transação externa) ou criar uma nova transação
    if (externalClient) {
      const insertedImages = [];
      for (const imageData of imagesData) {
        const columns = Object.keys(imageData);
        const values = Object.values(imageData);
        const placeholders = columns.map((_, i) => `$${i + 1}`);

        const sql = `
          INSERT INTO product_images (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;

        const result = await externalClient.query(sql, values);
        insertedImages.push(result.rows[0]);
      }
      return insertedImages;
    }

    return transaction(async (client) => {
      const insertedImages = [];

      for (const imageData of imagesData) {
        const columns = Object.keys(imageData);
        const values = Object.values(imageData);
        const placeholders = columns.map((_, i) => `$${i + 1}`);

        const sql = `
          INSERT INTO product_images (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;

        const result = await client.query(sql, values);
        insertedImages.push(result.rows[0]);
      }

      return insertedImages;
    });
  },

  async findById(id) {
    const sql = 'SELECT * FROM product_images WHERE id = $1';
    return findOne(sql, [id]);
  },

  async findByProductId(productId) {
    const sql = `
      SELECT * FROM product_images 
      WHERE product_id = $1 
      ORDER BY is_primary DESC, display_order ASC, created_at ASC
    `;
    const result = await query(sql, [productId]);
    return result.rows;
  },

  async findPrimaryByProductId(productId) {
    const sql = 'SELECT * FROM product_images WHERE product_id = $1 AND is_primary = true';
    return findOne(sql, [productId]);
  },

  async setPrimary(id, productId) {
    return transaction(async (client) => {
      await client.query(
        'UPDATE product_images SET is_primary = false WHERE product_id = $1',
        [productId]
      );

      const result = await client.query(
        'UPDATE product_images SET is_primary = true WHERE id = $1 RETURNING *',
        [id]
      );

      return result.rows[0] || null;
    });
  },

  async updateDisplayOrder(id, displayOrder) {
    const sql = 'UPDATE product_images SET display_order = $1 WHERE id = $2 RETURNING *';
    return updateOne(sql, [displayOrder, id]);
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
      UPDATE product_images 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    return await updateOne(sql, values);
  },

  async deleteById(id) {
    const sql = 'DELETE FROM product_images WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  },

  async deleteByProductId(productId) {
    const sql = 'DELETE FROM product_images WHERE product_id = $1 RETURNING *';
    const result = await query(sql, [productId]);
    return result.rows;
  },

  async countByProductId(productId) {
    const sql = 'SELECT COUNT(*) FROM product_images WHERE product_id = $1';
    const result = await query(sql, [productId]);
    return parseInt(result.rows[0].count);
  }
};

module.exports = productImageRepository;
