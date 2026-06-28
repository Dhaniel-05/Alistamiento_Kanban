const SENSITIVE_KEY_PATTERN = /^(email|password|contrasena|nueva_contrasena|token|authorization|rol|cedula|user|instructor)$/i;
const SENSITIVE_KEY_SUBSTRING = /password|contrasena|token|authorization/i;

function isSensitiveKey(key) {
  return SENSITIVE_KEY_PATTERN.test(key) || SENSITIVE_KEY_SUBSTRING.test(key);
}

function sanitizeValue(value, seen = new WeakSet()) {
  if (value == null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen));
  }

  const sanitized = {};

  for (const [key, val] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = '[Redacted]';
    } else {
      sanitized[key] = sanitizeValue(val, seen);
    }
  }

  return sanitized;
}

function emit(level, args) {
  if (!import.meta.env.DEV) {
    return;
  }

  const sanitizedArgs = args.map((arg) => sanitizeValue(arg));
  console[level](...sanitizedArgs);
}

export const logger = {
  debug: (...args) => emit('debug', args),
  info: (...args) => emit('info', args),
  warn: (...args) => emit('warn', args),
  error: (...args) => emit('error', args),
};
