const { query, insertOne, findOne, findMany, updateOne } = require('../query');

const create = async (userData) => {
  const { firstName, lastName, email, password, role, avatar, newsletter } = userData;
  
  const sql = `
    INSERT INTO users (first_name, last_name, email, password, role, avatar, newsletter)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  return await insertOne(sql, [firstName, lastName, email, password, role, avatar, newsletter]);
};

const findByEmail = async (email) => {
  const sql = 'SELECT * FROM users WHERE email = $1';
  return await findOne(sql, [email]);
};

const findById = async (id) => {
  const sql = 'SELECT * FROM users WHERE id = $1';
  return await findOne(sql, [id]);
};

const update = async (id, userData) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (userData.firstName !== undefined) {
    fields.push(`first_name = $${paramCount++}`);
    values.push(userData.firstName);
  }
  if (userData.lastName !== undefined) {
    fields.push(`last_name = $${paramCount++}`);
    values.push(userData.lastName);
  }
  if (userData.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(userData.email);
  }
  if (userData.password !== undefined) {
    fields.push(`password = $${paramCount++}`);
    values.push(userData.password);
  }
  if (userData.avatar !== undefined) {
    fields.push(`avatar = $${paramCount++}`);
    values.push(userData.avatar);
  }
  if (userData.newsletter !== undefined) {
    fields.push(`newsletter = $${paramCount++}`);
    values.push(userData.newsletter);
  }

  if (fields.length === 0) {
    return await findById(id);
  }

  values.push(id);
  const sql = `
    UPDATE users 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  return await updateOne(sql, values);
};

const findAll = async () => {
  const sql = 'SELECT * FROM users ORDER BY created_at DESC';
  return await findMany(sql);
};

const findByRole = async (role) => {
  const sql = 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC';
  return await findMany(sql, [role]);
};

const deleteById = async (id) => {
  const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
  const result = await query(sql, [id]);
  return result.rowCount > 0;
};

module.exports = {
  create,
  findByEmail,
  findById,
  update,
  findAll,
  findByRole,
  deleteById,
};
