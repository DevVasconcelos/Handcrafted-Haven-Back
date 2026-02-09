const express = require('express');
const sellerRepository = require('../db/repositories/sellerRepository');

const router = express.Router();

// Public: list all sellers with basic stats
router.get('/', async (req, res, next) => {
  try {
    const sellers = await sellerRepository.findAllPublic();
    res.json({ success: true, data: sellers });
  } catch (error) {
    next(error);
  }
});

// Public: get seller by slug (includes stats when available)
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const seller = await sellerRepository.findBySlugWithStats(slug) || await sellerRepository.findBySlug(slug);

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    res.json({ success: true, data: seller });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
