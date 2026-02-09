const uploadService = require('../services/uploadService');
const ApiError = require('../utils/ApiError');

const uploadController = {
  async uploadSingleImage(req, res, next) {
    try {
      if (!req.file) {
        throw new ApiError(400, 'Nenhum arquivo fornecido');
      }

      const folder = req.body.folder || 'products';
      const result = await uploadService.uploadImage(req.file, folder);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadMultipleImages(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        throw new ApiError(400, 'Nenhum arquivo fornecido');
      }

      const folder = req.body.folder || 'products';
      const results = await uploadService.uploadMultipleImages(req.files, folder);

      res.status(201).json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteImage(req, res, next) {
    try {
      const { pathname } = req.body;

      if (!pathname) {
        throw new ApiError(400, 'Pathname não fornecido');
      }

      const result = await uploadService.deleteImage(pathname);

      res.json({
        success: true,
        message: 'Imagem deletada com sucesso',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteMultipleImages(req, res, next) {
    try {
      const { pathnames } = req.body;

      if (!pathnames || !Array.isArray(pathnames) || pathnames.length === 0) {
        throw new ApiError(400, 'Pathnames não fornecidos ou inválidos');
      }

      const results = await uploadService.deleteMultipleImages(pathnames);

      res.json({
        success: true,
        message: 'Imagens processadas',
        data: results
      });
    } catch (error) {
      next(error);
    }
  },

  async listImages(req, res, next) {
    try {
      const { folder = 'products', limit = 100 } = req.query;

      const images = await uploadService.listImages(folder, parseInt(limit));

      res.json({
        success: true,
        data: images
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = uploadController;
