const ExcelJS = require('exceljs');
const { sanitizeExcelCell } = require('../utils/excelSanitize');
const { calcularHoras } = require('./horas.service');

const COLUMN_WIDTHS = {
  A: 28,
  B: 40,
  C: 38,
  D: 50,
  E: 40,
  F: 40,
  G: 40,
  H: 40,
  I: 20,
  J: 20,
  K: 40,
  L: 40,
  M: 25,
  N: 30,
  O: 30,
  P: 45,
};

const EXCEL_DATE_FORMAT = 'yyyy-mm-dd';

function setCell(ws, address, value) {
  ws.getCell(address).value = sanitizeExcelCell(value);
}

function parseExcelDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (value != null) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

function setDateCell(ws, address, value) {
  const celda = ws.getCell(address);
  celda.value = parseExcelDate(value);
  celda.numFmt = EXCEL_DATE_FORMAT;
}

function mergeTitleRow(ws, row, colStart, colEnd, value) {
  ws.mergeCells(row, colStart, row, colEnd);
  const cell = ws.getCell(row, colStart);
  cell.value = sanitizeExcelCell(value);
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.font = { bold: true };
}

/**
 * Genera buffer .xlsx GFPI-F-134 Versión 04.
 * @param {{ rows: object[], metadata: object|null, integrantes: object[], idFicha: number }} params
 * @returns {Promise<Buffer>}
 */
async function buildGfpi134Workbook({ rows, metadata, integrantes, idFicha }) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Planeación');

  Object.entries(COLUMN_WIDTHS).forEach(([col, width]) => {
    ws.getColumn(col).width = width;
  });

  mergeTitleRow(ws, 1, 1, 15, 'FORMATO PARA LA PLANEACIÓN PEDAGÓGICA DEL PROYECTO FORMATIVO');
  setCell(ws, 'P1', 'Versión: 04');
  setCell(ws, 'P2', 'Código: GFPI-F-134');

  const meta = metadata ?? {};
  const primeraFila = rows[0] ?? {};

  const integrantesTexto = integrantes
    .map((item) => `${item.nombre}${item.rol ? ` (${item.rol})` : ''}`)
    .join(', ');

  setCell(ws, 'A5', 'Fecha de Elaboración:');
  setDateCell(ws, 'B5', primeraFila.fecha_creacion);
  setCell(ws, 'A6', 'Denominación del Programa:');
  setCell(ws, 'B6', meta.nombre_programa ?? primeraFila.nombre_programa ?? '');
  setCell(ws, 'A7', 'Modalidad:');
  setCell(ws, 'B7', meta.modalidad ?? primeraFila.modalidad ?? '');
  setCell(ws, 'A8', 'Código y versión del Programa:');
  setCell(
    ws,
    'B8',
    `${meta.codigo_programa ?? primeraFila.codigo_programa ?? ''} - v${meta.version_programa ?? primeraFila.version_programa ?? ''}`,
  );
  setCell(ws, 'A9', 'Nombre y Código del Proyecto:');
  setCell(
    ws,
    'B9',
    `${meta.nombre_proyecto ?? primeraFila.nombre_proyecto ?? ''} (${meta.codigo_proyecto ?? primeraFila.codigo_proyecto ?? ''})`,
  );
  setCell(ws, 'A10', 'Integrantes del equipo:');
  setCell(ws, 'B10', integrantesTexto);
  setCell(ws, 'A11', 'Ficha:');
  const codigoFicha = meta.codigo_ficha ?? primeraFila.codigo_ficha ?? idFicha;
  setCell(ws, 'B11', codigoFicha);

  const headerRow1 = 16;
  const headerRow2 = 17;
  const headers = [
    { col: 'A', r1: 'Fase del Proyecto', r2: '' },
    { col: 'B', r1: 'Actividad del Proyecto', r2: '' },
    { col: 'C', r1: 'Competencia', r2: '' },
    { col: 'D', r1: 'Resultado de Aprendizaje', r2: '' },
    { col: 'E', r1: 'Saberes conceptos', r2: '' },
    { col: 'F', r1: 'Saberes del proceso', r2: '' },
    { col: 'G', r1: 'Criterios de evaluación', r2: '' },
    { col: 'H', r1: 'Actividades de aprendizaje', r2: '' },
    { col: 'I', r1: 'Horas trabajo directo', r2: '' },
    { col: 'J', r1: 'Horas trab. independiente', r2: '' },
    { col: 'K', r1: 'Descripción evidencia', r2: '' },
    { col: 'L', r1: 'Estrategias didácticas', r2: '' },
    { col: 'M', r1: 'Ambiente', r2: '' },
    { col: 'N', r1: 'Materiales de formación', r2: '' },
    { col: 'O', r1: 'Instructores responsables', r2: '' },
    { col: 'P', r1: 'Observaciones', r2: '' },
  ];

  headers.forEach(({ col, r1, r2 }) => {
    const colIndex = col.charCodeAt(0) - 64;
    ws.mergeCells(headerRow1, colIndex, headerRow2, colIndex);
    const cell = ws.getCell(headerRow1, colIndex);
    cell.value = sanitizeExcelCell(r1);
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    if (r2) {
      cell.value = `${r1}\n${r2}`;
    }
  });

  let dataRow = 18;
  for (const row of rows) {
    setCell(ws, `A${dataRow}`, row.fase_proyecto ?? '');
    setCell(ws, `B${dataRow}`, row.actividad_proyecto ?? '');
    setCell(ws, `C${dataRow}`, row.competencia ?? '');
    setCell(ws, `D${dataRow}`, row.nombre_rap ?? '');
    setCell(ws, `E${dataRow}`, row.saberes_conceptos ?? '');
    setCell(ws, `F${dataRow}`, row.saberes_proceso ?? '');
    setCell(ws, `G${dataRow}`, row.criterios_evaluacion ?? '');
    setCell(ws, `H${dataRow}`, row.actividades_aprendizaje ?? '');
    const { directa, independiente } = calcularHoras(row.horas_trimestre);
    setCell(ws, `I${dataRow}`, directa);
    setCell(ws, `J${dataRow}`, independiente);
    setCell(ws, `K${dataRow}`, row.descripcion_evidencia ?? '');
    setCell(ws, `L${dataRow}`, row.estrategias_didacticas ?? '');
    setCell(ws, `M${dataRow}`, row.ambientes_aprendizaje ?? '');
    setCell(ws, `N${dataRow}`, row.materiales_formacion ?? '');
    setCell(ws, `O${dataRow}`, row.instructores_responsables ?? '');
    setCell(ws, `P${dataRow}`, row.observaciones ?? '');
    dataRow += 1;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = {
  buildGfpi134Workbook,
};
