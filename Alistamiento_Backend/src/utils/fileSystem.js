const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

function removeFileSafe(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug('Archivo temporal eliminado');
    }
  } catch (error) {
    logger.error('Error eliminando archivo temporal', { stack: error.stack });
  }
}

module.exports = {
  removeFileSafe,
};
