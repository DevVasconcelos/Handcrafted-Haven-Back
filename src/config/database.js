const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('Nova conexão estabelecida com o banco de dados');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Conexão com PostgreSQL estabelecida:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error.message);
    throw error;
  }
};

const closePool = async () => {
  try {
    await pool.end();
    console.log('Pool de conexões encerrado');
  } catch (error) {
    console.error('Erro ao encerrar pool:', error);
  }
};

module.exports = {
  pool,
  testConnection,
  closePool,
};
