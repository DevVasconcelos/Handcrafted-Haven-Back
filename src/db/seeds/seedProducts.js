require('dotenv').config();
const { query } = require('../query');
const productRepository = require('../repositories/productRepository');
const productImageRepository = require('../repositories/productImageRepository');
const sellerRepository = require('../repositories/sellerRepository');
const categoryRepository = require('../repositories/categoryRepository');

const sampleProducts = [
  {
    title: 'Handmade Ceramic Vase',
    description: 'Beautiful handcrafted ceramic vase with unique glaze patterns. Perfect for home decoration or as a gift. Each piece is one-of-a-kind.',
    price: 45.99,
    compare_price: 65.00,
    stock: 15,
    sku: 'VAZ-001',
    category: 'Pottery',
    tags: 'ceramic, vase, home decor, handmade',
    materials: 'Ceramic, Glaze',
    dimensions: '20cm x 10cm',
    weight: '800g',
    color: 'Blue and White',
    shipping_time: '3-5 business days',
    handmade: true,
    customizable: false,
    gift_wrapping: true,
    images: [
      'https://images.unsplash.com/photo-1578500494198-246f612d3b3d',
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa'
    ]
  },
  {
    title: 'Silver Moon Necklace',
    description: 'Elegant sterling silver necklace featuring a crescent moon pendant. Handcrafted with attention to detail and finished with a polished shine.',
    price: 89.99,
    stock: 25,
    sku: 'JWL-002',
    category: 'Jewelry',
    tags: 'jewelry, necklace, silver, moon, pendant',
    materials: 'Sterling Silver',
    dimensions: '50cm chain',
    weight: '15g',
    color: 'Silver',
    shipping_time: '2-4 business days',
    handmade: true,
    customizable: true,
    gift_wrapping: true,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f'
    ]
  },
  {
    title: 'Woven Cotton Blanket',
    description: 'Cozy handwoven cotton blanket in traditional patterns. Made from 100% organic cotton, perfect for all seasons. Soft and durable.',
    price: 125.00,
    compare_price: 175.00,
    stock: 8,
    sku: 'TXT-003',
    category: 'Textiles',
    tags: 'blanket, cotton, woven, organic, home',
    materials: 'Organic Cotton',
    dimensions: '180cm x 200cm',
    weight: '1.2kg',
    color: 'Beige and Brown',
    shipping_time: '5-7 business days',
    handmade: true,
    customizable: false,
    gift_wrapping: true,
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2',
      'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20'
    ]
  },
  {
    title: 'Wooden Cutting Board',
    description: 'Premium quality cutting board made from sustainable hardwood. Features a smooth finish and natural wood grain. Ideal for kitchen use or as a serving board.',
    price: 55.00,
    stock: 20,
    sku: 'WOD-004',
    category: 'Woodwork',
    tags: 'cutting board, wood, kitchen, sustainable',
    materials: 'Oak Wood',
    dimensions: '40cm x 25cm x 2cm',
    weight: '1.5kg',
    color: 'Natural Wood',
    shipping_time: '3-5 business days',
    handmade: true,
    customizable: true,
    gift_wrapping: false,
    images: [
      'https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e',
      'https://images.unsplash.com/photo-1600857544200-6a8e9cd23a85'
    ]
  },
  {
    title: 'Abstract Watercolor Print',
    description: 'Modern abstract art print featuring vibrant watercolor techniques. Printed on high-quality archival paper. Available in multiple sizes.',
    price: 35.00,
    stock: 50,
    sku: 'ART-005',
    category: 'Art & Prints',
    tags: 'art, print, watercolor, abstract, wall art',
    materials: 'Archival Paper, Ink',
    dimensions: '30cm x 40cm',
    weight: '100g',
    color: 'Multicolor',
    shipping_time: '2-3 business days',
    handmade: true,
    customizable: true,
    gift_wrapping: true,
    images: [
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
      'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8'
    ]
  },
  {
    title: 'Lavender Soy Candle',
    description: 'Hand-poured soy candle with natural lavender essential oil. Burns cleanly for 40+ hours. Comes in a reusable glass jar.',
    price: 28.00,
    stock: 40,
    sku: 'CND-006',
    category: 'Candles & Soaps',
    tags: 'candle, soy, lavender, aromatherapy, natural',
    materials: 'Soy Wax, Essential Oil, Cotton Wick',
    dimensions: '8cm x 8cm',
    weight: '250g',
    color: 'Purple',
    shipping_time: '2-4 business days',
    handmade: true,
    customizable: false,
    gift_wrapping: true,
    images: [
      'https://images.unsplash.com/photo-1602874801006-95415c52c0e8',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108'
    ]
  }
];

async function seedProducts() {
  try {
    console.log('Iniciando seed de produtos...');
    
    const sellers = await query('SELECT * FROM sellers ORDER BY id LIMIT 1');
    if (sellers.rows.length === 0) {
      console.error('Nenhum vendedor encontrado. Execute o seed de autenticação primeiro.');
      process.exit(1);
    }
    
    const sellerId = sellers.rows[0].id;
    console.log(`Usando vendedor ID: ${sellerId}`);
    
    const categories = await categoryRepository.findAll();
    if (categories.length === 0) {
      console.error('Nenhuma categoria encontrada. Execute o seed de categorias primeiro.');
      process.exit(1);
    }
    
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    await query('DELETE FROM product_images');
    await query('DELETE FROM products');
    console.log('Produtos e imagens existentes removidos.');
    
    for (const productData of sampleProducts) {
      const { images, category, ...productFields } = productData;
      
      const categoryId = categoryMap[category];
      if (!categoryId) {
        console.log(`Categoria ${category} não encontrada. Pulando...`);
        continue;
      }
      
      const slug = productFields.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const product = await productRepository.create({
        seller_id: sellerId,
        category_id: categoryId,
        ...productFields,
        slug
      });
      
      console.log(`Produto criado: ${product.title} (ID: ${product.id})`);
      
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await productImageRepository.create({
            product_id: product.id,
            url: images[i],
            is_primary: i === 0,
            display_order: i
          });
        }
        console.log(`  ${images.length} imagens adicionadas`);
      }
    }
    
    const totalProducts = await productRepository.countAll();
    console.log(`\nSeed concluído! Total de produtos: ${totalProducts}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro no seed:', error);
    process.exit(1);
  }
}

seedProducts();
