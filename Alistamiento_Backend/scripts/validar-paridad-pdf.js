#!/usr/bin/env node
/**
 * Test de regresión del extractor Python (pdfplumber) sin escribir en MySQL.
 *
 * Uso:
 *   node scripts/validar-paridad-pdf.js <ruta_pdf> <tipo>
 *
 * Tipos: programa | competencias | raps | proyecto | fases | actividades | todo
 */

const fs = require('fs');
const path = require('path');
const pdfExtractionService = require('../src/services/pdf/pdfExtraction.service');
const { resolvePythonExecutable } = require('../src/services/pythonService');

const TIPOS_VALIDOS = [
  'programa',
  'competencias',
  'raps',
  'proyecto',
  'fases',
  'actividades',
  'todo',
];

const KEYS_BY_TIPO = {
  programa: ['programa'],
  competencias: ['competencias'],
  raps: ['unidadRaps'],
  proyecto: ['proyecto'],
  fases: ['fases'],
  actividades: ['actividades'],
  todo: ['programa', 'competencias', 'unidadRaps', 'proyecto', 'fases', 'actividades'],
};

const MIN_RECORDS_BY_KEY = {
  programa: 1,
  competencias: 1,
  unidadRaps: 1,
  proyecto: 1,
  fases: 1,
  actividades: 1,
};

function printUsage() {
  console.error(`
Uso: node scripts/validar-paridad-pdf.js <ruta_pdf> <tipo>

Tipos válidos: ${TIPOS_VALIDOS.join(' | ')}

Variables opcionales:
  PYTHON_BIN          Intérprete Python (autodetección si no se define)
  PYTHON_TIMEOUT_MS   Timeout del subprocess en ms (default: 120000)

No escribe en base de datos. Valida que el extractor Python devuelva datos.
`.trim());
}

function parseArgs() {
  const pdfArg = process.argv[2];
  const tipo = process.argv[3];

  if (!pdfArg || !tipo) {
    printUsage();
    process.exit(2);
  }

  if (!TIPOS_VALIDOS.includes(tipo)) {
    console.error(`Tipo inválido: "${tipo}". Use: ${TIPOS_VALIDOS.join(', ')}`);
    process.exit(2);
  }

  const pdfPath = path.resolve(pdfArg);

  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF no encontrado: ${pdfPath}`);
    process.exit(2);
  }

  return { pdfPath, tipo };
}

function countRaps(unidadRaps) {
  if (!Array.isArray(unidadRaps)) {
    return 0;
  }

  return unidadRaps.reduce(
    (total, unit) => total + (Array.isArray(unit?.resultados_aprendizaje)
      ? unit.resultados_aprendizaje.length
      : 0),
    0,
  );
}

function buildCountSummary(data) {
  const summary = {};

  if (data.programa !== undefined) {
    summary.programa_registros = Array.isArray(data.programa) ? data.programa.length : 0;
  }

  if (data.competencias !== undefined) {
    summary.competencias = Array.isArray(data.competencias) ? data.competencias.length : 0;
  }

  if (data.unidadRaps !== undefined) {
    summary.unidades_rap = Array.isArray(data.unidadRaps) ? data.unidadRaps.length : 0;
    summary.raps_totales = countRaps(data.unidadRaps);
  }

  if (data.proyecto !== undefined) {
    summary.proyecto_registros = Array.isArray(data.proyecto) ? data.proyecto.length : 0;
  }

  if (data.fases !== undefined) {
    summary.fases = Array.isArray(data.fases) ? data.fases.length : 0;
  }

  if (data.actividades !== undefined) {
    summary.actividades = Array.isArray(data.actividades) ? data.actividades.length : 0;
  }

  return summary;
}

function validateMinimumRecords(data, tipo) {
  const keys = KEYS_BY_TIPO[tipo];
  const failures = [];

  for (const key of keys) {
    const minimum = MIN_RECORDS_BY_KEY[key];
    if (minimum === undefined) {
      continue;
    }

    const value = data[key];
    const count = Array.isArray(value) ? value.length : 0;

    if (count < minimum) {
      failures.push(`${key}: se esperaban al menos ${minimum}, se obtuvieron ${count}`);
    }
  }

  return failures;
}

function printSummary(summary) {
  console.log('\n=== RESUMEN DE EXTRACCIÓN ===');

  const labels = Object.keys(summary).sort();

  if (labels.length === 0) {
    console.log('(sin colecciones para el tipo solicitado)');
    return;
  }

  for (const label of labels) {
    console.log(`${label}: ${summary[label]}`);
  }
}

async function main() {
  const { pdfPath, tipo } = parseArgs();

  console.log('=== REGRESIÓN EXTRACTOR PDF (Python/pdfplumber) ===');
  console.log(`PDF   : ${pdfPath}`);
  console.log(`Tipo  : ${tipo}`);
  console.log(`Python: ${resolvePythonExecutable()}`);
  console.log('BD    : sin escrituras\n');

  const result = await pdfExtractionService.procesar(pdfPath, tipo);

  if (!result.success) {
    console.error(`Extracción fallida: ${result.error}`);
    if (result.code) {
      console.error(`Código: ${result.code}`);
    }
    process.exit(2);
  }

  const data = result.data || {};
  const summary = buildCountSummary(data);
  printSummary(summary);

  const failures = validateMinimumRecords(data, tipo);

  if (failures.length > 0) {
    console.log('\n=== RESULTADO ===');
    console.log('REGRESIÓN FALLIDA:');
    failures.forEach((failure) => console.log(`  - ${failure}`));
    process.exit(1);
  }

  console.log('\n=== RESULTADO ===');
  console.log('REGRESIÓN OK: el extractor Python devolvió datos válidos.');
  process.exit(0);
}

main().catch((error) => {
  console.error(`Error ejecutando regresión: ${error.message}`);
  process.exit(2);
});
