require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/database');
const logger = require('./utils/logger');
const requestLogger = require('./middlewares/requestLogger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(helmet());

// Normalize origens permitidas: remove espaços e barras finais para evitar falhas por variações de formato
const allowedOrigins = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002'
    ])
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const shouldBypassRateLimit = (req) => {
  const ip = req.ip || '';
  return ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1');
};

// Skip rate limiting for localhost to ease local development
app.use('/api/', (req, res, next) => {
  if (shouldBypassRateLimit(req)) return next();
  return limiter(req, res, next);
});
app.use(requestLogger);

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sellers', sellerRoutes);

app.get('/health', async (req, res) => {
  try {
    await testConnection();
    res.status(200).json({
      success: true,
      message: 'API funcionando!',
      data: {
        status: 'healthy',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Serviço indisponível',
      data: {
        status: 'unhealthy',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      },
    });
  }
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Handcrafted Haven API',
    data: {
      version: '1.0.0',
      environment: NODE_ENV,
      documentation: '/api-docs',
    },
  });
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    logger.info('Testando conexão com banco de dados...');
    await testConnection();
    logger.success('Conexão com banco de dados estabelecida');

    app.listen(PORT, () => {
      logger.success(`Servidor rodando na porta ${PORT}`);
      logger.info(`Ambiente: ${NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      
      if (NODE_ENV === 'development') {
        logger.debug('Modo desenvolvimento ativado');
      }
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', { error: error.message });
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido, encerrando servidor...');
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
