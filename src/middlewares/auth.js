const jwt = require('jsonwebtoken');
const userRepository = require('../db/repositories/userRepository');
const sellerRepository = require('../db/repositories/sellerRepository');
const ApiError = require('../utils/ApiError');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Token não fornecido');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, 'Usuário não encontrado');
    }

    delete user.password;
    req.user = user;

    if (user.role === 'SELLER') {
      const seller = await sellerRepository.findByUserId(user.id);
      req.seller = seller;
      // Preserve seller info on user object for downstream handlers expecting req.user.seller
      req.user = { ...user, seller };
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Token inválido'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expirado'));
    }
    next(error);
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Autenticação necessária'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Acesso negado'));
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireRole,
};
