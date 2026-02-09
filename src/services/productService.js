const productRepository = require('../db/repositories/productRepository');
const productImageRepository = require('../db/repositories/productImageRepository');
const sellerRepository = require('../db/repositories/sellerRepository');
const categoryRepository = require('../db/repositories/categoryRepository');
const { transaction } = require('../db/query');
const ApiError = require('../utils/ApiError');

const productService = {
  async generateSlug(title, excludeId = null) {
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (await productRepository.slugExists(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  },

  async createProduct(sellerId, productData) {
    const category = await categoryRepository.findById(productData.category_id);
    if (!category) {
      throw new ApiError(404, 'Categoria não encontrada');
    }

    const slug = await this.generateSlug(productData.title);
    
    const { images, ...productFields } = productData;

    const productId = await transaction(async (client) => {
      const productInsertData = {
        seller_id: sellerId,
        ...productFields,
        slug
      };

      const insertColumns = Object.keys(productInsertData);
      const insertValues = Object.values(productInsertData);
      const insertPlaceholders = insertColumns.map((_, i) => `$${i + 1}`);

      const insertSql = `
        INSERT INTO products (${insertColumns.join(', ')})
        VALUES (${insertPlaceholders.join(', ')})
        RETURNING *
      `;

      const productResult = await client.query(insertSql, insertValues);
      const product = productResult.rows[0];

      if (images && images.length > 0) {
        const hasExplicitPrimary = images.some(img => img.is_primary);

        for (let i = 0; i < images.length; i++) {
          const imageData = {
            product_id: product.id,
            url: images[i].url,
            is_primary: hasExplicitPrimary ? images[i].is_primary : (i === 0),
            display_order: images[i].display_order || i
          };

          const imageColumns = Object.keys(imageData);
          const imageValues = Object.values(imageData);
          const imagePlaceholders = imageColumns.map((_, idx) => `$${idx + 1}`);

          const imageSql = `
            INSERT INTO product_images (${imageColumns.join(', ')})
            VALUES (${imagePlaceholders.join(', ')})
          `;

          await client.query(imageSql, imageValues);
        }
      }

      return product.id;
    });

    // Busca fora da transação para garantir visibilidade após COMMIT
    return this.getProductById(productId);
  },

  async getAllProducts(filters = {}, options = {}) {
    const result = await productRepository.findWithFilters(filters, options);
    
    for (const product of result.data) {
      product.images = await productImageRepository.findByProductId(product.id);
    }
    
    return result;
  },

  async getProductById(id) {
    const product = await productRepository.findByIdFull(id);
    
    if (!product) {
      throw new ApiError(404, 'Produto não encontrado');
    }
    
    product.images = await productImageRepository.findByProductId(product.id);

    // Ensure seller_total_sales reflects the sum of this seller's product sales
    const sellerSales = await sellerRepository.getTotalSales(product.seller_id);
    if (sellerSales && sellerSales.total_sales !== undefined) {
      product.seller_total_sales = Number(sellerSales.total_sales) || 0;
    }
    
    return product;
  },

  async getProductBySlug(slug) {
    const product = await productRepository.findBySlugFull(slug);
    
    if (!product) {
      throw new ApiError(404, 'Produto não encontrado');
    }
    
    product.images = await productImageRepository.findByProductId(product.id);
    
    return product;
  },

  async getProductsBySellerId(sellerId, options = {}) {
    const result = await productRepository.findBySellerIdFull(sellerId, options);
    
    for (const product of result.data) {
      product.images = await productImageRepository.findByProductId(product.id);
    }
    
    return result;
  },

  async getProductsByCategoryId(categoryId, options = {}) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new ApiError(404, 'Categoria não encontrada');
    }
    
    const result = await productRepository.findByCategoryIdFull(categoryId, options);
    
    for (const product of result.data) {
      product.images = await productImageRepository.findByProductId(product.id);
    }
    
    return result;
  },

  async searchProducts(searchTerm, filters = {}, options = {}) {
    const result = await productRepository.search(searchTerm, filters, options);
    
    for (const product of result.data) {
      product.images = await productImageRepository.findByProductId(product.id);
    }
    
    return result;
  },

  async updateProduct(id, sellerId, updates) {
    const product = await productRepository.findById(id);
    
    if (!product) {
      throw new ApiError(404, 'Produto não encontrado');
    }
    
    if (product.seller_id !== sellerId) {
      throw new ApiError(403, 'Você não tem permissão para editar este produto');
    }
    
    if (updates.category_id) {
      const category = await categoryRepository.findById(updates.category_id);
      if (!category) {
        throw new ApiError(404, 'Categoria não encontrada');
      }
    }
    
    if (updates.title && updates.title !== product.title) {
      updates.slug = await this.generateSlug(updates.title, id);
    }
    
    const updatedProduct = await productRepository.update(id, updates);
    return this.getProductById(id);
  },

  async deleteProduct(id, sellerId) {
    const product = await productRepository.findById(id);
    
    if (!product) {
      throw new ApiError(404, 'Produto não encontrado');
    }
    
    if (product.seller_id !== sellerId) {
      throw new ApiError(403, 'Você não tem permissão para deletar este produto');
    }
    
    const images = await productImageRepository.findByProductId(id);
    
    await productRepository.deleteById(id);
    
    return { deleted: true, images };
  },

  async addImages(productId, sellerId, images) {
    const product = await productRepository.findById(productId);
    
    if (!product) {
      throw new ApiError(404, 'Produto não encontrado');
    }
    
    if (product.seller_id !== sellerId) {
      throw new ApiError(403, 'Você não tem permissão para adicionar imagens a este produto');
    }
    
    const currentImages = await productImageRepository.findByProductId(productId);
    const totalImages = currentImages.length + images.length;
    
    if (totalImages > 10) {
      throw new ApiError(400, 'Um produto pode ter no máximo 10 imagens');
    }
    
    const hasExistingPrimary = currentImages.some(img => img.is_primary);
    const hasNewPrimary = images.some(img => img.is_primary);
    
    if (hasExistingPrimary && hasNewPrimary) {
      throw new ApiError(400, 'Este produto já possui uma imagem primária');
    }
    
    const imagesData = images.map((img, index) => ({
      product_id: productId,
      url: img.url,
      is_primary: hasExistingPrimary ? false : (hasNewPrimary ? img.is_primary : (index === 0 && currentImages.length === 0)),
      display_order: img.display_order || (currentImages.length + index)
    }));
    
    const insertedImages = await productImageRepository.createMany(imagesData);
    
    return insertedImages;
  },

  async removeImage(imageId, sellerId) {
    const image = await productImageRepository.findById(imageId);
    
    if (!image) {
      throw new ApiError(404, 'Imagem não encontrada');
    }
    
    const product = await productRepository.findById(image.product_id);
    
    if (product.seller_id !== sellerId) {
      throw new ApiError(403, 'Você não tem permissão para remover esta imagem');
    }
    
    const images = await productImageRepository.findByProductId(image.product_id);
    
    if (images.length === 1) {
      throw new ApiError(400, 'Um produto deve ter pelo menos uma imagem');
    }
    
    await productImageRepository.deleteById(imageId);
    
    if (image.is_primary) {
      const remainingImages = await productImageRepository.findByProductId(image.product_id);
      if (remainingImages.length > 0) {
        await productImageRepository.setPrimary(remainingImages[0].id, image.product_id);
      }
    }
    
    return { deleted: true, image };
  },

  async setPrimaryImage(imageId, sellerId) {
    const image = await productImageRepository.findById(imageId);
    
    if (!image) {
      throw new ApiError(404, 'Imagem não encontrada');
    }
    
    const product = await productRepository.findById(image.product_id);
    
    if (product.seller_id !== sellerId) {
      throw new ApiError(403, 'Você não tem permissão para modificar as imagens deste produto');
    }
    
    await productImageRepository.setPrimary(imageId, image.product_id);
    
    return this.getProductById(product.id);
  },

  async updateStock(id, sellerId, stock) {
    const product = await productRepository.findById(id);
    
    if (!product) {
      throw new ApiError(404, 'Produto não encontrado');
    }
    
    if (product.seller_id !== sellerId) {
      throw new ApiError(403, 'Você não tem permissão para atualizar o estoque deste produto');
    }
    
    await productRepository.updateStock(id, stock);
    return this.getProductById(id);
  }
};

module.exports = productService;
