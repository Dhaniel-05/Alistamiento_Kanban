// src/data/mockData.js
export const mockPlaneacionData = {
  // ❌ ELIMINAMOS las fases
  trimestres: [
    { id: 1, nombre: "Trimestre 1" },
    { id: 2, nombre: "Trimestre 2" },
    { id: 3, nombre: "Trimestre 3" },
    { id: 4, nombre: "Trimestre 4" }
  ],
  
  raps: [
    // ❌ Quitamos fase_id de todos los RAPs
    { id: 1, codigo: "RAP001", nombre: "Analizar requisitos del sistema" },
    { id: 2, codigo: "RAP002", nombre: "Diseñar arquitectura del software" },
    { id: 3, codigo: "RAP003", nombre: "Desarrollar componentes del sistema" },
    { id: 4, codigo: "RAP004", nombre: "Ejecutar pruebas de validación" },
    { id: 5, codigo: "RAP005", nombre: "Implementar solución en producción" }
  ]
};