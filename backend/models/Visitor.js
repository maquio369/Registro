// models/Visitor.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Visitor = sequelize.define('Visitante', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  piso_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'piso_id',
    validate: {
      notNull: {
        msg: 'El piso es obligatorio'
      },
      isInt: {
        msg: 'El ID del piso debe ser un número entero'
      }
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: {
        args: 1,
        msg: 'La cantidad debe ser al menos 1'
      },
      max: {
        args: 1000,
        msg: 'La cantidad no puede ser mayor a 1000'
      },
      isInt: {
        msg: 'La cantidad debe ser un número entero'
      }
    }
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'La fecha es obligatoria'
      },
      isDate: {
        msg: 'Debe ser una fecha válida'
      }
    }
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'La hora es obligatoria'
      }
    }
  },
  dia_semana: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'dia_semana',
    validate: {
      isIn: {
        args: [['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']],
        msg: 'Día de la semana no válido'
      }
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
    validate: {
      notNull: {
        msg: 'El usuario que registra es obligatorio'
      }
    }
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'visitantes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    // Hook para calcular automáticamente el día de la semana
    beforeValidate: (visitor) => {
      if (visitor.fecha && !visitor.dia_semana) {
        const fecha = new Date(visitor.fecha);
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        visitor.dia_semana = dias[fecha.getDay()];
      }
    }
  }
});

// Método estático para obtener estadísticas generales
Visitor.getEstadisticasGenerales = async function() {
  const hoy = new Date().toISOString().split('T')[0];
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [total, hoyStats, mesStats] = await Promise.all([
    // Total general
    this.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'registros'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'visitantes']
      ],
      raw: true
    }),
    // Estadísticas de hoy
    this.findAll({
      where: { fecha: hoy },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'registros'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'visitantes']
      ],
      raw: true
    }),
    // Estadísticas del mes
    this.findAll({
      where: {
        fecha: {
          [sequelize.Op.gte]: inicioMes
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'registros'],
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'visitantes']
      ],
      raw: true
    })
  ]);

  return {
    total: {
      registros: parseInt(total[0]?.registros || 0),
      visitantes: parseInt(total[0]?.visitantes || 0)
    },
    hoy: {
      registros: parseInt(hoyStats[0]?.registros || 0),
      visitantes: parseInt(hoyStats[0]?.visitantes || 0)
    },
    mes: {
      registros: parseInt(mesStats[0]?.registros || 0),
      visitantes: parseInt(mesStats[0]?.visitantes || 0)
    }
  };
};

// Método estático para obtener datos por piso
Visitor.getDataByPiso = async function() {
  const { Floor } = require('./index');
  
  return await this.findAll({
    attributes: [
      'piso_id',
      [sequelize.fn('COUNT', sequelize.col('Visitante.id')), 'registros'],
      [sequelize.fn('SUM', sequelize.col('cantidad')), 'visitantes']
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
};

// Método estático para obtener datos por día de la semana
Visitor.getDataByDiaSemana = async function() {
  return await this.findAll({
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
};

module.exports = Visitor;