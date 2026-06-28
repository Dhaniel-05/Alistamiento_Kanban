const {
  procesarTablasPrograma,
  TARGET_NOMBRE,
  TARGET_CODIGO,
  TARGET_VERSION,
  TARGET_VIGENCIA,
  TARGET_DURACION,
  TARGET_LECTIVA,
  TARGET_PRODUCTIVA,
  TARGET_TIPO,
} = require('./programaExtractor.service');

describe('programaExtractor.service', () => {
  test('procesa filas de tabla con la misma estructura que el extractor Python', () => {
    const tablas = [[
      [TARGET_NOMBRE, 'Técnico en Programación de Software'],
      [TARGET_CODIGO, '228106'],
      [TARGET_VERSION, '1.0'],
      [TARGET_VIGENCIA, '2024'],
      [`${TARGET_DURACION} ${TARGET_LECTIVA}`, '2880 horas'],
      [TARGET_PRODUCTIVA, '240 horas'],
      ['TOTAL', '3120 horas'],
      [TARGET_TIPO, 'Titulada'],
    ]];

    const registros = procesarTablasPrograma([tablas]);

    expect(registros).toHaveLength(1);
    expect(registros[0]).toEqual({
      nombre_programa: 'Técnico en Programación de Software',
      codigo_programa: '228106',
      version_programa: '1.0',
      vigencia: '2024',
      horas_etapa_lectiva: '2880 horas',
      horas_etapa_productiva: '240 horas',
      horas_totales: '3120 horas',
      tipo: 'Titulada',
    });
  });

  test('cierra registro anterior al detectar nueva DENOMINACION DEL PROGRAMA', () => {
    const tablas = [[
      [TARGET_NOMBRE, 'Programa A'],
      [TARGET_CODIGO, '111111'],
      [TARGET_NOMBRE, 'Programa B'],
      [TARGET_CODIGO, '222222'],
    ]];

    const registros = procesarTablasPrograma([tablas]);

    expect(registros).toHaveLength(2);
    expect(registros[0].nombre_programa).toBe('Programa A');
    expect(registros[0].codigo_programa).toBe('111111');
    expect(registros[1].nombre_programa).toBe('Programa B');
    expect(registros[1].codigo_programa).toBe('222222');
  });
});
