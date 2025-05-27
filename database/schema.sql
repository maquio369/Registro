-- ESQUEMA DE BASE DE DATOS - CONTROL DE VISITANTES
-- Archivo: schema.sql

-- Tabla de usuarios del sistema
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'operador',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pisos/áreas
CREATE TABLE pisos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de visitantes
CREATE TABLE visitantes (
    id SERIAL PRIMARY KEY,
    piso_id INTEGER REFERENCES pisos(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    dia_semana VARCHAR(20) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración del sistema
CREATE TABLE configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos iniciales
INSERT INTO pisos (nombre, descripcion) VALUES 
('Planta Baja', 'Planta baja del edificio'),
('1er Piso', 'Primer piso del edificio'),
('2do Piso', 'Segundo piso del edificio');

-- Usuario administrador (password: admin123)
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES 
('Administrador', 'admin@chiapas.gob.mx', '$2b$10$XqKtw8YFvbz7zDt7iWzHreRp0wN7AQQKoSJb4KtGJ8zFqNdl8Xt0m', 'admin');

-- Configuraciones iniciales
INSERT INTO configuracion (clave, valor, descripcion) VALUES 
('nombre_institucion', 'Gobierno de Chiapas', 'Nombre de la institución'),
('area_responsable', 'Área de Recursos Materiales y Servicios Generales', 'Área responsable del sistema'),
('version_sistema', '1.0.0', 'Versión actual del sistema');

-- Índices para mejor rendimiento
CREATE INDEX idx_visitantes_fecha ON visitantes(fecha);
CREATE INDEX idx_visitantes_piso ON visitantes(piso_id);
CREATE INDEX idx_visitantes_usuario ON visitantes(usuario_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para auto-actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitantes_updated_at BEFORE UPDATE ON visitantes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vistas para reportes
CREATE VIEW resumen_diario AS
SELECT 
    fecha,
    dia_semana,
    COUNT(*) as total_registros,
    SUM(cantidad) as total_visitantes
FROM visitantes v
JOIN pisos p ON v.piso_id = p.id
GROUP BY fecha, dia_semana
ORDER BY fecha DESC;

CREATE VIEW resumen_por_piso AS
SELECT 
    p.nombre as piso,
    COUNT(*) as total_registros,
    SUM(v.cantidad) as total_visitantes,
    AVG(v.cantidad) as promedio_por_registro
FROM visitantes v
JOIN pisos p ON v.piso_id = p.id
GROUP BY p.id, p.nombre
ORDER BY total_visitantes DESC;