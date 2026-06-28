const {
  stripAccents,
  norm,
  extraerHoras,
  limpiarItem,
  esRuido,
  esContenidoValido,
} = require('./pdfText');

describe('pdfText helpers (paridad con pdf_helpers.py)', () => {
  test('stripAccents quita tildes', () => {
    expect(stripAccents('Gestión')).toBe('Gestion');
  });

  test('norm mayúsculas y espacios', () => {
    expect(norm('  código   programa ')).toBe('CODIGO PROGRAMA');
  });

  test('extraerHoras', () => {
    expect(extraerHoras('Duración 3120 horas lectivas')).toBe('3120 horas');
    expect(extraerHoras('sin horas')).toBe('');
  });

  test('limpiarItem elimina viñetas', () => {
    expect(limpiarItem('•  Item de prueba')).toBe('Item de prueba');
  });

  test('esRuido detecta encabezados SENA', () => {
    expect(esRuido('RED TECNOLOGICA')).toBe(true);
    expect(esRuido('Contenido pedagógico válido del RAP')).toBe(false);
  });

  test('esContenidoValido', () => {
    expect(esContenidoValido('Texto corto')).toBe(false);
    expect(esContenidoValido('Resultado de aprendizaje con contenido suficiente')).toBe(true);
  });
});
