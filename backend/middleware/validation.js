// middleware/validation.js

// Validación para login
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('El email es obligatorio');
  } else if (!isValidEmail(email)) {
    errors.push('El email no tiene un formato válido');
  }

  if (!password) {
    errors.push('La contraseña es obligatoria');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de validación incorrectos',
      errors
    });
  }

  next();
};

// Validación para registro de usuario
const validateUserRegistration = (req, res, next) => {
  const { nombre, email, password, rol } = req.body;
  const errors = [];

  if (!nombre) {
    errors.push('El nombre es obligatorio');
  } else if (nombre.length < 2 || nombre.length > 100) {
    errors.push('El nombre debe tener entre 2 y 100 caracteres');
  }

  if (!email) {
    errors.push('El email es obligatorio');
  } else if (!isValidEmail(email)) {
    errors.push('El email no tiene un formato válido');
  }

  if (!password) {
    errors.push('La contraseña es obligatoria');
  } else if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (rol && !['admin', 'operador'].includes(rol)) {
    errors.push('El rol debe ser admin u operador');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de validación incorrectos',
      errors
    });
  }

  next();
};

// Validación para crear visitante
const validateVisitorCreation = (req, res, next) => {
  const { piso_id, cantidad, fecha, hora } = req.body;
  const errors = [];

  if (!piso_id) {
    errors.push('El piso es obligatorio');
  } else if (!Number.isInteger(parseInt(piso_id)) || parseInt(piso_id) < 1) {
    errors.push('El ID del piso debe ser un número entero positivo');
  }

  if (!cantidad) {
    errors.push('La cantidad de visitantes es obligatoria');
  } else if (!Number.isInteger(parseInt(cantidad)) || parseInt(cantidad) < 1 || parseInt(cantidad) > 1000) {
    errors.push('La cantidad debe ser un número entero entre 1 y 1000');
  }

  if (!fecha) {
    errors.push('La fecha es obligatoria');
  } else if (!isValidDate(fecha)) {
    errors.push('La fecha no tiene un formato válido (YYYY-MM-DD)');
  }

  if (!hora) {
    errors.push('La hora es obligatoria');
  } else if (!isValidTime(hora)) {
    errors.push('La hora no tiene un formato válido (HH:MM)');
  }

  // Validar que la fecha no sea futura
  if (fecha && isValidDate(fecha)) {
    const fechaVisita = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999); // Final del día actual
    
    if (fechaVisita > hoy) {
      errors.push('No se pueden registrar visitantes para fechas futuras');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de validación incorrectos',
      errors
    });
  }

  next();
};

// Validación para actualizar visitante
const validateVisitorUpdate = (req, res, next) => {
  const { piso_id, cantidad, fecha, hora } = req.body;
  const errors = [];

  if (piso_id !== undefined) {
    if (!Number.isInteger(parseInt(piso_id)) || parseInt(piso_id) < 1) {
      errors.push('El ID del piso debe ser un número entero positivo');
    }
  }

  if (cantidad !== undefined) {
    if (!Number.isInteger(parseInt(cantidad)) || parseInt(cantidad) < 1 || parseInt(cantidad) > 1000) {
      errors.push('La cantidad debe ser un número entero entre 1 y 1000');
    }
  }

  if (fecha !== undefined) {
    if (!isValidDate(fecha)) {
      errors.push('La fecha no tiene un formato válido (YYYY-MM-DD)');
    } else {
      // Validar que la fecha no sea futura
      const fechaVisita = new Date(fecha);
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999);
      
      if (fechaVisita > hoy) {
        errors.push('No se pueden registrar visitantes para fechas futuras');
      }
    }
  }

  if (hora !== undefined) {
    if (!isValidTime(hora)) {
      errors.push('La hora no tiene un formato válido (HH:MM)');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de validación incorrectos',
      errors
    });
  }

  next();
};

// Validación para crear/actualizar piso
const validateFloor = (req, res, next) => {
  const { nombre, descripcion } = req.body;
  const errors = [];

  if (!nombre) {
    errors.push('El nombre del piso es obligatorio');
  } else if (nombre.length < 2 || nombre.length > 50) {
    errors.push('El nombre debe tener entre 2 y 50 caracteres');
  }

  if (descripcion && descripcion.length > 500) {
    errors.push('La descripción no puede tener más de 500 caracteres');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de validación incorrectos',
      errors
    });
  }

  next();
};

// Validación para filtros de fecha
const validateDateRange = (req, res, next) => {
  const { fecha_inicio, fecha_fin } = req.query;
  const errors = [];

  if (fecha_inicio && !isValidDate(fecha_inicio)) {
    errors.push('La fecha de inicio no tiene un formato válido (YYYY-MM-DD)');
  }

  if (fecha_fin && !isValidDate(fecha_fin)) {
    errors.push('La fecha de fin no tiene un formato válido (YYYY-MM-DD)');
  }

  if (fecha_inicio && fecha_fin && isValidDate(fecha_inicio) && isValidDate(fecha_fin)) {
    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Parámetros de fecha incorrectos',
      errors
    });
  }

  next();
};

// Validación de paginación
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  const errors = [];

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('La página debe ser un número entero mayor a 0');
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      errors.push('El límite debe ser un número entero entre 1 y 1000');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Parámetros de paginación incorrectos',
      errors
    });
  }

  next();
};

// Funciones auxiliares de validación
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidDate = (dateString) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const isValidTime = (timeString) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

module.exports = {
  validateLogin,
  validateUserRegistration,
  validateVisitorCreation,
  validateVisitorUpdate,
  validateFloor,
  validateDateRange,
  validatePagination
};