const { put, del, list } = require('@vercel/blob');
const crypto = require('crypto');
const path = require('path');
const ApiError = require('../utils/ApiError');

const uploadService = {
  async uploadImage(file, folder = 'products') {
    if (!file) {
      throw new ApiError(400, 'No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ApiError(400, 'Unsupported file type. Use JPEG, PNG, WEBP, or GIF');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ApiError(400, 'File too large. Max size: 5MB');
    }

    const fileExtension = path.extname(file.originalname);
    const randomName = crypto.randomBytes(16).toString('hex');
    const fileName = `${folder}/${randomName}${fileExtension}`;

    try {
      const blob = await put(fileName, file.buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      throw new ApiError(500, `Upload failed: ${error.message}`);
    }
  },

  async uploadMultipleImages(files, folder = 'products') {
    if (!files || files.length === 0) {
      throw new ApiError(400, 'No file provided');
    }

    const maxFiles = 10;
    if (files.length > maxFiles) {
      throw new ApiError(400, `Maximum of ${maxFiles} files per upload`);
    }

    const uploadPromises = files.map(file => this.uploadImage(file, folder));
    
    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      throw error;
    }
  },

  async deleteImage(pathname) {
    if (!pathname) {
      throw new ApiError(400, 'Pathname not provided');
    }

    try {
      await del(pathname, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return { deleted: true, pathname };
    } catch (error) {
      throw new ApiError(500, `Failed to delete image: ${error.message}`);
    }
  },

  async deleteMultipleImages(pathnames) {
    if (!pathnames || pathnames.length === 0) {
      return [];
    }

    const deletePromises = pathnames.map(pathname => 
      this.deleteImage(pathname).catch(error => ({ error: error.message, pathname }))
    );

    const results = await Promise.all(deletePromises);
    return results;
  },

  async listImages(folder = 'products', limit = 100) {
    try {
      const { blobs } = await list({
        token: process.env.BLOB_READ_WRITE_TOKEN,
        prefix: folder,
        limit,
      });

      return blobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      }));
    } catch (error) {
      throw new ApiError(500, `Failed to list images: ${error.message}`);
    }
  },

  extractPathnameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch (error) {
      throw new ApiError(400, 'Invalid URL');
    }
  },

  validateImageData(imageData) {
    if (!imageData.url) {
      throw new ApiError(400, 'Image URL is required');
    }

    if (!imageData.url.startsWith('https://')) {
      throw new ApiError(400, 'Image URL must use HTTPS');
    }

    return true;
  }
};

module.exports = uploadService;
