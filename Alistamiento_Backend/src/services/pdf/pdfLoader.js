const fs = require('fs/promises');
const path = require('path');

const PDFJS_PACKAGE_DIR = path.dirname(require.resolve('pdfjs-dist/package.json'));
const STANDARD_FONTS_DIR = `${path.join(PDFJS_PACKAGE_DIR, 'standard_fonts')}${path.sep}`;

/** @type {typeof import('pdfjs-dist/legacy/build/pdf.mjs') | null} */
let pdfjsModule = null;

async function getPdfjs() {
  if (!pdfjsModule) {
    // Legacy build runs in Node without a Web Worker; do not set workerSrc to a filesystem path.
    pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsModule;
}

/**
 * Convierte un TextItem de pdf.js a coordenadas top-down (como pdfplumber).
 * @param {object} item - Item de getTextContent()
 * @param {number} pageHeight - Altura de la página en puntos PDF
 * @returns {{ text: string, x: number, y: number, width: number, height: number }}
 */
function mapTextItem(item, pageHeight) {
  const x = item.transform[4];
  const baselineY = item.transform[5];
  const height = item.height ?? Math.abs(item.transform[3]) ?? 0;

  return {
    text: item.str,
    x,
    y: pageHeight - baselineY,
    width: item.width ?? 0,
    height,
  };
}

/**
 * Carga un PDF desde disco y devuelve items de texto por página.
 * @param {string} filePath - Ruta absoluta o relativa al PDF
 * @returns {Promise<{
 *   numPages: number,
 *   pages: Array<{
 *     pageNumber: number,
 *     width: number,
 *     height: number,
 *     items: Array<{ text: string, x: number, y: number, width: number, height: number }>
 *   }>
 * }>}
 */
async function loadPdfFromPath(filePath) {
  const pdfjs = await getPdfjs();
  const absolutePath = path.resolve(filePath);
  const buffer = await fs.readFile(absolutePath);
  const data = new Uint8Array(buffer);

  const loadingTask = pdfjs.getDocument({
    data,
    // NodeStandardFontDataFactory reads this path with fs.readFile (not fetch/URL).
    standardFontDataUrl: STANDARD_FONTS_DIR,
  });

  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const items = textContent.items
      .filter((item) => typeof item.str === 'string' && item.str.length > 0)
      .map((item) => mapTextItem(item, viewport.height));

    pages.push({
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      items,
    });
  }

  return {
    numPages: pdf.numPages,
    pages,
  };
}

module.exports = {
  loadPdfFromPath,
  mapTextItem,
};
