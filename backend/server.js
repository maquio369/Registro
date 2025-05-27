// server.js
require('dotenv').config();
const { app, initializeApp } = require('./app');
const { testConnection, syncDatabase } = require('./config/database');
const { initializeModels } = require('./models');

// Configuración del puerto
const PORT = process.env.PORT || 3001;

// Función principal para iniciar el servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor...');
    console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    // 1. Probar conexión a la base de datos
    console.log('🔍 Verificando conexión a PostgreSQL...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // 2. Inicializar modelos de Sequelize
    console.log('🏗️ Inicializando modelos...');
    await initializeModels();

    // 3. Sincronizar base de datos (sin alterar tablas existentes)
    console.log('🔄 Sincronizando base de datos...');
    await syncDatabase();

    // 4. Inicializar aplicación Express
    console.log('⚙️ Inicializando aplicación...');
    await initializeApp();

    // 5. Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log('\n🎉 ===== SERVIDOR INICIADO EXITOSAMENTE =====');
      console.log(`🌐 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`📚 Documentación API: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Base de datos: PostgreSQL (${process.env.DB_NAME})`);
      console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configurado ✅' : 'NO CONFIGURADO ❌'}`);
      console.log(`🌍 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
      console.log('==========================================\n');
      
      // Mostrar rutas disponibles
      console.log('📋 Rutas disponibles:');
      console.log('   GET  /                     - Información general');
      console.log('   GET  /api                  - Información de la API');
      console.log('   GET  /api/docs             - Documentación');
      console.log('   GET  /api/health           - Estado del servidor');
      console.log('   POST /api/auth/login       - Iniciar sesión');
      console.log('   GET  /api/visitors         - Obtener visitantes');
      console.log('   GET  /api/reports/dashboard - Dashboard principal');
      console.log('   GET  /api/config/floors    - Obtener pisos');
      console.log('\n💡 Tip: Usa Postman o Thunder Client para probar la API');
      
      // Información de login por defecto
      console.log('\n🔑 Usuario administrador por defecto:');
      console.log('   Email: admin@chiapas.gob.mx');
      console.log('   Password: admin123');
      console.log('   (Cambia la contraseña después del primer login)\n');
    });

    // Configurar timeout del servidor
    server.timeout = 30000; // 30 segundos

    // Manejar cierre graceful del servidor
    const gracefulShutdown = (signal) => {
      console.log(`\n📴 Recibida señal ${signal}. Cerrando servidor HTTP...`);
      
      server.close(() => {
        console.log('✅ Servidor HTTP cerrado correctamente');
        
        // Cerrar conexión de base de datos
        const { sequelize } = require('./config/database');
        sequelize.close().then(() => {
          console.log('✅ Conexión a base de datos cerrada');
          process.exit(0);
        }).catch((error) => {
          console.error('❌ Error al cerrar base de datos:', error);
          process.exit(1);
        });
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⚠️ Forzando cierre del servidor...');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;

  } catch (error) {
    console.error('\n💥 ===== ERROR AL INICIAR SERVIDOR =====');
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('database') || error.message.includes('PostgreSQL')) {
      console.error('\n🔧 Posibles soluciones:');
      console.error('1. Verificar que PostgreSQL esté corriendo');
      console.error('2. Verificar credenciales en el archivo .env');
      console.error('3. Verificar que la base de datos "control_visitantes" exista');
      console.error('4. Ejecutar: psql -U postgres -c "CREATE DATABASE control_visitantes;"');
    }
    
    if (error.message.includes('EADDRINUSE')) {
      console.error(`\n🔧 El puerto ${PORT} ya está en uso.`);
      console.error('Soluciones:');
      console.error(`1. Cambiar el puerto en .env: PORT=3002`);
      console.error(`2. Matar el proceso: lsof -ti:${PORT} | xargs kill -9`);
    }
    
    console.error('\n📧 Si el problema persiste, revisa la configuración.\n');
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

// Exportar para testing
module.exports = { startServer };