// routes/config.js
const express = require('express');
const router = express.Router();

// Importar controladores
const {
  getSystemConfig,
  updateConfig,
  getAllConfigs,
  getSystemInfo,
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  getFloorStats
} = require('../controllers/configController');

// Importar middleware
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validateFloor, validateDateRange } = require('../middleware/validation');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// ===== RUTAS DE CONFIGURACIÓN GENERAL =====

// @route   GET /api/config/system
// @desc    Obtener configuraciones básicas del sistema (público para usuarios autenticados)
// @access  Private
router.get('/system', getSystemConfig);

// @route   GET /api/config/system-info
// @desc    Obtener información completa del sistema
// @access  Private
router.get('/system-info', getSystemInfo);

// @route   GET /api/config/all
// @desc    Obtener todas las configuraciones (solo admin)
// @access  Private (Admin)
router.get('/all', requireAdmin, getAllConfigs);

// @route   PUT /api/config/update
// @desc    Actualizar configuración específica (solo admin)
// @access  Private (Admin)
router.put('/update', requireAdmin, (req, res, next) => {
  const { clave, valor } = req.body;
  
  if (!clave || !valor) {
    return res.status(400).json({
      success: false,
      message: 'Clave y valor son obligatorios'
    });
  }
  
  next();
}, updateConfig);

// ===== RUTAS DE GESTIÓN DE PISOS =====

// @route   GET /api/config/floors
// @desc    Obtener todos los pisos
// @access  Private
// Query params: incluir_inactivos (boolean)
router.get('/floors', getFloors);

// @route   POST /api/config/floors
// @desc    Crear nuevo piso (solo admin)
// @access  Private (Admin)
router.post('/floors', requireAdmin, validateFloor, createFloor);

// @route   GET /api/config/floors/:id/stats
// @desc    Obtener estadísticas de un piso específico
// @access  Private
// Query params: fecha_inicio, fecha_fin
router.get('/floors/:id/stats', (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: 'ID de piso inválido'
    });
  }
  
  next();
}, validateDateRange, getFloorStats);

// @route   PUT /api/config/floors/:id
// @desc    Actualizar piso (solo admin)
// @access  Private (Admin)
router.put('/floors/:id', requireAdmin, (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: 'ID de piso inválido'
    });
  }
  
  next();
}, validateFloor, updateFloor);

// @route   DELETE /api/config/floors/:id
// @desc    Eliminar (desactivar) piso (solo admin)
// @access  Private (Admin)
router.delete('/floors/:id', requireAdmin, (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: 'ID de piso inválido'
    });
  }
  
  next();
}, deleteFloor);

module.exports = router;