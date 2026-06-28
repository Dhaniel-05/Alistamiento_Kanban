const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`[config] Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

function parseCorsOrigins() {
  const fromEnv = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (nodeEnv === 'development') {
    const origins = new Set(fromEnv);
    origins.add('http://localhost:5173');
    return [...origins];
  }

  return fromEnv;
}

const config = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: requireEnv('DB_PASSWORD'),
    name: requireEnv('DB_NAME'),
  },
  jwtSecret: requireEnv('JWT_SECRET'),
  nodeEnv,
  corsOrigins: parseCorsOrigins(),
};

module.exports = config;
