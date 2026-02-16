const categoryRepository = require('../db/repositories/categoryRepository');
const ApiError = require('../utils/ApiError');

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const createCategory = async (categoryData) => {
  const { name, slug, description, icon, gradient } = categoryData;

  const finalSlug = slug || generateSlug(name);

  const slugExists = await categoryRepository.slugExists(finalSlug);
  if (slugExists) {
    throw new ApiError(409, 'Slug is already in use');
  }

  const category = await categoryRepository.create({
    name,
    slug: finalSlug,
    description,
    icon,
    gradient,
  });

  return category;
};

const getAllCategories = async (includeCount = false) => {
  if (includeCount) {
    return await categoryRepository.findWithProductCount();
  }
  return await categoryRepository.findAll();
};

const getCategoryById = async (id) => {
  const category = await categoryRepository.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

const getCategoryBySlug = async (slug) => {
  const category = await categoryRepository.findBySlug(slug);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

const updateCategory = async (id, categoryData) => {
  const existingCategory = await categoryRepository.findById(id);
  if (!existingCategory) {
    throw new ApiError(404, 'Category not found');
  }

  if (categoryData.slug) {
    const slugExists = await categoryRepository.slugExists(categoryData.slug, id);
    if (slugExists) {
      throw new ApiError(409, 'Slug is already in use');
    }
  }

  const category = await categoryRepository.update(id, categoryData);
  return category;
};

const deleteCategory = async (id) => {
  const category = await categoryRepository.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const deleted = await categoryRepository.deleteById(id);
  return deleted;
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  generateSlug,
};
