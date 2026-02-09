const { pool } = require('../config/database');

const query = async (text, params = []) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Query executada:', {
        text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }
    
    return result;
  } catch (error) {
    console.error('Erro na query:', {
      text,
      params,
      error: error.message,
    });
    throw error;
  }
};

const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Transaction commitada com sucesso');
    }
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction revertida:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

const findOne = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows.length > 0 ? result.rows[0] : null;
};

const findMany = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows;
};

const findWithPagination = async (text, params = [], page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  
  const countQuery = text.replace(/SELECT .+ FROM/i, 'SELECT COUNT(*) FROM');
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);
  
  const paginatedQuery = `${text} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const result = await query(paginatedQuery, [...params, limit, offset]);
  
  return {
    data: result.rows,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const insertOne = async (text, params = []) => {
  const queryWithReturning = text.includes('RETURNING') 
    ? text 
    : `${text} RETURNING *`;
  
  const result = await query(queryWithReturning, params);
  return result.rows[0];
};

const updateOne = async (text, params = []) => {
  const queryWithReturning = text.includes('RETURNING') 
    ? text 
    : `${text} RETURNING *`;
  
  const result = await query(queryWithReturning, params);
  return result.rows.length > 0 ? result.rows[0] : null;
};

const deleteOne = async (text, params = []) => {
  const result = await query(text, params);
  return result.rowCount > 0;
};

module.exports = {
  query,
  transaction,
  findOne,
  findMany,
  findWithPagination,
  insertOne,
  updateOne,
  deleteOne,
};
