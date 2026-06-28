jest.mock('../config/conexion_db', () => ({
  getConnection: jest.fn(),
}));

jest.mock('../config/logger', () => ({
  error: jest.fn(),
}));

jest.mock('../repositories/rapTrimestre.repository', () => ({
  getCompetenciaDeRap: jest.fn(),
  getDuracionCompetencia: jest.fn(),
  contarRapsDeCompetencia: jest.fn(),
  contarTrimestresDeRap: jest.fn(),
  upsertAsignacion: jest.fn(),
  updateHoras: jest.fn(),
  deleteAsignacion: jest.fn(),
  deleteOtherAsignacionesEnFicha: jest.fn(),
}));

const db = require('../config/conexion_db');
const rapTrimestreRepository = require('../repositories/rapTrimestre.repository');
const planeacionService = require('./planeacion.service');

const ID_RAP = 101;
const ID_TRIMESTRE = 202;
const ID_FICHA = 303;
const ID_COMPETENCIA = 10;

function setupMockConnection() {
  const connection = {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };
  db.getConnection.mockResolvedValue(connection);
  return connection;
}

function mockCompetenciaBase({
  duracionMaxima = 440,
  rapsCompetencia = 4,
} = {}) {
  rapTrimestreRepository.getCompetenciaDeRap.mockResolvedValue(ID_COMPETENCIA);
  rapTrimestreRepository.getDuracionCompetencia.mockResolvedValue(duracionMaxima);
  rapTrimestreRepository.contarRapsDeCompetencia.mockResolvedValue(rapsCompetencia);
}

/** Fórmula SENA idéntica al stored procedure */
function formulaSena(duracion, raps, trimestres) {
  const divisorTrimestres = trimestres === 0 ? 1 : trimestres;
  const horasTrimestre = duracion / raps / divisorTrimestres;
  const horasSemana = horasTrimestre / 11;
  return { horasTrimestre, horasSemana };
}

describe('planeacion.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rapTrimestreRepository.upsertAsignacion.mockResolvedValue(undefined);
    rapTrimestreRepository.updateHoras.mockResolvedValue(undefined);
    rapTrimestreRepository.deleteAsignacion.mockResolvedValue(1);
    rapTrimestreRepository.deleteOtherAsignacionesEnFicha.mockResolvedValue(undefined);
  });

  describe('asignarRapTrimestre', () => {
    it('calcula horas_trimestre y horas_semana con la fórmula SENA (varios RAPs y trimestres)', async () => {
      const connection = setupMockConnection();
      const duracionMaxima = 440;
      const rapsCompetencia = 4;
      const trimestresGlobales = 2;
      const trimestresEnFicha = 2;

      mockCompetenciaBase({ duracionMaxima, rapsCompetencia });
      rapTrimestreRepository.contarTrimestresDeRap.mockImplementation((_conn, _idRap, idFicha) => {
        if (idFicha === undefined) {
          return Promise.resolve(trimestresGlobales);
        }
        return Promise.resolve(trimestresEnFicha);
      });

      const esperadoUpsert = formulaSena(duracionMaxima, rapsCompetencia, trimestresGlobales);
      const esperadoRecalculo = formulaSena(duracionMaxima, rapsCompetencia, trimestresEnFicha);

      const result = await planeacionService.asignarRapTrimestre(ID_RAP, ID_TRIMESTRE, ID_FICHA);

      expect(result).toBe(true);
      expect(connection.beginTransaction).toHaveBeenCalled();
      expect(connection.commit).toHaveBeenCalled();
      expect(rapTrimestreRepository.upsertAsignacion).toHaveBeenCalledWith(connection, {
        idRap: ID_RAP,
        idTrimestre: ID_TRIMESTRE,
        idFicha: ID_FICHA,
        horasTrimestre: esperadoUpsert.horasTrimestre,
        horasSemana: esperadoUpsert.horasSemana,
      });
      expect(rapTrimestreRepository.updateHoras).toHaveBeenCalledWith(
        connection,
        ID_RAP,
        ID_FICHA,
        esperadoRecalculo.horasTrimestre,
        esperadoRecalculo.horasSemana,
      );

      expect(esperadoUpsert.horasTrimestre).toBe(55);
      expect(esperadoUpsert.horasSemana).toBe(5);
      expect(esperadoRecalculo.horasTrimestre).toBe(55);
      expect(esperadoRecalculo.horasSemana).toBe(5);
    });

    it('trata nº_trimestres = 0 como 1 en el upsert (borde SP)', async () => {
      const connection = setupMockConnection();
      const duracionMaxima = 120;
      const rapsCompetencia = 3;

      mockCompetenciaBase({ duracionMaxima, rapsCompetencia });
      rapTrimestreRepository.contarTrimestresDeRap.mockImplementation((_conn, _idRap, idFicha) => {
        if (idFicha === undefined) {
          return Promise.resolve(0);
        }
        return Promise.resolve(1);
      });

      const esperadoUpsert = formulaSena(duracionMaxima, rapsCompetencia, 0);

      await planeacionService.asignarRapTrimestre(ID_RAP, ID_TRIMESTRE, ID_FICHA);

      expect(rapTrimestreRepository.upsertAsignacion).toHaveBeenCalledWith(
        connection,
        expect.objectContaining({
          horasTrimestre: esperadoUpsert.horasTrimestre,
          horasSemana: esperadoUpsert.horasSemana,
        }),
      );
      expect(esperadoUpsert.horasTrimestre).toBe(40);
      expect(esperadoUpsert.horasSemana).toBeCloseTo(40 / 11);
    });

    it('lanza AppError 422 si el RAP no tiene competencia asociada', async () => {
      const connection = setupMockConnection();
      rapTrimestreRepository.getCompetenciaDeRap.mockResolvedValue(null);

      await expect(
        planeacionService.asignarRapTrimestre(ID_RAP, ID_TRIMESTRE, ID_FICHA),
      ).rejects.toMatchObject({
        statusCode: 422,
        message: 'El RAP no tiene competencia asociada',
        code: 'RAP_SIN_COMPETENCIA',
        isOperational: true,
      });

      expect(connection.rollback).toHaveBeenCalled();
      expect(rapTrimestreRepository.upsertAsignacion).not.toHaveBeenCalled();
    });

    it('respeta move=true eliminando otras asignaciones en la ficha', async () => {
      setupMockConnection();
      mockCompetenciaBase();
      rapTrimestreRepository.contarTrimestresDeRap.mockResolvedValue(1);

      await planeacionService.asignarRapTrimestre(ID_RAP, ID_TRIMESTRE, ID_FICHA, true);

      expect(rapTrimestreRepository.deleteOtherAsignacionesEnFicha).toHaveBeenCalledWith(
        expect.any(Object),
        ID_RAP,
        ID_FICHA,
        ID_TRIMESTRE,
      );
    });
  });

  describe('recalcularHorasRap', () => {
    it('trata nº_trimestres = 0 como 1 al recalcular (borde SP)', async () => {
      const connection = setupMockConnection();
      const duracionMaxima = 100;
      const rapsCompetencia = 2;

      mockCompetenciaBase({ duracionMaxima, rapsCompetencia });
      rapTrimestreRepository.contarTrimestresDeRap.mockResolvedValue(0);

      const esperado = formulaSena(duracionMaxima, rapsCompetencia, 0);

      await planeacionService.recalcularHorasRap(ID_RAP, ID_FICHA);

      expect(rapTrimestreRepository.updateHoras).toHaveBeenCalledWith(
        connection,
        ID_RAP,
        ID_FICHA,
        esperado.horasTrimestre,
        esperado.horasSemana,
      );
      expect(esperado.horasTrimestre).toBe(50);
      expect(esperado.horasSemana).toBeCloseTo(50 / 11);
    });
  });

  describe('quitarRapTrimestre', () => {
    it('borra la asignación y recalcula horas en la ficha', async () => {
      const connection = setupMockConnection();
      const duracionMaxima = 330;
      const rapsCompetencia = 3;
      const trimestresRestantes = 1;

      mockCompetenciaBase({ duracionMaxima, rapsCompetencia });
      rapTrimestreRepository.contarTrimestresDeRap.mockResolvedValue(trimestresRestantes);

      const esperado = formulaSena(duracionMaxima, rapsCompetencia, trimestresRestantes);

      const result = await planeacionService.quitarRapTrimestre(ID_RAP, ID_TRIMESTRE, ID_FICHA);

      expect(result).toBe(true);
      expect(rapTrimestreRepository.deleteAsignacion).toHaveBeenCalledWith(
        connection,
        ID_RAP,
        ID_TRIMESTRE,
        ID_FICHA,
      );
      expect(rapTrimestreRepository.updateHoras).toHaveBeenCalledWith(
        connection,
        ID_RAP,
        ID_FICHA,
        esperado.horasTrimestre,
        esperado.horasSemana,
      );
      expect(esperado.horasTrimestre).toBe(110);
      expect(esperado.horasSemana).toBe(10);
    });
  });
});
