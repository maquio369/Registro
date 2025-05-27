// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware para verificar token JWT
const verifyToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Extraer token (formato: "Bearer TOKEN")
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario en base de datos
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    // Agregar usuario a la request
    req.user = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    };

    next();

  } catch (error) {
    console.error('Error en verificación de token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Permisos de administrador requeridos'
    });
  }

  next();
};

// Middleware para verificar que el usuario sea admin o sea el propietario del recurso
const requireAdminOrOwner = (paramName = 'usuario_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    const resourceUserId = req.params[paramName] || req.body[paramName];
    
    // Si es admin, puede acceder a cualquier recurso
    if (req.user.rol === 'admin') {
      return next();
    }

    // Si no es admin, solo puede acceder a sus propios recursos
    if (parseInt(resourceUserId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // Continuar sin usuario
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(); // Continuar sin usuario
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (user && user.activo) {
      req.user = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      };
    }

    next();

  } catch (error) {
    // En caso de error, simplemente continuar sin usuario
    next();
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireAdminOrOwner,
  optionalAuth
};