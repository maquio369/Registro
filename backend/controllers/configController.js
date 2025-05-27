// controllers/configController.js
const { Config, Floor } = require('../models');

// Obtener todas las configuraciones del sistema
const getSystemConfig = async (req, res) => {
  try {
    const configuraciones = await Config.getSystemConfig();

    res.json({
      success: true,
      data: configuraciones
    });

  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar configuración específica
const updateConfig = async (req, res) => {
  try {
    const { clave, valor, descripcion } = req.body;

    // Verificar permisos de admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden modificar configuraciones'
      });
    }

    if (!clave || !valor) {
      return res.status(400).json({
        success: false,
        message: 'Clave y valor son obligatorios'
      });
    }

    const config = await Config.setByKey(clave, valor, descripcion);

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: config
    });

  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todas las configuraciones (solo admin)
const getAllConfigs = async (req, res) => {
  try {
    // Verificar permisos de admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden ver todas las configuraciones'
      });
    }

    const configuraciones = await Config.findAll({
      order: [['clave', 'ASC']]
    });

    res.json({
      success: true,
      data: configuraciones
    });

  } catch (error) {
    console.error('Error al obtener todas las configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener información general del sistema
const getSystemInfo = async (req, res) => {
  try {
    const [configuraciones, totalPisos, pisosActivos] = await Promise.all([
      Config.getSystemConfig(),
      Floor.count(),
      Floor.count({ where: { activo: true } })
    ]);

    // Información adicional del sistema
    const systemInfo = {
      ...configuraciones,
      estadisticas_pisos: {
        total: totalPisos,
        activos: pisosActivos,
        inactivos: totalPisos - pisosActivos
      },
      servidor: {
        nodejs_version: process.version,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: systemInfo
    });

  } catch (error) {
    console.error('Error al obtener información del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Gestión de pisos - Obtener todos los pisos
const getFloors = async (req, res) => {
  try {
    const { incluir_inactivos = false } = req.query;
    
    const whereClause = {};
    if (!incluir_inactivos || incluir_inactivos === 'false') {
      whereClause.activo = true;
    }

    const pisos = await Floor.findAll({
      where: whereClause,
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: pisos
    });

  } catch (error) {
    console.error('Error al obtener pisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Gestión de pisos - Crear nuevo piso
const createFloor = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Verificar permisos de admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden crear pisos'
      });
    }

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del piso es obligatorio'
      });
    }

    const nuevoPiso = await Floor.create({
      nombre,
      descripcion
    });

    res.status(201).json({
      success: true,
      message: 'Piso creado exitosamente',
      data: nuevoPiso
    });

  } catch (error) {
    console.error('Error al crear piso:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors.map(err => err.message)
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un piso con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Gestión de pisos - Actualizar piso
const updateFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    // Verificar permisos de admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden modificar pisos'
      });
    }

    const piso = await Floor.findByPk(id);
    
    if (!piso) {
      return res.status(404).json({
        success: false,
        message: 'Piso no encontrado'
      });
    }

    // Actualizar campos
    if (nombre) piso.nombre = nombre;
    if (descripcion !== undefined) piso.descripcion = descripcion;
    if (activo !== undefined) piso.activo = activo;

    await piso.save();

    res.json({
      success: true,
      message: 'Piso actualizado exitosamente',
      data: piso
    });

  } catch (error) {
    console.error('Error al actualizar piso:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Gestión de pisos - Eliminar piso (desactivar)
const deleteFloor = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar permisos de admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden eliminar pisos'
      });
    }

    const piso = await Floor.findByPk(id);
    
    if (!piso) {
      return res.status(404).json({
        success: false,
        message: 'Piso no encontrado'
      });
    }

    // En lugar de eliminar, desactivamos el piso
    piso.activo = false;
    await piso.save();

    res.json({
      success: true,
      message: 'Piso desactivado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar piso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de un piso específico
const getFloorStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    const piso = await Floor.findByPk(id);
    
    if (!piso) {
      return res.status(404).json({
        success: false,
        message: 'Piso no encontrado'
      });
    }

    const estadisticas = await Floor.getEstadisticas(id, fecha_inicio, fecha_fin);

    res.json({
      success: true,
      data: {
        piso: {
          id: piso.id,
          nombre: piso.nombre,
          descripcion: piso.descripcion
        },
        estadisticas
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del piso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getSystemConfig,
  updateConfig,
  getAllConfigs,
  getSystemInfo,
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  getFloorStats
};