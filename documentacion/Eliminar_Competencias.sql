use alistamiento;
-- Este comando es para eliminar los programas y sus dependencias asociadas.
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE alistamiento.resultado_de_aprendizaje;          -- Trimestres independientes
TRUNCATE TABLE alistamiento.competencias;
TRUNCATE TABLE alistamiento.programa_formativo;
TRUNCATE TABLE alistamiento.proyecto_formativo;

SET FOREIGN_KEY_CHECKS = 1;