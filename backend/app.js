// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importar middleware personalizado
const { 
  notFound, 
  errorHandler, 
  requestLogger, 
  validateContentType, 
  sanitizeInput 
} = require('./middleware/errorHandler');

// Importar rutas
const routes = require('./routes');

// Crear aplicación Express
const app = express();

// ===== MIDDLEWARE DE SEGURIDAD =====
// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado para desarrollo
  crossOriginEmbedderPolicy: false
}));

// CORS configurado
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ===== MIDDLEWARE DE LOGGING =====
// Morgan para logging HTTP en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// Request logger personalizado
app.use(requestLogger);

// ===== MIDDLEWARE DE PARSING =====
// Body parser para JSON (con límite de tamaño)
app.use(express.json({ 
  limit: process.env.JSON_LIMIT || '10mb',
  type: 'application/json'
}));

// Body parser para URL encoded
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.URL_LIMIT || '10mb'
}));

// Validar Content-Type
app.use(validateContentType);

// Sanitizar inputs básico
app.use(sanitizeInput);

// ===== MIDDLEWARE DE INFORMACIÓN =====
// Agregar información de la request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  req.ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  next();
});

// ===== RUTAS PRINCIPALES =====
// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏛️ API Control de Visitantes - Gobierno de Chiapas',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    documentation: '/api/docs'
  });
});

// Rutas de la API
app.use('/api', routes);

// ===== MIDDLEWARE DE MANEJO DE ERRORES =====
// Ruta no encontrada (404)
app.use(notFound);

// Manejador global de errores
app.use(errorHandler);

// ===== FUNCIONES AUXILIARES =====
// Función para inicializar la aplicación
const initializeApp = async () => {
  try {
    // Aquí podrías agregar inicializaciones adicionales
    console.log('✅ Aplicación Express inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar aplicación:', error);
    throw error;
  }
};

// Función para manejar el cierre graceful
const gracefulShutdown = (signal) => {
  console.log(`\n📴 Recibida señal ${signal}. Cerrando servidor...`);
  
  // Aquí podrías agregar limpieza de recursos
  // Por ejemplo: cerrar conexiones de base de datos, cancelar jobs, etc.
  
  process.exit(0);
};

// Manejar señales de cierre
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise rechazada no manejada:', reason);
  console.error('En promise:', promise);
  process.exit(1);
});

module.exports = { app, initializeApp };