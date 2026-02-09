const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaStr}`;
};

const logger = {
  info: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${colors.blue}${formatMessage('INFO', message, meta)}${colors.reset}`);
    }
  },

  success: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${colors.green}${formatMessage('SUCCESS', message, meta)}${colors.reset}`);
    }
  },

  warn: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`${colors.yellow}${formatMessage('WARN', message, meta)}${colors.reset}`);
    }
  },

  error: (message, meta = {}) => {
    console.error(`${colors.red}${formatMessage('ERROR', message, meta)}${colors.reset}`);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${colors.dim}${formatMessage('DEBUG', message, meta)}${colors.reset}`);
    }
  },

  http: (method, url, statusCode, duration) => {
    const color = statusCode >= 500 ? colors.red 
                : statusCode >= 400 ? colors.yellow 
                : colors.green;
    
    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `${color}${method} ${url} ${statusCode} - ${duration}ms${colors.reset}`
      );
    }
  },
};

module.exports = logger;
