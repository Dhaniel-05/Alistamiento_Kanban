const {
  procesarTablasCompetencias,
  TARGET_COMPETENCIA,
  TARGET_CODIGO,
  TARGET_NOMBRE,
  TARGET_HORA,
} = require('./competenciasExtractor.service');

describe('competenciasExtractor.service', () => {
  test('procesa filas con la misma estructura que el extractor Python', () => {
    const tablas = [[
      [TARGET_COMPETENCIA, 'Unidad 1'],
      [TARGET_CODIGO, '220501092'],
      [TARGET_NOMBRE, 'Desarrollar la solución de software'],
      [TARGET_HORA, 'Duración', '120 horas'],
    ]];

    const registros = procesarTablasCompetencias([tablas]);

    expect(registros).toHaveLength(1);
    expect(registros[0]).toEqual({
      unidad_competencia: 'UNIDAD 1',
      codigo_norma: '220501092',
      nombre_competencia: 'DESARROLLAR LA SOLUCION DE SOFTWARE',
      duracion_maxima: '120 horas',
    });
  });

  test('cierra registro anterior al detectar nueva UNIDAD DE COMPETENCIA', () => {
    const tablas = [[
      [TARGET_COMPETENCIA, 'Unidad 1'],
      [TARGET_CODIGO, '111111'],
      [TARGET_COMPETENCIA, 'Unidad 2'],
      [TARGET_CODIGO, '222222'],
    ]];

    const registros = procesarTablasCompetencias([tablas]);

    expect(registros).toHaveLength(2);
    expect(registros[0].unidad_competencia).toBe('UNIDAD 1');
    expect(registros[0].codigo_norma).toBe('111111');
    expect(registros[1].unidad_competencia).toBe('UNIDAD 2');
    expect(registros[1].codigo_norma).toBe('222222');
  });

  test('omite filas en etapa práctica hasta un código válido', () => {
    const tablas = [[
      [TARGET_COMPETENCIA, 'Unidad lectiva'],
      [TARGET_CODIGO, '100001'],
      ['ETAPA PRACTICA', ''],
      [TARGET_CODIGO, '999999999'],
      [TARGET_NOMBRE, 'No debe guardarse'],
      [TARGET_CODIGO, '333333'],
      [TARGET_NOMBRE, 'Competencia post-práctica'],
    ]];

    const registros = procesarTablasCompetencias([tablas]);

    expect(registros).toHaveLength(2);
    expect(registros[0].codigo_norma).toBe('100001');
    expect(registros[1].codigo_norma).toBe('333333');
    expect(registros[1].nombre_competencia).toBe('COMPETENCIA POST-PRACTICA');
  });

  test('ignora horas sueltas cuando no hay competencia abierta', () => {
    const tablas = [[
      [TARGET_HORA, '3120 horas'],
      [TARGET_COMPETENCIA, 'Unidad 1'],
      [TARGET_HORA, '80 horas'],
    ]];

    const registros = procesarTablasCompetencias([tablas]);

    expect(registros).toHaveLength(1);
    expect(registros[0].duracion_maxima).toBe('80 horas');
  });
});
