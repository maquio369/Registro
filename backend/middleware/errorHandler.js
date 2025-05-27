// middleware/errorHandler.js

// Middleware para manejar errores 404 (rutas no encontradas)
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware principal para manejo de errores
const errorHandler = (err, req, res, next) => {
  // Si no hay código de estado, usar 500 (Error interno del servidor)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Log del error para debugging
  console.error('Error capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user.id : 'No autenticado',
    timestamp: new Date().toISOString()
  });

  // Manejar errores específicos de Sequelize
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Datos de validación incorrectos';
    const errors = err.errors.map(error => error.message);
    
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'Ya existe un registro con estos datos';
    
    return res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Referencia inválida a otro registro';
    
    return res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  if (err.name === 'SequelizeConnectionError') {
    statusCode = 503;
    message = 'Error de conexión con la base de datos';
    
    return res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Manejar errores de JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token de acceso inválido';
    
    return res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token de acceso expirado';
    
    return res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Manejar errores de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Formato JSON inválido';
    
    return res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Manejar errores de validación de Mongoose (si usáramos MongoDB)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Datos de validación incorrectos';
    const errors = Object.values(err.errors).map(val => val.message);
    
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Manejar errores de casting (tipos de datos incorrectos)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Formato de datos incorrecto';
    
    return res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Error genérico
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err 
    })
  });
};

// Middleware para logging de requests (opcional)
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log cuando termina la respuesta
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user ? req.user.id : 'No autenticado',
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

// Middleware para validar Content-Type en requests con body
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type debe ser application/json'
      });
    }
  }
  
  next();
};

// Middleware para sanitizar inputs (básico)
const sanitizeInput = (req, res, next) => {
  // Función recursiva para limpiar strings
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remover caracteres peligrosos básicos
      return obj.trim().replace(/[<>]/g, '');
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

module.exports = {
  notFound,
  errorHandler,
  requestLogger,
  validateContentType,
  sanitizeInput
};