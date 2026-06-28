-- Rollback: eliminar stored procedures de planeación RAP/trimestre
-- Ejecutar SOLO después de validar paridad con planeacion.service.js en Node.
-- Versionar este archivo en el repositorio (src/db/drop_sabana_procedures.sql).

DROP PROCEDURE IF EXISTS quitar_rap_trimestre;
DROP PROCEDURE IF EXISTS recalcular_horas_rap;
DROP PROCEDURE IF EXISTS asignar_rap_trimestre;
