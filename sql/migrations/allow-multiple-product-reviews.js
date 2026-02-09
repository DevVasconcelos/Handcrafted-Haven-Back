require('dotenv').config();
const { query } = require('../../src/db/query');

async function allowMultipleProductReviews() {
  try {
    console.log('Ajustando constraints de reviews para permitir múltiplos produtos do mesmo vendedor...');

    // Remove a constraint antiga (reviewer + seller)
    await query('ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_seller_id_key');

    // Garante unicidade por produto
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_reviewer_product
      ON reviews(reviewer_id, product_id)
      WHERE product_id IS NOT NULL
    `);

    // Mantém unicidade para avaliações diretas do vendedor (sem produto)
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_reviewer_seller_when_no_product
      ON reviews(reviewer_id, seller_id)
      WHERE product_id IS NULL
    `);

    console.log('Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

allowMultipleProductReviews();
