/**
 * Reconstruye tablas a partir de items de texto con coordenadas.
 *
 * Salida equivalente a pdfplumber.Page.extract_tables():
 *   Array<table> donde cada table es Array<row> y cada row es Array<cellString>
 *
 * @typedef {import('./pdfLoader').TextItem} TextItem - { text, x, y, width, height }
 */

const DEFAULT_OPTIONS = {
  /**
   * rowTolerance (pt): diferencia máxima en Y para considerar que dos items
   * pertenecen a la misma fila. PDFs SENA suelen usar 3–6 pt.
   */
  rowTolerance: 4,

  /**
   * colTolerance (pt): separación horizontal mínima entre columnas dentro de
   * una fila. Si gap > colTolerance se abre una nueva celda.
   */
  colTolerance: 8,

  /**
   * tableGapTolerance (pt): salto vertical entre filas que indica inicio de
   * otra tabla en la misma página (p. ej. bloques separados).
   */
  tableGapTolerance: 28,

  /**
   * minRowsPerTable: tablas con menos filas se descartan (ruido/encabezados sueltos).
   */
  minRowsPerTable: 2,
};

/**
 * Agrupa items en filas por coordenada Y.
 * @param {Array<{ text: string, x: number, y: number, width: number, height: number }>} items
 * @param {number} rowTolerance
 */
function clusterRows(items, rowTolerance) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows = [];

  for (const item of sorted) {
    const existingRow = rows.find((row) => Math.abs(row.y - item.y) <= rowTolerance);

    if (existingRow) {
      existingRow.items.push(item);
      const count = existingRow.items.length;
      existingRow.y = ((existingRow.y * (count - 1)) + item.y) / count;
    } else {
      rows.push({ y: item.y, items: [item] });
    }
  }

  return rows.sort((a, b) => a.y - b.y);
}

/**
 * Separa filas en bloques de tabla por huecos verticales grandes.
 * @param {Array<{ y: number, items: object[] }>} rows
 * @param {number} tableGapTolerance
 * @param {number} minRowsPerTable
 */
function splitIntoTableBlocks(rows, tableGapTolerance, minRowsPerTable) {
  if (rows.length === 0) {
    return [];
  }

  const blocks = [];
  let currentBlock = [rows[0]];

  for (let index = 1; index < rows.length; index += 1) {
    const gap = rows[index].y - rows[index - 1].y;
    if (gap > tableGapTolerance) {
      blocks.push(currentBlock);
      currentBlock = [rows[index]];
    } else {
      currentBlock.push(rows[index]);
    }
  }

  blocks.push(currentBlock);
  return blocks.filter((block) => block.length >= minRowsPerTable);
}

/**
 * Convierte una fila agrupada en un array de celdas (strings).
 * @param {{ items: object[] }} row
 * @param {number} colTolerance
 * @returns {string[]}
 */
function rowToCells(row, colTolerance) {
  const sortedItems = [...row.items].sort((a, b) => a.x - b.x);
  const cells = [];
  let bucket = [];
  let lastRightEdge = -Infinity;

  for (const item of sortedItems) {
    const gap = item.x - lastRightEdge;
    if (bucket.length > 0 && gap > colTolerance) {
      cells.push(bucket.map((entry) => entry.text).join(' ').replace(/\s+/g, ' ').trim());
      bucket = [];
    }
    bucket.push(item);
    lastRightEdge = item.x + (item.width || 0);
  }

  if (bucket.length > 0) {
    cells.push(bucket.map((entry) => entry.text).join(' ').replace(/\s+/g, ' ').trim());
  }

  return cells;
}

/**
 * Reconstruye tablas de una página a partir de sus text items.
 * @param {{ items: object[] }} page - Página devuelta por pdfLoader
 * @param {Partial<typeof DEFAULT_OPTIONS>} [options]
 * @returns {string[][][]} Array de tablas; cada tabla es matriz filas x celdas
 */
function reconstructTablesFromPage(page, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const { rowTolerance, colTolerance, tableGapTolerance, minRowsPerTable } = config;

  if (!page?.items?.length) {
    return [];
  }

  const rows = clusterRows(page.items, rowTolerance);
  const blocks = splitIntoTableBlocks(rows, tableGapTolerance, minRowsPerTable);

  return blocks.map((block) => block.map((row) => rowToCells(row, colTolerance)));
}

/**
 * Equivalente a iterar pdfplumber pages y llamar extract_tables() en cada una.
 * @param {Array<{ items: object[] }>} pages
 * @param {Partial<typeof DEFAULT_OPTIONS>} [options]
 * @returns {Array<{ pageNumber: number, tables: string[][][] }>}
 */
function reconstructTablesFromDocument(pages, options = {}) {
  return pages.map((page) => ({
    pageNumber: page.pageNumber,
    tables: reconstructTablesFromPage(page, options),
  }));
}

/**
 * Aplana tablas de todas las páginas (mismo orden que el bucle for page in pdf.pages).
 * @param {Array<{ pageNumber: number, tables: string[][][] }>} pageTables
 * @returns {string[][][]}
 */
function flattenPageTables(pageTables) {
  return pageTables.flatMap((entry) => entry.tables);
}

module.exports = {
  DEFAULT_OPTIONS,
  clusterRows,
  splitIntoTableBlocks,
  rowToCells,
  reconstructTablesFromPage,
  reconstructTablesFromDocument,
  flattenPageTables,
};
