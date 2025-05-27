// controllers/reportsController.js
const { Visitor, Floor, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Obtener reporte por fechas
const getReportByDates = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio y fin son obligatorias'
      });
    }

    // Validar que fecha_inicio sea menor que fecha_fin
    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser menor que la fecha de fin'
      });
    }

    const whereClause = {
      fecha: {
        [Op.between]: [fecha_inicio, fecha_fin]
      }
    };

    // Obtener estadísticas generales del período
    const [estadisticasGenerales] = await Visitor.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_registros'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_visitantes'],
        [sequelize.fn('AVG', sequelize.col('cantidad')), 'promedio_visitantes'],
        [sequelize.fn('MIN', sequelize.col('fecha')), 'primera_fecha'],
        [sequelize.fn('MAX', sequelize.col('fecha')), 'ultima_fecha']
      ],
      raw: true
    });

    // Obtener datos por piso
    const datosPorPiso = await Visitor.findAll({
      where: whereClause,
      attributes: [
        'piso_id',
        [sequelize.fn('COUNT', sequelize.col('Visitor.id')), 'registros'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'visitantes'],
        [sequelize.fn('AVG', sequelize.col('cantidad')), 'promedio']
      ],
      include: [{
        model: Floor,
        as: 'piso',
        attributes: ['nombre']
      }],
      group: ['piso_id', 'piso.id', 'piso.nombre'],
      raw: true,
      nest: true
    });

    // Obtener datos por día de la semana
    const datosPorDia = await Visitor.findAll({
      where: whereClause,
      attributes: [
        'dia_semana',
        [sequelize.fn('COUNT', sequelize.col('id')), 'registros'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'visitantes']
      ],
      group: ['dia_semana'],
      order: [
        [sequelize.literal("CASE dia_semana WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7 END"), 'ASC']
      ],
      raw: true
    });

    // Obtener datos por fecha (resumen diario)
    const datosPorFecha = await Visitor.findAll({
      where: whereClause,
      attributes: [
        'fecha',
        'dia_semana',
        [sequelize.fn('COUNT', sequelize.col('id')), 'registros'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'visitantes']
      ],
      group: ['fecha', 'dia_semana'],
      order: [['fecha', 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        periodo: {
          fecha_inicio,
          fecha_fin
        },
        resumen: {
          total_registros: parseInt(estadisticasGenerales.total_registros || 0),
          total_visitantes: parseInt(estadisticasGenerales.total_visitantes || 0),
          promedio_visitantes: parseFloat(estadisticasGenerales.promedio_visitantes || 0).toFixed(2),
          primera_fecha: estadisticasGenerales.primera_fecha,
          ultima_fecha: estadisticasGenerales.ultima_fecha
        },
        por_piso: datosPorPiso,
        por_dia_semana: datosPorDia,
        por_fecha: datosPorFecha
      }
    });

  } catch (error) {
    console.error('Error al generar reporte por fechas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener reporte mensual
const getMonthlyReport = async (req, res) => {
  try {
    const { año, mes } = req.query;

    if (!año || !mes) {
      return res.status(400).json({
        success: false,
        message: 'Año y mes son obligatorios'
      });
    }

    // Calcular fechas del mes
    const fechaInicio = new Date(año, mes - 1, 1).toISOString().split('T')[0];
    const fechaFin = new Date(año, mes, 0).toISOString().split('T')[0];

    const whereClause = {
      fecha: {
        [Op.between]: [fechaInicio, fechaFin]
      }
    };

    // Reutilizar la lógica del reporte por fechas
    req.query.fecha_inicio = fechaInicio;
    req.query.fecha_fin = fechaFin;
    
    return getReportByDates(req, res);

  } catch (error) {
    console.error('Error al generar reporte mensual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener reporte por piso específico
const getReportByFloor = async (req, res) => {
  try {
    const { piso_id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    // Verificar que el piso existe
    const piso = await Floor.findByPk(piso_id);
    if (!piso) {
      return res.status(404).json({
        success: false,
        message: 'Piso no encontrado'
      });
    }

    const whereClause = { piso_id };
    
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    // Estadísticas del piso
    const [estadisticas] = await Visitor.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_registros'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_visitantes'],
        [sequelize.fn('AVG', sequelize.col('cantidad')), 'promedio_visitantes'],
        [sequelize.fn('MIN', sequelize.col('fecha')), 'primera_visita'],
        [sequelize.fn('MAX', sequelize.col('fecha')), 'ultima_visita']
      ],
      raw: true
    });

    // Datos por día de la semana para este piso
    const datosPorDia = await Visitor.findAll({
      where: whereClause,
      attributes: [
        'dia_semana',
        [sequelize.fn('COUNT', sequelize.col('id')), 'registros'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'visitantes']
      ],
      group: ['dia_semana'],
      order: [
        [sequelize.literal("CASE dia_semana WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7 END"), 'ASC']
      ],
      raw: true
    });

    // Registros detallados (últimos 50)
    const registrosDetalle = await Visitor.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['nombre']
      }],
      order: [['fecha', 'DESC'], ['hora', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      data: {
        piso: {
          id: piso.id,
          nombre: piso.nombre,
          descripcion: piso.descripcion
        },
        periodo: {
          fecha_inicio: fecha_inicio || 'Todos los registros',
          fecha_fin: fecha_fin || 'Todos los registros'
        },
        estadisticas: {
          total_registros: parseInt(estadisticas.total_registros || 0),
          total_visitantes: parseInt(estadisticas.total_visitantes || 0),
          promedio_visitantes: parseFloat(estadisticas.promedio_visitantes || 0).toFixed(2),
          primera_visita: estadisticas.primera_visita,
          ultima_visita: estadisticas.ultima_visita
        },
        por_dia_semana: datosPorDia,
        registros_detalle: registrosDetalle
      }
    });

  } catch (error) {
    console.error('Error al generar reporte por piso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener datos para exportar a Excel
const getExportData = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      piso_id,
      formato = 'completo' // 'completo' o 'resumen'
    } = req.query;

    const whereClause = {};
    
    if (piso_id) whereClause.piso_id = piso_id;
    
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    if (formato === 'completo') {
      // Exportar datos completos
      const visitantes = await Visitor.findAll({
        where: whereClause,
        include: [
          {
            model: Floor,
            as: 'piso',
            attributes: ['nombre']
          },
          {
            model: User,
            as: 'usuario',
            attributes: ['nombre']
          }
        ],
        order: [['fecha', 'DESC'], ['hora', 'DESC']],
        limit: 10000 // Límite de seguridad
      });

      // Formatear datos para Excel
      const datosExcel = visitantes.map(v => ({
        'Fecha': v.fecha,
        'Hora': v.hora,
        'Día de la Semana': v.dia_semana,
        'Piso': v.piso?.nombre || 'N/A',
        'Cantidad de Visitantes': v.cantidad,
        'Registrado por': v.usuario?.nombre || 'N/A',
        'Observaciones': v.observaciones || '',
        'Fecha de Registro': new Date(v.created_at).toLocaleString('es-ES')
      }));

      res.json({
        success: true,
        data: {
          tipo: 'completo',
          registros: datosExcel,
          total: datosExcel.length
        }
      });

    } else {
      // Exportar resumen
      const resumenPorPiso = await Visitor.findAll({
        where: whereClause,
        attributes: [
          'piso_id',
          [sequelize.fn('COUNT', sequelize.col('Visitor.id')), 'total_registros'],
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_visitantes'],
          [sequelize.fn('AVG', sequelize.col('cantidad')), 'promedio_visitantes']
        ],
        include: [{
          model: Floor,
          as: 'piso',
          attributes: ['nombre']
        }],
        group: ['piso_id', 'piso.id', 'piso.nombre'],
        raw: true,
        nest: true
      });

      const datosResumen = resumenPorPiso.map(r => ({
        'Piso': r.piso?.nombre || 'N/A',
        'Total Registros': parseInt(r.total_registros),
        'Total Visitantes': parseInt(r.total_visitantes),
        'Promedio por Registro': parseFloat(r.promedio_visitantes).toFixed(2)
      }));

      res.json({
        success: true,
        data: {
          tipo: 'resumen',
          registros: datosResumen,
          total: datosResumen.length
        }
      });
    }

  } catch (error) {
    console.error('Error al obtener datos de exportación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener dashboard con estadísticas principales
const getDashboard = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Estadísticas generales
    const estadisticasGenerales = await Visitor.getEstadisticasGenerales();

    // Datos para gráficas
    const [dataPorPiso, dataPorDia] = await Promise.all([
      Visitor.getDataByPiso(),
      Visitor.getDataByDiaSemana()
    ]);

    // Tendencia de los últimos 7 días
    const tendenciaSemanal = await Visitor.findAll({
      where: {
        fecha: {
          [Op.gte]: hace7Dias
        }
      },
      attributes: [
        'fecha',
        [sequelize.fn('COUNT', sequelize.col('id')), 'registros'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'visitantes']
      ],
      group: ['fecha'],
      order: [['fecha', 'ASC']],
      raw: true
    });

    // Piso más visitado hoy
    const pisoMasVisitadoHoy = await Visitor.findAll({
      where: { fecha: hoy },
      attributes: [
        'piso_id',
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'visitantes']
      ],
      include: [{
        model: Floor,
        as: 'piso',
        attributes: ['nombre']
      }],
      group: ['piso_id', 'piso.id', 'piso.nombre'],
      order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
      limit: 1,
      raw: true,
      nest: true
    });

    // Registros recientes
    const registrosRecientes = await Visitor.findAll({
      include: [
        {
          model: Floor,
          as: 'piso',
          attributes: ['nombre']
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['nombre']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        estadisticas: estadisticasGenerales,
        graficas: {
          por_piso: dataPorPiso,
          por_dia_semana: dataPorDia,
          tendencia_semanal: tendenciaSemanal
        },
        destacados: {
          piso_mas_visitado_hoy: pisoMasVisitadoHoy[0] || null,
          registros_recientes: registrosRecientes
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getReportByDates,
  getMonthlyReport,
  getReportByFloor,
  getExportData,
  getDashboard
};