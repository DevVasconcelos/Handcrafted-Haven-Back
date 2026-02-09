const express = require('express');
const userRepository = require('../db/repositories/userRepository');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('SELLER'), async (req, res, next) => {
  try {
    const users = await userRepository.findAll();
    res.json({
      success: true,
      data: users.map(user => {
        delete user.password;
        return user;
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/buyers', authenticate, requireRole('SELLER'), async (req, res, next) => {
  try {
    const buyers = await userRepository.findByRole('BUYER');
    res.json({
      success: true,
      data: buyers.map(user => {
        delete user.password;
        return user;
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/sellers', authenticate, async (req, res, next) => {
  try {
    const sellers = await userRepository.findByRole('SELLER');
    res.json({
      success: true,
      data: sellers.map(user => {
        delete user.password;
        return user;
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await userRepository.findById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }
    delete user.password;
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
