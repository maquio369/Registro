// controllers/visitorsController.js
const { Visitor, Floor, User } = require('../models');
const { Op } = require('sequelize');

// Crear nuevo registro de visitante
const createVisitor = async (req, res) => {
  try {
    const { piso_id, cantidad, fecha, hora, observaciones } = req.body;

    // Validar datos requeridos
    if (!piso_id || !cantidad || !fecha || !hora) {
      return res.status(400).json({
        success: false,
        message: 'Piso, cantidad, fecha y hora son obligatorios'
      });
    }

    // Verificar que el piso existe
    const piso = await Floor.findByPk(piso_id);
    if (!piso || !piso.activo) {
      return res.status(400).json({
        success: false,
        message: 'Piso no encontrado o inactivo'
      });
    }

    // Crear registro de visitante
    const visitor = await Visitor.create({
      piso_id,
      cantidad: parseInt(cantidad),
      fecha,
      hora,
      usuario_id: req.user.id,
      observaciones
      // dia_semana se calcula automáticamente en el hook
    });

    // Obtener el registro completo con relaciones
    const visitorCompleto = await Visitor.findByPk(visitor.id, {
      include: [
        {
          model: Floor,
          as: 'piso',
          attributes: ['id', 'nombre']
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Registro de visitante creado exitosamente',
      data: visitorCompleto
    });

  } catch (error) {
    console.error('Error al crear visitante:', error);
    
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

// Obtener todos los registros de visitantes con filtros
const getVisitors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      piso_id,
      fecha_inicio,
      fecha_fin,
      dia_semana,
      usuario_id
    } = req.query;

    // Construir filtros
    const whereClause = {};
    
    if (piso_id) whereClause.piso_id = piso_id;
    if (dia_semana) whereClause.dia_semana = dia_semana;
    if (usuario_id) whereClause.usuario_id = usuario_id;
    
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    } else if (fecha_inicio) {
      whereClause.fecha = {
        [Op.gte]: fecha_inicio
      };
    } else if (fecha_fin) {
      whereClause.fecha = {
        [Op.lte]: fecha_fin
      };
    }

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Obtener registros con paginación
    const { count, rows } = await Visitor.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Floor,
          as: 'piso',
          attributes: ['id', 'nombre']
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre']
        }
      ],
      order: [['fecha', 'DESC'], ['hora', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        visitantes: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener visitantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener un registro de visitante por ID
const getVisitorById = async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findByPk(id, {
      include: [
        {
          model: Floor,
          as: 'piso',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email']
        }
      ]
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Registro de visitante no encontrado'
      });
    }

    res.json({
      success: true,
      data: visitor
    });

  } catch (error) {
    console.error('Error al obtener visitante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar registro de visitante
const updateVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { piso_id, cantidad, fecha, hora, observaciones } = req.body;

    const visitor = await Visitor.findByPk(id);
    
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Registro de visitante no encontrado'
      });
    }

    // Verificar permisos (admin o el usuario que creó el registro)
    if (req.user.rol !== 'admin' && visitor.usuario_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este registro'
      });
    }

    // Verificar piso si se va a cambiar
    if (piso_id && piso_id !== visitor.piso_id) {
      const piso = await Floor.findByPk(piso_id);
      if (!piso || !piso.activo) {
        return res.status(400).json({
          success: false,
          message: 'Piso no encontrado o inactivo'
        });
      }
    }

    // Actualizar campos
    if (piso_id) visitor.piso_id = piso_id;
    if (cantidad) visitor.cantidad = parseInt(cantidad);
    if (fecha) visitor.fecha = fecha;
    if (hora) visitor.hora = hora;
    if (observaciones !== undefined) visitor.observaciones = observaciones;

    await visitor.save();

    // Obtener registro actualizado con relaciones
    const visitorActualizado = await Visitor.findByPk(id, {
      include: [
        {
          model: Floor,
          as: 'piso',
          attributes: ['id', 'nombre']
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Registro actualizado exitosamente',
      data: visitorActualizado
    });

  } catch (error) {
    console.error('Error al actualizar visitante:', error);
    
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

// Eliminar registro de visitante
const deleteVisitor = async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findByPk(id);
    
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Registro de visitante no encontrado'
      });
    }

    // Verificar permisos (admin o el usuario que creó el registro)
    if (req.user.rol !== 'admin' && visitor.usuario_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este registro'
      });
    }

    await visitor.destroy();

    res.json({
      success: true,
      message: 'Registro eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar visitante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas generales
const getEstadisticas = async (req, res) => {
  try {
    const estadisticas = await Visitor.getEstadisticasGenerales();

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener datos para gráficas
const getChartData = async (req, res) => {
  try {
    const [dataPorPiso, dataPorDia] = await Promise.all([
      Visitor.getDataByPiso(),
      Visitor.getDataByDiaSemana()
    ]);

    res.json({
      success: true,
      data: {
        porPiso: dataPorPiso,
        porDiaSemana: dataPorDia
      }
    });

  } catch (error) {
    console.error('Error al obtener datos de gráficas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  createVisitor,
  getVisitors,
  getVisitorById,
  updateVisitor,
  deleteVisitor,
  getEstadisticas,
  getChartData
};