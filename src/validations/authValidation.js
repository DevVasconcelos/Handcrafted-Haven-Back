const { z } = require('zod');

const registerSchema = z.object({
  firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  lastName: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['BUYER', 'SELLER']).default('BUYER'),
  newsletter: z.boolean().default(false),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
};
