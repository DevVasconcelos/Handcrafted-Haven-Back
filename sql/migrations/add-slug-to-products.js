require('dotenv').config();
const { query } = require('../../src/db/query');

async function addSlugToProducts() {
  try {
    console.log('Adicionando coluna slug à tabela products...');
    
    await query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(300) UNIQUE
    `);
    
    console.log('Criando índice para slug...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)
    `);
    
    console.log('Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

addSlugToProducts();
