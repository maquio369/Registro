// models/Config.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Config = sequelize.define('Configuracion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clave: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      msg: 'Ya existe una configuración con esta clave'
    },
    validate: {
      notEmpty: {
        msg: 'La clave es obligatoria'
      },
      len: {
        args: [1, 50],
        msg: 'La clave debe tener entre 1 y 50 caracteres'
      }
    }
  },
  valor: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'El valor es obligatorio'
      }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'configuracion',
  timestamps: true,
  createdAt: false, // No necesitamos created_at
  updatedAt: 'updated_at'
});

// Método estático para obtener valor por clave
Config.getByKey = async function(clave) {
  const config = await this.findOne({
    where: { clave }
  });
  return config ? config.valor : null;
};

// Método estático para establecer valor por clave
Config.setByKey = async function(clave, valor, descripcion = null) {
  const [config, created] = await this.findOrCreate({
    where: { clave },
    defaults: { valor, descripcion }
  });
  
  if (!created) {
    config.valor = valor;
    if (descripcion) config.descripcion = descripcion;
    await config.save();
  }
  
  return config;
};

// Método estático para obtener todas las configuraciones como objeto
Config.getAllAsObject = async function() {
  const configs = await this.findAll();
  const result = {};
  
  configs.forEach(config => {
    result[config.clave] = config.valor;
  });
  
  return result;
};

// Método estático para obtener configuraciones del sistema
Config.getSystemConfig = async function() {
  const keys = [
    'nombre_institucion',
    'area_responsable', 
    'version_sistema',
    'backup_automatico'
  ];
  
  const configs = await this.findAll({
    where: {
      clave: keys
    }
  });
  
  const result = {};
  configs.forEach(config => {
    result[config.clave] = config.valor;
  });
  
  return result;
};

module.exports = Config;