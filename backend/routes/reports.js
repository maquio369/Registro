// routes/reports.js
const express = require('express');
const router = express.Router();

// Importar controladores
const {
  getReportByDates,
  getMonthlyReport,
  getReportByFloor,
  getExportData,
  getDashboard
} = require('../controllers/reportsController');

// Importar middleware
const { verifyToken } = require('../middleware/auth');
const { validateDateRange } = require('../middleware/validation');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// @route   GET /api/reports/dashboard
// @desc    Obtener dashboard principal con estadísticas
// @access  Private
router.get('/dashboard', getDashboard);

// @route   GET /api/reports/by-dates
// @desc    Obtener reporte por rango de fechas
// @access  Private
// Query params: fecha_inicio (required), fecha_fin (required)
router.get('/by-dates', validateDateRange, getReportByDates);

// @route   GET /api/reports/monthly
// @desc    Obtener reporte mensual
// @access  Private
// Query params: año (required), mes (required)
router.get('/monthly', (req, res, next) => {
  const { año, mes } = req.query;
  
  if (!año || !mes) {
    return res.status(400).json({
      success: false,
      message: 'Año y mes son obligatorios'
    });
  }
  
  const añoNum = parseInt(año);
  const mesNum = parseInt(mes);
  
  if (isNaN(añoNum) || isNaN(mesNum) || añoNum < 2020 || añoNum > 2030 || mesNum < 1 || mesNum > 12) {
    return res.status(400).json({
      success: false,
      message: 'Año debe estar entre 2020-2030 y mes entre 1-12'
    });
  }
  
  next();
}, getMonthlyReport);

// @route   GET /api/reports/by-floor/:piso_id
// @desc    Obtener reporte por piso específico
// @access  Private
// Query params: fecha_inicio (optional), fecha_fin (optional)
router.get('/by-floor/:piso_id', (req, res, next) => {
  const { piso_id } = req.params;
  
  if (!piso_id || isNaN(parseInt(piso_id))) {
    return res.status(400).json({
      success: false,
      message: 'ID de piso inválido'
    });
  }
  
  next();
}, validateDateRange, getReportByFloor);

// @route   GET /api/reports/export
// @desc    Obtener datos para exportar a Excel
// @access  Private
// Query params: fecha_inicio, fecha_fin, piso_id, formato ('completo' o 'resumen')
router.get('/export', (req, res, next) => {
  const { formato } = req.query;
  
  if (formato && !['completo', 'resumen'].includes(formato)) {
    return res.status(400).json({
      success: false,
      message: 'El formato debe ser "completo" o "resumen"'
    });
  }
  
  next();
}, validateDateRange, getExportData);

module.exports = router;