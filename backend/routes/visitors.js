// routes/visitors.js
const express = require('express');
const router = express.Router();

// Importar controladores
const {
  createVisitor,
  getVisitors,
  getVisitorById,
  updateVisitor,
  deleteVisitor,
  getEstadisticas,
  getChartData
} = require('../controllers/visitorsController');

// Importar middleware
const { verifyToken } = require('../middleware/auth');
const {
  validateVisitorCreation,
  validateVisitorUpdate,
  validateDateRange,
  validatePagination
} = require('../middleware/validation');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// @route   POST /api/visitors
// @desc    Crear nuevo registro de visitante
// @access  Private
router.post('/', validateVisitorCreation, createVisitor);

// @route   GET /api/visitors
// @desc    Obtener todos los registros de visitantes con filtros
// @access  Private
// Query params: page, limit, piso_id, fecha_inicio, fecha_fin, dia_semana, usuario_id
router.get('/', validatePagination, validateDateRange, getVisitors);

// @route   GET /api/visitors/estadisticas
// @desc    Obtener estadísticas generales
// @access  Private
router.get('/estadisticas', getEstadisticas);

// @route   GET /api/visitors/chart-data
// @desc    Obtener datos para gráficas
// @access  Private
router.get('/chart-data', getChartData);

// @route   GET /api/visitors/:id
// @desc    Obtener un registro de visitante por ID
// @access  Private
router.get('/:id', getVisitorById);

// @route   PUT /api/visitors/:id
// @desc    Actualizar registro de visitante
// @access  Private (Admin o propietario del registro)
router.put('/:id', validateVisitorUpdate, updateVisitor);

// @route   DELETE /api/visitors/:id
// @desc    Eliminar registro de visitante
// @access  Private (Admin o propietario del registro)
router.delete('/:id', deleteVisitor);

module.exports = router;