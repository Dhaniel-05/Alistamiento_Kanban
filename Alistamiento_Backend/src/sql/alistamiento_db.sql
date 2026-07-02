CREATE DATABASE alistamiento_db;
USE alistamiento_db;

CREATE TABLE negocio (
    id_negocio INT AUTO_INCREMENT PRIMARY KEY,
    razon_social VARCHAR(100),
    logo LONGBLOB,
    descripcion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion VARCHAR(255),
    redes_sociales VARCHAR(255), -- {facebook: "url", instagram: "url", etc}
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla para códigos de verificación temporales
CREATE TABLE codigos_verificacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255),
    codigo VARCHAR(6),
    token VARCHAR(255) NULL,
    usado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE carrusel_banner (
    id_promocion INT NOT NULL AUTO_INCREMENT primary key,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    imagen LONGBLOB,
    fecha_inicio DATE,
    fecha_fin DATE,
    posicion_texto VARCHAR(50) DEFAULT 'centro',
    estado ENUM('activa', 'inactiva') DEFAULT 'activa',
    id_usuario INT,
    foreign key (id_usuario) references usuarios(id_usuario)
);

-- Tablas del sistema de usuarios

CREATE TABLE permisos (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,   -- clave de máquina: 'ficha.crear'
    descripcion VARCHAR(255)
);

    CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
    );

    -- Insertar roles iniciales
    INSERT INTO roles (nombre) VALUES ('Administrador');
    INSERT INTO roles (nombre) VALUES ('Instructor');
    INSERT INTO roles (nombre) VALUES ('Gestor');

    CREATE TABLE roles_permisos (
    id_roles_permiso INT AUTO_INCREMENT PRIMARY KEY,
    id_permiso INT NOT NULL,
    id_rol INT NOT NULL,
    CONSTRAINT uq_rol_permiso UNIQUE (id_rol,id_permiso),
    FOREIGN KEY (id_permiso) REFERENCES permisos (id_permiso) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES roles (id_rol) ON DELETE RESTRICT ON UPDATE CASCADE
    );
    
    -- ===== CATÁLOGO DE PERMISOS =====
INSERT INTO permisos (nombre, descripcion) VALUES
('programa.leer',       'Ver programas de formación'),
('programa.crear',      'Crear programas de formación'),
('programa.editar',     'Editar programas de formación'),
('programa.eliminar',   'Eliminar programas de formación'),
('ficha.leer',          'Ver fichas'),
('ficha.crear',         'Crear fichas'),
('ficha.editar',        'Editar fichas'),
('ficha.eliminar',      'Eliminar fichas'),
('instructor.leer',     'Ver instructores'),
('instructor.crear',    'Crear instructores'),
('instructor.editar',   'Editar instructores'),
('instructor.eliminar', 'Eliminar instructores'),
('fase.gestionar',      'Administrar la configuración de fases'),
('permiso.administrar', 'Asignar permisos a roles');

    
-- ===== MAPA ROL -> PERMISO =====
INSERT INTO roles_permisos (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM roles r CROSS JOIN permisos p
WHERE r.nombre='Administrador';

INSERT INTO roles_permisos (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM roles r
JOIN permisos p
ON p.nombre IN ('programa.leer','ficha.leer','ficha.crear','ficha.editar',
'instructor.leer','instructor.crear','instructor.editar','fase.gestionar')
WHERE r.nombre='Gestor';

INSERT INTO roles_permisos (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM roles r
JOIN permisos p
ON p.nombre IN ('programa.leer','ficha.leer','instructor.leer','instructor.editar')
WHERE r.nombre='Instructor';

CREATE TABLE programa_formacion (
    id_programa INT AUTO_INCREMENT PRIMARY KEY,
    codigo_programa VARCHAR(20) UNIQUE,
    nombre_programa TEXT NOT NULL,
    vigencia TEXT,
    tipo_programa VARCHAR(50),
    version_programa VARCHAR(10),
    horas_totales INT,
    horas_etapa_lectiva INT,
    horas_etapa_productiva INT
    );

    CREATE TABLE fichas (
    id_ficha INT AUTO_INCREMENT PRIMARY KEY,
    id_programa INT, -- FK a Programa_formacion
    codigo_ficha VARCHAR(20) UNIQUE,
    modalidad VARCHAR(20),
    jornada ENUM("Diurna","Nocturna"),
    ambiente VARCHAR(10),
    fecha_inicio DATE,
    fecha_final DATE,
    cantidad_trimestre INT,
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa) ON DELETE SET NULL ON UPDATE CASCADE
    );
    
    -- ===== MODELO DE FASES (plantilla + por ficha con bloqueo) =====

-- Plantilla maestra: se copia a cada ficha según su jornada. Editable por admin.
CREATE TABLE fases_configuracion (
    id_fase_config INT AUTO_INCREMENT PRIMARY KEY,
    jornada ENUM('Diurna','Nocturna','Personalizada') NOT NULL,
    nombre_fase VARCHAR(100) NOT NULL,   -- admite sub-etapas: 'Análisis 1', 'Análisis 2'...
    orden INT NOT NULL,
    color VARCHAR(20) DEFAULT '#3B82F6',
    descripcion TEXT,
    activo TINYINT(1) DEFAULT 1,
    UNIQUE KEY jornada_nombre_fase (jornada, nombre_fase)
);

-- Fases concretas de cada ficha = los lanes del tablero. 'estado' permite bloquear.
CREATE TABLE ficha_fases (
    id_ficha_fase INT AUTO_INCREMENT PRIMARY KEY,
    id_ficha INT NOT NULL,
    nombre_fase VARCHAR(100) NOT NULL,
    orden INT NOT NULL,
    color VARCHAR(20) DEFAULT '#3B82F6',
    estado ENUM('Abierta','Bloqueada') DEFAULT 'Abierta',
    activo TINYINT(1) DEFAULT 1,
    UNIQUE KEY ficha_nombre_fase (id_ficha, nombre_fase),
    FOREIGN KEY (id_ficha) REFERENCES fichas (id_ficha) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Semilla inicial (punto de partida; luego se edita desde el panel admin).
-- 4 fases SENA subdivididas, para Diurna y Nocturna.
INSERT INTO fases_configuracion (jornada, nombre_fase, orden, color) VALUES
('Diurna','Análisis 1',1,'#3B82F6'),
('Diurna','Análisis 2',2,'#3B82F6'),
('Diurna','Planeación 1',3,'#F59E0B'),
('Diurna','Planeación 2',4,'#F59E0B'),
('Diurna','Ejecución 1',5,'#10B981'),
('Diurna','Ejecución 2',6,'#10B981'),
('Diurna','Evaluación',7,'#8B5CF6'),
('Nocturna','Análisis 1',1,'#3B82F6'),
('Nocturna','Análisis 2',2,'#3B82F6'),
('Nocturna','Planeación 1',3,'#F59E0B'),
('Nocturna','Planeación 2',4,'#F59E0B'),
('Nocturna','Planeación 3',5,'#F59E0B'),
('Nocturna','Ejecución 1',6,'#10B981'),
('Nocturna','Ejecución 2',7,'#10B981'),
('Nocturna','Ejecución 3',8,'#10B981'),
('Nocturna','Evaluación',9,'#8B5CF6');

    CREATE TABLE instructores (
    id_instructor INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT, -- FK a Roles
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    contrasena VARCHAR(200),
    cedula VARCHAR(50) UNIQUE,
    estado ENUM("Activo", "Deshabilitado"),
    primer_acceso TINYINT DEFAULT 1,
    FOREIGN KEY (id_rol) REFERENCES roles (id_rol) ON DELETE SET NULL ON UPDATE CASCADE
    );

    -- Insertar instructor administrador inicial
    INSERT INTO instructores (id_rol, nombre, email, contrasena, cedula, estado)
    VALUES (1, 'Admin', 'administracion@sena.edu.co', '$2b$10$Oe6zbHsOF0L9MUDq7g42UOefv1tcTMLDBaBILVgmhsdBmK74BzQDO', '051184', 'Activo');
    -- contraseña de administracion@sena.edu.co es = Daniel8008

    CREATE TABLE instructor_ficha (
    id_instructor_ficha INT AUTO_INCREMENT PRIMARY KEY,
    id_instructor INT NOT NULL,
    id_ficha INT NOT NULL,
    rol varchar(15),
    FOREIGN KEY (id_instructor) REFERENCES instructores (id_instructor) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_ficha) REFERENCES fichas (id_ficha) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE competencias (
    id_competencia INT AUTO_INCREMENT PRIMARY KEY,
    id_programa INT, -- FK a Programa_formacion
    codigo_norma VARCHAR(30) UNIQUE,
    duracion_maxima INT,
    nombre_competencia TEXT,
    unidad_competencia TEXT,
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa) ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE fases (
    id_fase INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL
    );

    CREATE TABLE proyectos (
    id_proyecto INT AUTO_INCREMENT PRIMARY KEY,
    id_programa INT, -- FK a Programa_formacion
    codigo_proyecto VARCHAR(30),
    nombre_proyecto TEXT,
    codigo_programa VARCHAR(20),
    centro_formacion TEXT,
    regional TEXT,
    FOREIGN KEY (id_programa) REFERENCES programa_formacion (id_programa) ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE trimestre (
    id_trimestre INT AUTO_INCREMENT PRIMARY KEY,
    id_ficha INT, -- FK a fichas
    no_trimestre INT,
    fase VARCHAR(30),
    FOREIGN KEY (id_ficha) REFERENCES fichas (id_ficha) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE planeacion_pedagogica (
    id_planeacion INT AUTO_INCREMENT PRIMARY KEY,
    id_ficha INT,
    id_trimestre INT NULL,
    observaciones TEXT,
    fecha_creacion DATE,
    FOREIGN KEY (id_ficha) REFERENCES fichas(id_ficha) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_trimestre) REFERENCES trimestre(id_trimestre) ON DELETE SET NULL ON UPDATE CASCADE
);

    CREATE TABLE guia_aprendizaje (
    id_guia INT AUTO_INCREMENT PRIMARY KEY,
    id_planeacion INT, -- FK a Planeacion_Pedagogica
    titulo TEXT,
    version VARCHAR(10),
    fecha_creacion DATE,
    FOREIGN KEY (id_planeacion) REFERENCES planeacion_pedagogica (id_planeacion) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE raps (
    id_rap INT AUTO_INCREMENT PRIMARY KEY,
    id_competencia INT,
    denominacion TEXT,
    duracion INT,
    codigo VARCHAR(20),
    UNIQUE KEY uq_rap_competencia_codigo (id_competencia, codigo),
    FOREIGN KEY (id_competencia) REFERENCES competencias (id_competencia) ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE actividades_proyecto (
    id_actividad INT AUTO_INCREMENT PRIMARY KEY,
    fase VARCHAR(100), -- ANALISIS, DESARROLLO, etc.
    nombre_actividad TEXT NOT NULL
    );

    -- Esta tabla relaciona las actividades de proyecto con los RAPs
    CREATE TABLE actividad_rap (
    id_actividad INT,
    id_rap INT,
    PRIMARY KEY (id_actividad, id_rap),
    FOREIGN KEY (id_actividad) REFERENCES actividades_proyecto(id_actividad),
    FOREIGN KEY (id_rap) REFERENCES raps(id_rap)
    );

    CREATE TABLE conocimiento_proceso (
    id_conocimiento_proceso INT AUTO_INCREMENT PRIMARY KEY,
    id_rap INT, -- FK a RAPs
    nombre MEDIUMTEXT NOT NULL,
    FOREIGN KEY (id_rap) REFERENCES raps (id_rap) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE conocimiento_saber (
    id_conocimiento_saber INT AUTO_INCREMENT PRIMARY KEY,
    id_rap INT, -- FK a RAPs
    nombre MEDIUMTEXT NOT NULL,
    FOREIGN KEY (id_rap) REFERENCES raps (id_rap) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE criterios_evaluacion (
    id_criterio_evaluacion INT AUTO_INCREMENT PRIMARY KEY,
    id_rap INT, -- FK a RAPs
    nombre MEDIUMTEXT NOT NULL,
    FOREIGN KEY (id_rap) REFERENCES raps (id_rap) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Sábana de asignación de RAPs a trimestres y fichas
CREATE TABLE rap_trimestre (
    id_rap_trimestre INT AUTO_INCREMENT PRIMARY KEY,
    id_rap INT NOT NULL,
    id_ficha INT NOT NULL,
    id_trimestre INT NOT NULL,
    id_instructor INT NULL,
    horas_trimestre INT NULL,
    horas_semana FLOAT NULL,
    estado ENUM('Planeado', 'En curso', 'Finalizado') DEFAULT 'Planeado',
    instructor_asignado VARCHAR(50) NULL,
    FOREIGN KEY (id_rap) REFERENCES raps(id_rap) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_ficha) REFERENCES fichas(id_ficha) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_trimestre) REFERENCES trimestre(id_trimestre) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_instructor) REFERENCES instructores(id_instructor) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE detalle_planeacion_pedagogica (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_planeacion INT NOT NULL,
    id_rap INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    codigo_rap VARCHAR(20),
    nombre_rap TEXT,
    competencia TEXT,
    horas_trimestre INT,
    -- Datos pedagógicos
    actividades_aprendizaje TEXT,
    duracion_directa INT,
    duracion_independiente INT,
    descripcion_evidencia TEXT,
    estrategias_didacticas VARCHAR(100),
    ambientes_aprendizaje VARCHAR(100),
    materiales_formacion TEXT,
    observaciones TEXT,
    -- Información de saberes y criterios
    saberes_conceptos TEXT,
    saberes_proceso TEXT,
    criterios_evaluacion TEXT,
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_planeacion) REFERENCES planeacion_pedagogica(id_planeacion) ON DELETE CASCADE,
    FOREIGN KEY (id_rap) REFERENCES raps(id_rap) ON DELETE CASCADE
);