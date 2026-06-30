const express = require('express');
const RolPermisoController = require('../controllers/roles_permisos.controller');
const autorizarPermiso = require('../middleware/autorizarPermiso');

const router = express.Router();
const rolPermisoController = new RolPermisoController();

const adminPermisos = autorizarPermiso('permiso.administrar');

router.get('/', adminPermisos, (req, res) => rolPermisoController.obtenerRolesPermisos(req, res));
router.get('/rol/:idrol', adminPermisos, (req, res) => rolPermisoController.obtenerPermisosDeRol(req, res));
router.get('/:id', adminPermisos, (req, res) => rolPermisoController.obtenerRolPermisoPorId(req, res));
router.post('/', adminPermisos, (req, res) => rolPermisoController.agregarRolPermiso(req, res));
router.put('/:id', adminPermisos, (req, res) => rolPermisoController.actualizarRolPermiso(req, res));
router.delete('/:id', adminPermisos, (req, res) => rolPermisoController.eliminarRolPermiso(req, res));

module.exports = router;
