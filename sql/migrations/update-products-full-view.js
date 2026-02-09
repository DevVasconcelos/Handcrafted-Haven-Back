require('dotenv').config();
const { query } = require('../../src/db/query');

async function updateProductsFullView() {
  try {
    console.log('Recriando view products_full...');
    
    await query('DROP VIEW IF EXISTS products_full CASCADE');
    
    await query(`
      CREATE VIEW products_full AS
      SELECT 
        p.*,
        s.slug as seller_slug,
        u.first_name || ' ' || u.last_name as seller_name,
        u.avatar as seller_avatar,
        s.location as seller_location,
        s.specialty as seller_specialty,
        COALESCE(ss.products_count, 0) as seller_products_count,
        COALESCE(ss.total_sales, 0) as seller_total_sales,
        COALESCE(ss.average_rating, 0) as seller_average_rating,
        COALESCE(ss.reviews_count, 0) as seller_reviews_count,
        c.name as category_name,
        c.slug as category_slug,
        c.icon as category_icon,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
      FROM products p
      JOIN sellers s ON p.seller_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN seller_stats ss ON ss.id = s.id
    `);
    
    console.log('View recriada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao recriar view:', error);
    process.exit(1);
  }
}

updateProductsFullView();
