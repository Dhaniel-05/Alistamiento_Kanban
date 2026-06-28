const winston = require('winston');
const config = require('./env');

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaKeys = Object.keys(meta).filter((key) => key !== 'service');
    const metaOutput = metaKeys.length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const stackOutput = stack ? `\n${stack}` : '';
    return `${timestamp} [${level}]: ${message}${metaOutput}${stackOutput}`;
  }),
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  defaultMeta: { service: 'alistamiento-backend' },
  format: config.nodeEnv === 'production' ? productionFormat : developmentFormat,
  transports: [new winston.transports.Console()],
});

module.exports = logger;
