const express = require('express');
const PermisosController = require('../controllers/permisos.controller');
const autorizarRol = require('../middleware/autorizarRol');

const router = express.Router();
const permisosController = new PermisosController();

router.use(autorizarRol('Administrador', 'Gestor'));

router.get('/', (req, res) => permisosController.obtenerPermisos(req, res));
router.get('/:id', (req, res) => permisosController.obtenerPermisoPorId(req, res));
router.post('/', (req, res) => permisosController.agregarPermiso(req, res));
router.put('/:id', (req, res) => permisosController.actualizarPermiso(req, res));
router.delete('/:id', (req, res) => permisosController.eliminarPermiso(req, res));

module.exports = router;
