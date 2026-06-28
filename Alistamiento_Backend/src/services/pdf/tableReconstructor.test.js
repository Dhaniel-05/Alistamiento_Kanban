const {
  reconstructTablesFromPage,
  clusterRows,
  rowToCells,
} = require('./tableReconstructor');

describe('tableReconstructor', () => {
  const samplePage = {
    pageNumber: 1,
    width: 600,
    height: 800,
    items: [
      { text: 'Celda A1', x: 10, y: 100, width: 40, height: 10 },
      { text: 'Celda B1', x: 120, y: 101, width: 40, height: 10 },
      // ΔY ≈ 18 pt (< tableGapTolerance 28) → misma tabla
      { text: 'Celda A2', x: 12, y: 118, width: 40, height: 10 },
      { text: 'Celda B2', x: 118, y: 119, width: 40, height: 10 },
    ],
  };

  test('clusterRows agrupa por Y con tolerancia', () => {
    const rows = clusterRows(samplePage.items, 4);
    expect(rows).toHaveLength(2);
    expect(rows[0].items).toHaveLength(2);
  });

  test('rowToCells separa columnas por gap en X', () => {
    const rows = clusterRows(samplePage.items, 4);
    const cells = rowToCells(rows[0], 8);
    expect(cells).toEqual(['Celda A1', 'Celda B1']);
  });

  test('reconstructTablesFromPage devuelve estructura extract_tables', () => {
    const tables = reconstructTablesFromPage(samplePage, { minRowsPerTable: 2 });
    expect(Array.isArray(tables)).toBe(true);
    expect(Array.isArray(tables[0])).toBe(true);
    expect(Array.isArray(tables[0][0])).toBe(true);
    expect(typeof tables[0][0][0]).toBe('string');
    expect(tables[0]).toHaveLength(2);
    expect(tables[0][0]).toEqual(['Celda A1', 'Celda B1']);
    expect(tables[0][1]).toEqual(['Celda A2', 'Celda B2']);
  });
});
