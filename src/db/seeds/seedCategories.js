const categoryRepository = require('../repositories/categoryRepository');
const { closePool } = require('../../config/database');

const categories = [
  {
    name: 'Pottery',
    slug: 'pottery',
    description: 'Handcrafted ceramic pieces including vases, bowls, plates, and decorative items',
    icon: '🏺',
    gradient: 'from-[#C2412D] to-[#D85C46]',
  },
  {
    name: 'Jewelry',
    slug: 'jewelry',
    description: 'Unique necklaces, earrings, bracelets, and rings crafted from precious materials',
    icon: '💍',
    gradient: 'from-[#D6A11E] to-[#E6B84E]',
  },
  {
    name: 'Textiles',
    slug: 'textiles',
    description: 'Woven blankets, scarves, rugs, and fabric art made with traditional techniques',
    icon: '🧶',
    gradient: 'from-[#355C7D] to-[#4A7BA7]',
  },
  {
    name: 'Woodwork',
    slug: 'woodwork',
    description: 'Carved furniture, cutting boards, bowls, and decorative wooden pieces',
    icon: '🪵',
    gradient: 'from-[#5A6B2F] to-[#7A8B4F]',
  },
  {
    name: 'Art & Prints',
    slug: 'art-prints',
    description: 'Original paintings, illustrations, prints, and mixed media artwork',
    icon: '🎨',
    gradient: 'from-[#C2412D] to-[#D85C46]',
  },
  {
    name: 'Candles & Soaps',
    slug: 'candles-soaps',
    description: 'Handmade natural candles and artisanal soaps with unique scents',
    icon: '🕯️',
    gradient: 'from-[#B57F50] to-[#D4A574]',
  },
];

const seedCategories = async () => {
  try {
    console.log('Iniciando seed de categorias...\n');

    for (const categoryData of categories) {
      const exists = await categoryRepository.slugExists(categoryData.slug);
      
      if (exists) {
        console.log(`Categoria "${categoryData.name}" já existe, pulando...`);
        continue;
      }

      const category = await categoryRepository.create(categoryData);
      console.log(`Categoria "${category.name}" criada com ID ${category.id}`);
    }

    console.log('\nSeed de categorias concluído!\n');
  } catch (error) {
    console.error('Erro ao fazer seed de categorias:', error.message);
    console.error(error.stack);
  } finally {
    await closePool();
    console.log('Conexão com banco fechada');
  }
};

if (require.main === module) {
  seedCategories();
}

module.exports = seedCategories;
