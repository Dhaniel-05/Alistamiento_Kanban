const express = require('express');
const RolesController = require('../controllers/roles.controller');
const autorizarPermiso = require('../middleware/autorizarPermiso');

const router = express.Router();
const rolesController = new RolesController();

const adminPermisos = autorizarPermiso('permiso.administrar');

router.get(
  '/asignables',
  autorizarPermiso('instructor.crear', 'instructor.editar'),
  (req, res, next) => rolesController.obtenerRolesAsignables(req, res, next),
);

router.get('/', adminPermisos, (req, res) => rolesController.obtenerRoles(req, res));
router.get('/:id', adminPermisos, (req, res) => rolesController.obtenerRolPorId(req, res));
router.post('/', adminPermisos, (req, res) => rolesController.agregarRol(req, res));
router.put('/:id', adminPermisos, (req, res) => rolesController.actualizarRol(req, res));
router.delete('/:id', adminPermisos, (req, res) => rolesController.eliminarRol(req, res));

module.exports = router;
