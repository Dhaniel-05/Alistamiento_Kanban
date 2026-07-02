const { RATIO_DIRECTA } = require('../config/horas.constants');
function calcularHoras(horas) {
  const total = Math.round(Number(horas) || 0);
  const directa = Math.round(total * RATIO_DIRECTA);
  return { directa, independiente: total - directa };
}
module.exports = { calcularHoras };
