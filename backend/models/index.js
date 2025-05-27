// models/index.js
const { sequelize } = require('../config/database');
const User = require('/User');
const Floor = require('./Floor');
const Visitor = require('./Visitor');
const Config = require('./Config');

// Definir asociaciones entre modelos
const initializeAssociations = () => {
  // Un usuario puede registrar muchos visitantes
  User.hasMany(Visitor, {
    foreignKey: 'usuario_id',
    as: 'visitantes'
  });

  // Cada registro de visitante pertenece a un usuario
  Visitor.belongsTo(User, {
    foreignKey: 'usuario_id',
    as: 'usuario'
  });

  // Un piso puede tener muchos registros de visitantes
  Floor.hasMany(Visitor, {
    foreignKey: 'piso_id',
    as: 'visitantes'
  });

  // Cada registro de visitante pertenece a un piso
  Visitor.belongsTo(Floor, {
    foreignKey: 'piso_id',
    as: 'piso'
  });

  console.log('✅ Asociaciones de modelos configuradas');
};

// Función para inicializar todos los modelos
const initializeModels = async () => {
  try {
    // Inicializar asociaciones
    initializeAssociations();

    // Sincronizar modelos con la base de datos (sin alterar tablas existentes)
    await sequelize.sync({ alter: false });
    
    console.log('✅ Modelos de Sequelize inicializados correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar modelos:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Floor,
  Visitor,
  Config,
  initializeModels
};