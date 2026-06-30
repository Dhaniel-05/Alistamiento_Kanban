const express = require('express');
const PermisosController = require('../controllers/permisos.controller');
const autorizarPermiso = require('../middleware/autorizarPermiso');

const router = express.Router();
const permisosController = new PermisosController();

const adminPermisos = autorizarPermiso('permiso.administrar');

router.get('/', adminPermisos, (req, res) => permisosController.obtenerPermisos(req, res));
router.get('/:id', adminPermisos, (req, res) => permisosController.obtenerPermisoPorId(req, res));
router.post('/', adminPermisos, (req, res) => permisosController.agregarPermiso(req, res));
router.put('/:id', adminPermisos, (req, res) => permisosController.actualizarPermiso(req, res));
router.delete('/:id', adminPermisos, (req, res) => permisosController.eliminarPermiso(req, res));

module.exports = router;
