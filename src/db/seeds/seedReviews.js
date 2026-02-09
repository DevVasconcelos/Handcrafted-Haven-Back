require('dotenv').config();
const { query } = require('../query');
const reviewRepository = require('../repositories/reviewRepository');

const sampleReviews = [
  {
    seller_id: 1,
    product_id: 1,
    rating: 5,
    text: 'Produto incrível! A qualidade da cerâmica é excepcional e o acabamento é perfeito. Recomendo muito!'
  },
  {
    seller_id: 1,
    product_id: 2,
    rating: 4,
    text: 'Colar muito bonito e bem feito. A prata é de ótima qualidade. Único detalhe é que demorou um pouco para chegar.'
  },
  {
    seller_id: 1,
    product_id: 3,
    rating: 5,
    text: 'Manta maravilhosa! Super macia e quentinha. O algodão orgânico faz toda diferença. Adorei!'
  },
  {
    seller_id: 1,
    rating: 5,
    text: 'Vendedor muito atencioso e produtos de excelente qualidade. Já fiz várias compras e sempre me surpreendo!'
  }
];

async function seedReviews() {
  try {
    console.log('Iniciando seed de reviews...');
    
    const users = await query('SELECT * FROM users WHERE role = $1 ORDER BY id LIMIT 3', ['BUYER']);
    if (users.rows.length === 0) {
      console.error('Nenhum usuário BUYER encontrado.');
      console.log('Criando usuários BUYER de teste...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('senha123', 10);
      
      const buyers = [
        { email: 'maria@email.com', firstName: 'Maria', lastName: 'Santos' },
        { email: 'carlos@email.com', firstName: 'Carlos', lastName: 'Oliveira' },
        { email: 'ana@email.com', firstName: 'Ana', lastName: 'Costa' }
      ];
      
      for (const buyer of buyers) {
        await query(
          `INSERT INTO users (first_name, last_name, email, password, role, avatar)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [buyer.firstName, buyer.lastName, buyer.email, hashedPassword, 'BUYER', `https://i.pravatar.cc/150?u=${buyer.email}`]
        );
      }
      
      const newUsers = await query('SELECT * FROM users WHERE role = $1 ORDER BY id LIMIT 3', ['BUYER']);
      console.log(`${newUsers.rows.length} usuários BUYER criados.`);
    }
    
    const buyers = await query('SELECT * FROM users WHERE role = $1 ORDER BY id LIMIT 4', ['BUYER']);
    
    const sellers = await query('SELECT * FROM sellers ORDER BY id LIMIT 1');
    if (sellers.rows.length === 0) {
      console.error('Nenhum vendedor encontrado. Execute o seed de autenticação primeiro.');
      process.exit(1);
    }
    
    await query('DELETE FROM reviews');
    console.log('Reviews existentes removidos.');
    
    for (let i = 0; i < sampleReviews.length && i < buyers.rows.length; i++) {
      const reviewData = {
        reviewer_id: buyers.rows[i].id,
        ...sampleReviews[i]
      };
      
      const review = await reviewRepository.create(reviewData);
      console.log(`Review criado: ID ${review.id} - Rating ${review.rating}/5`);
      
      if (reviewData.product_id) {
        const { reviewCount, averageRating } = await reviewRepository.getProductRating(reviewData.product_id);
        await query(
          'UPDATE products SET rating = $1, review_count = $2 WHERE id = $3',
          [Math.round(averageRating * 100) / 100, reviewCount, reviewData.product_id]
        );
        console.log(`  Produto ${reviewData.product_id} atualizado: ${reviewCount} reviews, média ${averageRating.toFixed(2)}`);
      }
    }
    
    const totalReviews = await query('SELECT COUNT(*) FROM reviews');
    console.log(`\nSeed concluído! Total de reviews: ${totalReviews.rows[0].count}`);
    
    const sellerStats = await reviewRepository.getSellerRating(1);
    console.log(`Estatísticas do vendedor:`);
    console.log(`  Total de reviews: ${sellerStats.reviewCount}`);
    console.log(`  Média geral: ${sellerStats.averageRating.toFixed(2)}/5`);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro no seed:', error);
    process.exit(1);
  }
}

seedReviews();
