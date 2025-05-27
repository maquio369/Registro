// routes/index.js
const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('./auth');
const visitorsRoutes = require('./visitors');
const reportsRoutes = require('./reports');
const configRoutes = require('./config');

// Ruta de bienvenida/health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Control de Visitantes - Gobierno de Chiapas',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      visitors: '/api/visitors',
      reports: '/api/reports',
      config: '/api/config'
    }
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Configurar rutas principales
router.use('/auth', authRoutes);
router.use('/visitors', visitorsRoutes);
router.use('/reports', reportsRoutes);
router.use('/config', configRoutes);

// Ruta para documentación de la API (simple)
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Documentación de la API',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Iniciar sesión',
        'POST /api/auth/register': 'Registrar usuario (admin)',
        'GET /api/auth/profile': 'Obtener perfil',
        'PUT /api/auth/profile': 'Actualizar perfil',
        'PUT /api/auth/change-password': 'Cambiar contraseña',
        'GET /api/auth/verify': 'Verificar token'
      },
      visitors: {
        'POST /api/visitors': 'Crear registro de visitante',
        'GET /api/visitors': 'Obtener registros (con filtros)',
        'GET /api/visitors/estadisticas': 'Estadísticas generales',
        'GET /api/visitors/chart-data': 'Datos para gráficas',
        'GET /api/visitors/:id': 'Obtener registro por ID',
        'PUT /api/visitors/:id': 'Actualizar registro',
        'DELETE /api/visitors/:id': 'Eliminar registro'
      },
      reports: {
        'GET /api/reports/dashboard': 'Dashboard principal',
        'GET /api/reports/by-dates': 'Reporte por fechas',
        'GET /api/reports/monthly': 'Reporte mensual',
        'GET /api/reports/by-floor/:id': 'Reporte por piso',
        'GET /api/reports/export': 'Datos para exportar'
      },
      config: {
        'GET /api/config/system': 'Configuración del sistema',
        'GET /api/config/system-info': 'Información del sistema',
        'GET /api/config/floors': 'Obtener pisos',
        'POST /api/config/floors': 'Crear piso (admin)',
        'PUT /api/config/floors/:id': 'Actualizar piso (admin)',
        'DELETE /api/config/floors/:id': 'Eliminar piso (admin)'
      }
    },
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      login_endpoint: '/api/auth/login'
    }
  });
});

module.exports = router;