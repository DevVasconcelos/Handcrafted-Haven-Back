const productService = require('../services/productService');

const productController = {
  async createProduct(req, res, next) {
    try {
      const sellerId = req.user.seller.id;
      const product = await productService.createProduct(sellerId, req.body);
      
      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllProducts(req, res, next) {
    try {
      const { 
        category, 
        seller, 
        minPrice, 
        maxPrice, 
        status, 
        handmade, 
        customizable,
        search,
        page = 1, 
        limit = 20, 
        sort = 'created_at', 
        order = 'DESC' 
      } = req.query;
      
      const filters = {};
      
      if (category) filters.categoryId = parseInt(category);
      if (seller) filters.sellerId = parseInt(seller);
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (status) filters.status = status;
      if (handmade !== undefined) filters.handmade = handmade === 'true';
      if (customizable !== undefined) filters.customizable = customizable === 'true';
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        order
      };
      
      let result;
      
      if (search) {
        result = await productService.searchProducts(search, filters, options);
      } else {
        result = await productService.getAllProducts(filters, options);
      }
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  },

  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(parseInt(id));
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  async getProductBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const product = await productService.getProductBySlug(slug);
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  async getProductsBySeller(req, res, next) {
    try {
      const { id } = req.params;
      const { status, page = 1, limit = 20 } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      };
      
      const result = await productService.getProductsBySellerId(parseInt(id), options);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  },

  async getProductsByCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const result = await productService.getProductsByCategoryId(parseInt(id), options);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const sellerId = req.user.seller.id;
      
      const product = await productService.updateProduct(parseInt(id), sellerId, req.body);
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const sellerId = req.user.seller.id;
      
      const result = await productService.deleteProduct(parseInt(id), sellerId);
      
      res.json({
        success: true,
        message: 'Produto deletado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  },

  async addImages(req, res, next) {
    try {
      const { id } = req.params;
      const sellerId = req.user.seller.id;
      
      const images = await productService.addImages(parseInt(id), sellerId, req.body.images);
      
      res.status(201).json({
        success: true,
        data: images
      });
    } catch (error) {
      next(error);
    }
  },

  async removeImage(req, res, next) {
    try {
      const { imageId } = req.params;
      const sellerId = req.user.seller.id;
      
      const result = await productService.removeImage(parseInt(imageId), sellerId);
      
      res.json({
        success: true,
        message: 'Imagem removida com sucesso'
      });
    } catch (error) {
      next(error);
    }
  },

  async setPrimaryImage(req, res, next) {
    try {
      const { imageId } = req.params;
      const sellerId = req.user.seller.id;
      
      const product = await productService.setPrimaryImage(parseInt(imageId), sellerId);
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStock(req, res, next) {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      const sellerId = req.user.seller.id;
      
      const product = await productService.updateStock(parseInt(id), sellerId, stock);
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyProducts(req, res, next) {
    try {
      const sellerId = req.user.seller.id;
      const { status, page = 1, limit = 20 } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      };
      
      const result = await productService.getProductsBySellerId(sellerId, options);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;
