const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../db/repositories/userRepository');
const sellerRepository = require('../db/repositories/sellerRepository');
const { transaction } = require('../db/query');
const ApiError = require('../utils/ApiError');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

const generateAvatar = (firstName, lastName) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return `https://ui-avatars.com/api/?name=${initials}&background=random&size=200`;
};

const generateSlug = (firstName, lastName) => {
  const baseSlug = `${firstName}-${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return baseSlug;
};

const generateUniqueSlug = async (firstName, lastName) => {
  const baseSlug = generateSlug(firstName, lastName);
  let slug = baseSlug;
  let counter = 1;

  while (await sellerRepository.slugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

const register = async (userData) => {
  const { firstName, lastName, email, password, role = 'BUYER', newsletter = false } = userData;

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new ApiError(409, 'Email já está em uso');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const avatar = generateAvatar(firstName, lastName);

  if (role === 'SELLER') {
    return await transaction(async (client) => {
      const userQuery = `
        INSERT INTO users (first_name, last_name, email, password, role, avatar, newsletter)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const userResult = await client.query(userQuery, [
        firstName,
        lastName,
        email,
        hashedPassword,
        role,
        avatar,
        newsletter,
      ]);
      const user = userResult.rows[0];

      const slug = await generateUniqueSlug(firstName, lastName);
      const sellerQuery = `
        INSERT INTO sellers (user_id, slug, member_since)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const memberSince = new Date().getFullYear();
      const sellerResult = await client.query(sellerQuery, [user.id, slug, memberSince]);
      const seller = sellerResult.rows[0];

      const tokens = generateTokens(user.id);

      delete user.password;

      return {
        user,
        seller,
        ...tokens,
      };
    });
  } else {
    const user = await userRepository.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      avatar,
      newsletter,
    });

    const tokens = generateTokens(user.id);

    delete user.password;

    return {
      user,
      ...tokens,
    };
  }
};

const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new ApiError(401, 'Credenciais inválidas');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Credenciais inválidas');
  }

  const tokens = generateTokens(user.id);

  delete user.password;

  let seller = null;
  if (user.role === 'SELLER') {
    seller = await sellerRepository.findByUserId(user.id);
  }

  return {
    user,
    seller,
    ...tokens,
  };
};

const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, 'Usuário não encontrado');
    }

    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return { accessToken };
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token inválido ou expirado');
    }
    throw error;
  }
};

const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, 'Usuário não encontrado');
    }

    delete user.password;

    let seller = null;
    if (user.role === 'SELLER') {
      seller = await sellerRepository.findByUserId(user.id);
    }

    return { user, seller };
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token inválido ou expirado');
    }
    throw error;
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  verifyToken,
  generateTokens,
  generateAvatar,
  generateUniqueSlug,
};
