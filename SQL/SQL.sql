-- ====================================================================
-- Mairon Barquero Salazar
-- Carlos Rodriguez Delgado
-- Fabian Alfaro Sandi
-- Justin Estrada Cruz
-- ====================================================================
DROP DATABASE IF EXISTS SGID_LogiChain;
CREATE DATABASE SGID_LogiChain;
USE SGID_LogiChain;

-- TABLA: CLIENTES
CREATE TABLE CLIENTES (
    Id_Cliente INT AUTO_INCREMENT,
    Nombre VARCHAR(100) NOT NULL,
    Rol ENUM('origen', 'destino', 'ambos') NOT NULL,
    CONSTRAINT PK_Clientes PRIMARY KEY (Id_Cliente)
);

-- TABLA: PRODUCTOS
CREATE TABLE PRODUCTOS (
    Id_Producto INT AUTO_INCREMENT,
    Codigo VARCHAR(50) NOT NULL UNIQUE,
    Nombre VARCHAR(100) NOT NULL,
    Detalle TEXT,
    Cantidad_Actual INT NOT NULL DEFAULT 0,
    Stock_Critico INT NOT NULL DEFAULT 5,
    Bodega VARCHAR(50) NOT NULL,
    Pasillo VARCHAR(50) NOT NULL,
    Estante VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Productos PRIMARY KEY (Id_Producto)
);

-- TABLA: RECEPCIONES
CREATE TABLE RECEPCIONES (
    Id_Recepcion INT AUTO_INCREMENT,
    Id_Producto INT NOT NULL,
    Id_Cliente INT NOT NULL,
    Numero_Lote VARCHAR(50) NOT NULL,
    Cantidad INT NOT NULL,
    Fecha DATETIME NOT NULL,
    Usuario VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Recepciones PRIMARY KEY (Id_Recepcion),
    CONSTRAINT FK_Recepciones_Productos FOREIGN KEY (Id_Producto) REFERENCES PRODUCTOS(Id_Producto),
    CONSTRAINT FK_Recepciones_Clientes FOREIGN KEY (Id_Cliente) REFERENCES CLIENTES(Id_Cliente)
);

-- TABLA: DESPACHOS
CREATE TABLE DESPACHOS (
    Id_Despacho INT AUTO_INCREMENT,
    Id_Cliente INT NOT NULL,
    Fecha DATETIME NOT NULL,
    Estado ENUM('pendiente', 'procesado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    Operario VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Despachos PRIMARY KEY (Id_Despacho),
    CONSTRAINT FK_Despachos_Clientes FOREIGN KEY (Id_Cliente) REFERENCES CLIENTES(Id_Cliente)
);

-- TABLA: DETALLE_DESPACHOS
CREATE TABLE DETALLE_DESPACHOS (
    Id_Detalle INT AUTO_INCREMENT,
    Id_Despacho INT NOT NULL,
    Id_Producto INT NOT NULL,
    Cantidad INT NOT NULL,
    CONSTRAINT PK_DetalleDespachos PRIMARY KEY (Id_Detalle),
    CONSTRAINT FK_Detalle_Despachos FOREIGN KEY (Id_Despacho) REFERENCES DESPACHOS(Id_Despacho),
    CONSTRAINT FK_Detalle_Productos FOREIGN KEY (Id_Producto) REFERENCES PRODUCTOS(Id_Producto)
);

-- TABLA: TEMPORAL_CARRO_COMPRAS
CREATE TABLE TEMPORAL_CARRO_COMPRAS (
    Usuario VARCHAR(50) NOT NULL,
    Id_Producto INT NOT NULL,
    Cantidad INT NOT NULL,
    CONSTRAINT PK_TemporalCarro PRIMARY KEY (Usuario, Id_Producto),
    CONSTRAINT FK_Carro_Productos FOREIGN KEY (Id_Producto) REFERENCES PRODUCTOS(Id_Producto)
);

-- TABLA: AUDITORIA_PRODUCTOS
CREATE TABLE AUDITORIA_PRODUCTOS (
    Id_Auditoria INT AUTO_INCREMENT,
    Id_Producto INT NOT NULL,
    Fecha DATETIME NOT NULL,
    Cantidad_Anterior INT NOT NULL,
    Nueva_Cantidad INT NOT NULL,
    Usuario VARCHAR(50) NOT NULL,
    CONSTRAINT PK_AuditoriaProductos PRIMARY KEY (Id_Auditoria)
);

-- --------------------------------------------------------------------
-- FUNCIÓN: fn_VerificarAlertaStock
-- --------------------------------------------------------------------
DELIMITER $$
CREATE FUNCTION fn_VerificarAlertaStock(p_Id_Producto INT)
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
    DECLARE v_Stock_Actual INT;
    DECLARE v_Stock_Critico INT;
    DECLARE v_Estado VARCHAR(10);
    
    SELECT Cantidad_Actual, Stock_Critico 
    INTO v_Stock_Actual, v_Stock_Critico
    FROM PRODUCTOS 
    WHERE Id_Producto = p_Id_Producto;
    
    IF v_Stock_Actual <= v_Stock_Critico THEN
        SET v_Estado = 'REORDEN';
    ELSE
        SET v_Estado = 'OK';
    END IF;
    
    RETURN v_Estado;
END$$
DELIMITER ;


-- --------------------------------------------------------------------
-- PROCEDIMIENTO ALMACENADO: sp_RegistrarRecepcion
-- --------------------------------------------------------------------
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_RegistrarRecepcion$$

CREATE PROCEDURE sp_RegistrarRecepcion(
    IN p_Id_Producto INT,
    IN p_Cantidad_Entrante INT,
    IN p_Id_Cliente INT,
    IN p_Numero_Lote VARCHAR(50),
    IN p_Usuario VARCHAR(50) -- <--- Parámetro explícito del operario real
)
BEGIN
    DECLARE v_Rol ENUM('origen', 'destino', 'ambos');
    DECLARE v_Cantidad_Anterior INT;
    
    SELECT Rol INTO v_Rol FROM CLIENTES WHERE Id_Cliente = p_Id_Cliente;
    
    IF v_Rol = 'destino' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Error: El cliente con rol de destino no puede registrar ingresos.';
    ELSE
        START TRANSACTION;
            -- 1. Capturamos el stock actual antes de alterarlo
            SELECT Cantidad_Actual INTO v_Cantidad_Anterior 
            FROM PRODUCTOS 
            WHERE Id_Producto = p_Id_Producto;

            -- 2. Registramos el ingreso de mercancía
            INSERT INTO RECEPCIONES (Id_Producto, Id_Cliente, Numero_Lote, Cantidad, Fecha, Usuario)
            VALUES (p_Id_Producto, p_Id_Cliente, p_Numero_Lote, p_Cantidad_Entrante, NOW(), p_Usuario);
            
            -- 3. Incrementamos el stock físico del producto
            UPDATE PRODUCTOS 
            SET Cantidad_Actual = Cantidad_Actual + p_Cantidad_Entrante
            WHERE Id_Producto = p_Id_Producto;
            
            -- 4. Escribimos explícitamente la auditoría usando los datos locales seguros
            INSERT INTO AUDITORIA_PRODUCTOS (
                Id_Producto, Fecha, Cantidad_Anterior, Nueva_Cantidad, Usuario
            ) VALUES (
                p_Id_Producto, NOW(), v_Cantidad_Anterior, (v_Cantidad_Anterior + p_Cantidad_Entrante), p_Usuario
            );
        COMMIT;
    END IF;
END$$
DELIMITER ;

-- --------------------------------------------------------------------
-- PROCEDIMIENTO ALMACENADO: sp_ProcesarDespacho
-- --------------------------------------------------------------------
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_ProcesarDespacho$$

CREATE PROCEDURE sp_ProcesarDespacho(
    IN p_Id_Despacho INT,
    IN p_Id_Cliente INT,
    IN p_Usuario VARCHAR(50) -- <--- Parámetro explícito del operario real
)
BEGIN
    DECLARE v_Rol ENUM('origen', 'destino', 'ambos');
    DECLARE v_Insuficiente INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        UPDATE DESPACHOS SET Estado = 'cancelado' WHERE Id_Despacho = p_Id_Despacho;
        DELETE FROM TEMPORAL_CARRO_COMPRAS WHERE Usuario = p_Usuario;
        RESIGNAL;
    END;

    SELECT Rol INTO v_Rol FROM CLIENTES WHERE Id_Cliente = p_Id_Cliente;
    IF v_Rol = 'origen' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: El cliente seleccionado no opera como Destino.';
    END IF;

    SELECT COUNT(*) INTO v_Insuficiente
    FROM TEMPORAL_CARRO_COMPRAS t
    JOIN PRODUCTOS p ON t.Id_Producto = p.Id_Producto
    WHERE t.Usuario = p_Usuario AND p.Cantidad_Actual < t.Cantidad;

    IF v_Insuficiente > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Inconsistencia de stock detectada. Despacho Cancelado Automáticamente.';
    ELSE
        START TRANSACTION;
            -- 1. Guardar el detalle físico del despacho
            INSERT INTO DETALLE_DESPACHOS (Id_Despacho, Id_Producto, Cantidad)
            SELECT p_Id_Despacho, Id_Producto, Cantidad
            FROM TEMPORAL_CARRO_COMPRAS
            WHERE Usuario = p_Usuario;
            
            -- 2. AUDITORÍA MASIVA DETERMINÍSTICA:
            -- Seleccionamos el estado actual del stock e inyectamos los registros a auditar de una sola vez
            INSERT INTO AUDITORIA_PRODUCTOS (Id_Producto, Fecha, Cantidad_Anterior, Nueva_Cantidad, Usuario)
            SELECT 
                p.Id_Producto, 
                NOW(), 
                p.Cantidad_Actual, 
                (p.Cantidad_Actual - t.Cantidad), 
                p_Usuario
            FROM PRODUCTOS p
            JOIN TEMPORAL_CARRO_COMPRAS t ON p.Id_Producto = t.Id_Producto
            WHERE t.Usuario = p_Usuario;

            -- 3. Modificación masiva del inventario real
            UPDATE PRODUCTOS p
            JOIN TEMPORAL_CARRO_COMPRAS t ON p.Id_Producto = t.Id_Producto
            SET p.Cantidad_Actual = p.Cantidad_Actual - t.Cantidad
            WHERE t.Usuario = p_Usuario;
            
            -- 4. Finalización del flujo
            UPDATE DESPACHOS SET Estado = 'procesado' WHERE Id_Despacho = p_Id_Despacho;
            DELETE FROM TEMPORAL_CARRO_COMPRAS WHERE Usuario = p_Usuario;
        COMMIT;
    END IF;
END$$
DELIMITER ;

-- --------------------------------------------------------------------
-- PROCEDIMIENTO ALMACENADO: sp_EliminarCliente
-- --------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_EliminarCliente(IN p_Id_Cliente INT)
BEGIN
    DECLARE v_usado INT DEFAULT 0;

    SELECT COUNT(*) INTO v_usado FROM RECEPCIONES WHERE Id_Cliente = p_Id_Cliente;
    IF v_usado > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede eliminar el cliente porque tiene recepciones asociadas.';
    END IF;

    SELECT COUNT(*) INTO v_usado FROM DESPACHOS WHERE Id_Cliente = p_Id_Cliente;
    IF v_usado > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede eliminar el cliente porque tiene despachos asociados.';
    END IF;

    DELETE FROM CLIENTES WHERE Id_Cliente = p_Id_Cliente;
END$$
DELIMITER ;

-- --------------------------------------------------------------------
-- PROCEDIMIENTO ALMACENADO: sp_EliminarProducto
-- --------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_EliminarProducto(IN p_Id_Producto INT)
BEGIN
    DECLARE v_usado INT DEFAULT 0;

    SELECT COUNT(*) INTO v_usado FROM RECEPCIONES WHERE Id_Producto = p_Id_Producto;
    IF v_usado > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede eliminar el producto porque tiene recepciones asociadas.';
    END IF;

    SELECT COUNT(*) INTO v_usado FROM DETALLE_DESPACHOS WHERE Id_Producto = p_Id_Producto;
    IF v_usado > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede eliminar el producto porque tiene despachos asociados.';
    END IF;

    SELECT COUNT(*) INTO v_usado FROM TEMPORAL_CARRO_COMPRAS WHERE Id_Producto = p_Id_Producto;
    IF v_usado > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede eliminar el producto porque está en el carro temporal.';
    END IF;

    DELETE FROM PRODUCTOS WHERE Id_Producto = p_Id_Producto;
END$$
DELIMITER ;

-- --------------------------------------------------------------------
-- PROCEDIMIENTO ALMACENADO: sp_ReporteMovimientosProducto
-- --------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_ReporteMovimientosProducto(
    IN p_CodigoProducto VARCHAR(50),
    IN p_FechaInicio DATETIME,
    IN p_FechaFin DATETIME
)
BEGIN
    IF p_FechaInicio IS NULL THEN
        SET p_FechaInicio = DATE_SUB(NOW(), INTERVAL 1 MONTH);
    END IF;

    IF p_FechaFin IS NULL THEN
        SET p_FechaFin = NOW();
    END IF;

    SELECT *
    FROM (
        SELECT
            p.Codigo AS CodigoProducto,
            p.Nombre AS NombreProducto,
            r.Fecha AS FechaMovimiento,
            'Recepcion' AS TipoMovimiento,
            c.Nombre AS Cliente,
            r.Cantidad AS Cantidad,
            r.Usuario AS Usuario
        FROM RECEPCIONES r
        INNER JOIN PRODUCTOS p ON p.Id_Producto = r.Id_Producto
        INNER JOIN CLIENTES c ON c.Id_Cliente = r.Id_Cliente
        WHERE p.Codigo = p_CodigoProducto
          AND r.Fecha BETWEEN p_FechaInicio AND p_FechaFin

        UNION ALL

        SELECT
            p.Codigo AS CodigoProducto,
            p.Nombre AS NombreProducto,
            d.Fecha AS FechaMovimiento,
            'Despacho' AS TipoMovimiento,
            c.Nombre AS Cliente,
            dd.Cantidad AS Cantidad,
            d.Operario AS Usuario
        FROM DESPACHOS d
        INNER JOIN DETALLE_DESPACHOS dd ON dd.Id_Despacho = d.Id_Despacho
        INNER JOIN PRODUCTOS p ON p.Id_Producto = dd.Id_Producto
        INNER JOIN CLIENTES c ON c.Id_Cliente = d.Id_Cliente
        WHERE p.Codigo = p_CodigoProducto
          AND d.Fecha BETWEEN p_FechaInicio AND p_FechaFin
    ) AS Movimientos
    ORDER BY FechaMovimiento DESC;
END$$
DELIMITER ;

-- --------------------------------------------------------------------
-- PROCEDIMIENTO ALMACENADO: sp_MonitoreoInventarioTiempoReal
-- --------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_MonitoreoInventarioTiempoReal()
BEGIN
    SELECT
        p.Id_Producto,
        p.Codigo,
        p.Nombre,
        p.Detalle,
        p.Cantidad_Actual,
        p.Stock_Critico,
        p.Bodega,
        p.Pasillo,
        p.Estante,
        (SELECT MAX(r.Fecha) FROM RECEPCIONES r WHERE r.Id_Producto = p.Id_Producto) AS UltimoIngreso,
        (SELECT MAX(d.Fecha) FROM DETALLE_DESPACHOS dd INNER JOIN DESPACHOS d ON d.Id_Despacho = dd.Id_Despacho WHERE dd.Id_Producto = p.Id_Producto) AS UltimoDespacho,
        fn_VerificarAlertaStock(p.Id_Producto) AS EstadoStock
    FROM PRODUCTOS p
    ORDER BY p.Nombre ASC;
END$$
DELIMITER ;

-- Índices de Optimización
CREATE INDEX IX_Recepciones_Historico ON RECEPCIONES (Id_Producto, Fecha);
CREATE INDEX IX_Despachos_Filtros ON DESPACHOS (Fecha, Estado);
CREATE INDEX IX_Productos_Busqueda_Codigo ON PRODUCTOS (Codigo);

-- SEGURIDAD: Creación del Rol de Aplicación
CREATE ROLE IF NOT EXISTS 'rol_dba_sgid';

-- Otorgamiento de ejecución estricta sobre TODOS los componentes (Uno por uno)
GRANT EXECUTE ON PROCEDURE SGID_LogiChain.sp_RegistrarRecepcion TO 'rol_dba_sgid';
GRANT EXECUTE ON PROCEDURE SGID_LogiChain.sp_ProcesarDespacho TO 'rol_dba_sgid';
GRANT EXECUTE ON PROCEDURE SGID_LogiChain.sp_EliminarCliente TO 'rol_dba_sgid';
GRANT EXECUTE ON PROCEDURE SGID_LogiChain.sp_EliminarProducto TO 'rol_dba_sgid';
GRANT EXECUTE ON PROCEDURE SGID_LogiChain.sp_ReporteMovimientosProducto TO 'rol_dba_sgid';
GRANT EXECUTE ON PROCEDURE SGID_LogiChain.sp_MonitoreoInventarioTiempoReal TO 'rol_dba_sgid';
GRANT EXECUTE ON FUNCTION SGID_LogiChain.fn_VerificarAlertaStock TO 'rol_dba_sgid';

-- Otorgamiento de CRUD controlado a las tablas para el uso correcto del MVC
GRANT SELECT, INSERT, UPDATE, DELETE ON SGID_LogiChain.TEMPORAL_CARRO_COMPRAS TO 'rol_dba_sgid';
GRANT SELECT, INSERT, UPDATE ON SGID_LogiChain.CLIENTES TO 'rol_dba_sgid';
GRANT SELECT, INSERT, UPDATE ON SGID_LogiChain.PRODUCTOS TO 'rol_dba_sgid';
GRANT SELECT, INSERT ON SGID_LogiChain.DESPACHOS TO 'rol_dba_sgid';
GRANT SELECT ON SGID_LogiChain.AUDITORIA_PRODUCTOS TO 'rol_dba_sgid';
GRANT SELECT ON SGID_LogiChain.RECEPCIONES TO 'rol_dba_sgid';
GRANT SELECT ON SGID_LogiChain.DETALLE_DESPACHOS TO 'rol_dba_sgid';

-- Creación de Usuarios de los Estudiantes
CREATE USER IF NOT EXISTS 'crodriguez'@'%' IDENTIFIED BY 'MiClaveSegura123*';
CREATE USER IF NOT EXISTS 'mbarquero'@'%' IDENTIFIED BY 'MiClaveSegura123*';
CREATE USER IF NOT EXISTS 'falfaro'@'%' IDENTIFIED BY 'MiClaveSegura123*';
CREATE USER IF NOT EXISTS 'jestrada'@'%' IDENTIFIED BY 'MiClaveSegura123*';

-- Asignación de Roles
GRANT 'rol_dba_sgid' TO 'crodriguez'@'%';
GRANT 'rol_dba_sgid' TO 'mbarquero'@'%';
GRANT 'rol_dba_sgid' TO 'falfaro'@'%';
GRANT 'rol_dba_sgid' TO 'jestrada'@'%';

-- Configurar Roles por Defecto
ALTER USER 'crodriguez'@'%' DEFAULT ROLE 'rol_dba_sgid';
ALTER USER 'mbarquero'@'%' DEFAULT ROLE 'rol_dba_sgid';
ALTER USER 'falfaro'@'%'     DEFAULT ROLE 'rol_dba_sgid';
ALTER USER 'jestrada'@'%'    DEFAULT ROLE 'rol_dba_sgid';

-- Aplicar Cambios
FLUSH PRIVILEGES;

-- Datos de prueba iniciales
INSERT INTO CLIENTES (Nombre, Rol) VALUES
('Tech Import S.A.', 'origen'),
('Distribuidora Delta', 'destino'),
('LogiChain Central', 'ambos'),
('Proveedor Nexus', 'origen'),
('Cliente Final UCR', 'destino');

INSERT INTO PRODUCTOS (Codigo, Nombre, Detalle, Cantidad_Actual, Stock_Critico, Bodega, Pasillo, Estante) VALUES
('PRD-001', 'Laptop Lenovo ThinkPad', 'Laptop empresarial', 25, 10, 'B1', 'P1', 'E1'),
('PRD-002', 'Mouse Inalámbrico', 'Mouse USB inalámbrico', 60, 15, 'B1', 'P1', 'E2'),
('PRD-003', 'Teclado Mecánico', 'Teclado mecánico RGB', 40, 12, 'B2', 'P3', 'E4'),
('PRD-004', 'Monitor 24"', 'Monitor Full HD', 18, 8, 'B2', 'P2', 'E3'),
('PRD-005', 'SSD 1TB', 'Unidad de estado sólido', 30, 10, 'B3', 'P1', 'E1');

INSERT INTO RECEPCIONES (Id_Producto, Id_Cliente, Numero_Lote, Cantidad, Fecha, Usuario) VALUES
(1, 1, 'LOT-1001', 5, '2026-06-10 08:30:00', 'crodriguez'),
(2, 4, 'LOT-1002', 20, '2026-06-11 09:10:00', 'mbarquero'),
(3, 1, 'LOT-1003', 10, '2026-06-12 10:00:00', 'falfaro');

UPDATE PRODUCTOS SET Cantidad_Actual = Cantidad_Actual + 5  WHERE Id_Producto = 1;
UPDATE PRODUCTOS SET Cantidad_Actual = Cantidad_Actual + 20 WHERE Id_Producto = 2;
UPDATE PRODUCTOS SET Cantidad_Actual = Cantidad_Actual + 10 WHERE Id_Producto = 3;

INSERT INTO DESPACHOS (Id_Cliente, Fecha, Estado, Operario) VALUES
(2, '2026-06-13 14:00:00', 'pendiente', 'jestrada'),
(5, '2026-06-14 15:20:00', 'procesado', 'crodriguez');

INSERT INTO TEMPORAL_CARRO_COMPRAS (Usuario, Id_Producto, Cantidad) VALUES
('jestrada', 1, 2),
('jestrada', 2, 3),
('jestrada', 3, 1);

INSERT INTO DETALLE_DESPACHOS (Id_Despacho, Id_Producto, Cantidad) VALUES
(2, 1, 2),
(2, 2, 3);

UPDATE PRODUCTOS SET Cantidad_Actual = Cantidad_Actual - 2 WHERE Id_Producto = 1;
UPDATE PRODUCTOS SET Cantidad_Actual = Cantidad_Actual - 3 WHERE Id_Producto = 2;