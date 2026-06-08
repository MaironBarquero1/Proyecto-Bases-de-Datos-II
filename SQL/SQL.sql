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
-- Propósito: Almacena los clientes de la empresa y sus roles específicos.
CREATE TABLE CLIENTES (
    Id_Cliente INT AUTO_INCREMENT,
    Nombre VARCHAR(100) NOT NULL,
    Rol ENUM('origen', 'destino', 'ambos') NOT NULL,
    CONSTRAINT PK_Clientes PRIMARY KEY (Id_Cliente)
);

-- TABLA: PRODUCTOS
-- Propósito: Almacena el catálogo de productos con su stock y ubicación física.
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
-- Propósito: Control de los productos recibidos en el almacén por lote y operario.
CREATE TABLE RECEPCIONES (
    Id_Recepcion INT AUTO_INCREMENT,
    Id_Producto INT NOT NULL,
    Id_Cliente INT NOT NULL,
    Numero_Lote VARCHAR(50) NOT NULL,
    Cantidad INT NOT NULL,
    Fecha DATETIME NOT NULL, -- Manejo de fechas requerido mediante DATETIME
    Usuario VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Recepciones PRIMARY KEY (Id_Recepcion),
    CONSTRAINT FK_Recepciones_Productos FOREIGN KEY (Id_Producto) REFERENCES PRODUCTOS(Id_Producto),
    CONSTRAINT FK_Recepciones_Clientes FOREIGN KEY (Id_Cliente) REFERENCES CLIENTES(Id_Cliente)
);

-- TABLA: DESPACHOS
-- Propósito: Órdenes de salida de productos (Encabezado del flujo de distribución).
CREATE TABLE DESPACHOS (
    Id_Despacho INT AUTO_INCREMENT,
    Id_Cliente INT NOT NULL,
    Fecha DATETIME NOT NULL, -- Manejo de fechas requerido mediante DATETIME
    Estado ENUM('pendiente', 'procesado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    Operario VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Despachos PRIMARY KEY (Id_Despacho),
    CONSTRAINT FK_Despachos_Clientes FOREIGN KEY (Id_Cliente) REFERENCES CLIENTES(Id_Cliente)
);

-- TABLA: DETALLE_DESPACHOS
-- Propósito: Contiene la lista consolidada de productos de un despacho aceptado.
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
-- Propósito: Tabla intermedia/carro de compras para añadir productos temporalmente 
--            antes de procesar el despacho definitivo de manera atómica.
CREATE TABLE TEMPORAL_CARRO_COMPRAS (
    Usuario VARCHAR(50) NOT NULL,
    Id_Producto INT NOT NULL,
    Cantidad INT NOT NULL,
    CONSTRAINT PK_TemporalCarro PRIMARY KEY (Usuario, Id_Producto),
    CONSTRAINT FK_Carro_Productos FOREIGN KEY (Id_Producto) REFERENCES PRODUCTOS(Id_Producto)
);

-- TABLA: AUDITORIA_PRODUCTOS
-- Propósito: Registra todos los movimientos de cambio de inventario (Bitácora inmutable).
CREATE TABLE AUDITORIA_PRODUCTOS (
    Id_Auditoria INT AUTO_INCREMENT,
    Id_Producto INT NOT NULL,
    Fecha DATETIME NOT NULL, -- Manejo de fechas requerido mediante DATETIME
    Cantidad_Anterior INT NOT NULL,
    Nueva_Cantidad INT NOT NULL,
    Usuario VARCHAR(50) NOT NULL,
    CONSTRAINT PK_AuditoriaProductos PRIMARY KEY (Id_Auditoria)
);

-- --------------------------------------------------------------------
-- FUNCIÓN: fn_VerificarAlertaStock
-- Compara el stock actual contra el stock crítico parametrizado.
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
-- TRIGGER: tg_AuditoriaInventario
-- Trigger AFTER UPDATE en la tabla inventario alimentando la auditoría.
-- --------------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER tg_AuditoriaInventario
AFTER UPDATE ON PRODUCTOS
FOR EACH ROW
BEGIN
    -- Captura cambios transparentes solo si la cantidad actual varió
    IF OLD.Cantidad_Actual <> NEW.Cantidad_Actual THEN
        INSERT INTO AUDITORIA_PRODUCTOS (
            Id_Producto, 
            Fecha, 
            Cantidad_Anterior, 
            Nueva_Cantidad, 
            Usuario
        ) VALUES (
            OLD.Id_Producto, 
            NOW(), 
            OLD.Cantidad_Actual, 
            NEW.Cantidad_Actual, 
            SUBSTRING_INDEX(USER(), '@', 1) -- Usuario de base de datos que ejecutó la acción
        );
    END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------------------
-- PROCEDIMIENTO ALMACENADO: sp_RegistrarRecepcion
-- Empaqueta la lógica transaccional de aprovisionamiento de mercancía.
-- --------------------------------------------------------------------
DELIMITER $$

CREATE PROCEDURE sp_RegistrarRecepcion(
    IN p_Id_Producto INT,
    IN p_Cantidad_Entrante INT,
    IN p_Id_Cliente INT,
    IN p_Numero_Lote VARCHAR(50)
)
BEGIN
    DECLARE v_Rol ENUM('origen', 'destino', 'ambos');
    DECLARE v_Usuario VARCHAR(50);
    
    SET v_Usuario = SUBSTRING_INDEX(USER(), '@', 1);
    
    -- Validación estricta del Rol del Cliente (Debe permitir origen)
    SELECT Rol INTO v_Rol FROM CLIENTES WHERE Id_Cliente = p_Id_Cliente;
    
    IF v_Rol = 'destino' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Error: El cliente con rol de destino no puede registrar ingresos.';
    ELSE
        -- Inicio de Bloque Transaccional (Garantía ACID)
        START TRANSACTION;
            INSERT INTO RECEPCIONES (Id_Producto, Id_Cliente, Numero_Lote, Cantidad, Fecha, Usuario)
            VALUES (p_Id_Producto, p_Id_Cliente, p_Numero_Lote, p_Cantidad_Entrante, NOW(), v_Usuario);
            
            UPDATE PRODUCTOS 
            SET Cantidad_Actual = Cantidad_Actual + p_Cantidad_Entrante
            WHERE Id_Producto = p_Id_Producto;
        COMMIT;
    END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------------------
-- PROCEDIMIENTO ALMACENADO: sp_ProcesarDespacho
-- Valida stock general y ejecuta el despacho bajo transacciones ACID (Todo o Nada).
-- --------------------------------------------------------------------
DELIMITER $$

CREATE PROCEDURE sp_ProcesarDespacho(
    IN p_Id_Despacho INT,
    IN p_Id_Cliente INT
)
BEGIN
    DECLARE v_Rol ENUM('origen', 'destino', 'ambos');
    DECLARE v_Usuario VARCHAR(50);
    DECLARE v_Insuficiente INT DEFAULT 0;
    
    -- Handler ante fallos imprevistos de SQL para evitar caídas abruptas y forzar deshacer cambios
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        UPDATE DESPACHOS SET Estado = 'cancelado' WHERE Id_Despacho = p_Id_Despacho;
        DELETE FROM TEMPORAL_CARRO_COMPRAS WHERE Usuario = v_Usuario;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Excepción crítica de base de datos. Transacción anulada.';
    END;

    SET v_Usuario = SUBSTRING_INDEX(USER(), '@', 1);
    
    -- Validar que el cliente admita destino
    SELECT Rol INTO v_Rol FROM CLIENTES WHERE Id_Cliente = p_Id_Cliente;
    IF v_Rol = 'origen' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: El cliente seleccionado no opera como Destino.';
    END IF;

    -- Cuenta cuántos ítems agregados al carro de compras superan las existencias físicas reales
    SELECT COUNT(*) INTO v_Insuficiente
    FROM TEMPORAL_CARRO_COMPRAS t
    JOIN PRODUCTOS p ON t.Id_Producto = p.Id_Producto
    WHERE t.Usuario = v_Usuario AND p.Cantidad_Actual < t.Cantidad;

    -- Lógica Atómica (Principio ACID)
    IF v_Insuficiente > 0 THEN
        -- Abortar flujo debido a inconsistencias de stock en uno o más productos
        UPDATE DESPACHOS SET Estado = 'cancelado' WHERE Id_Despacho = p_Id_Despacho;
        DELETE FROM TEMPORAL_CARRO_COMPRAS WHERE Usuario = v_Usuario;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Inconsistencia de stock detectada. Despacho Cancelado Automáticamente.';
    ELSE
        -- Ejecución limpia de la venta / salida
        START TRANSACTION;
            -- Registrar de forma definitiva los detalles del despacho
            INSERT INTO DETALLE_DESPACHOS (Id_Despacho, Id_Producto, Cantidad)
            SELECT p_Id_Despacho, Id_Producto, Cantidad
            FROM TEMPORAL_CARRO_COMPRAS
            WHERE Usuario = v_Usuario;
            
            -- Disminución masiva del stock real
            UPDATE PRODUCTOS p
            JOIN TEMPORAL_CARRO_COMPRAS t ON p.Id_Producto = t.Id_Producto
            SET p.Cantidad_Actual = p.Cantidad_Actual - t.Cantidad
            WHERE t.Usuario = v_Usuario;
            
            -- Cambio oficial de estado del despacho
            UPDATE DESPACHOS SET Estado = 'procesado' WHERE Id_Despacho = p_Id_Despacho;
            
            -- Limpiar tabla intermedia/carro de compra del operario actual
            DELETE FROM TEMPORAL_CARRO_COMPRAS WHERE Usuario = v_Usuario;
        COMMIT;
    END IF;
END$$

DELIMITER ;

/*
	Indices
*/

-- Índices aplicados para optimizar el acceso en campos no indexados que actúan en consultas frecuentes
CREATE INDEX IX_Recepciones_Historico ON RECEPCIONES (Id_Producto, Fecha);
CREATE INDEX IX_Despachos_Filtros ON DESPACHOS (Fecha, Estado);
CREATE INDEX IX_Productos_Busqueda_Codigo ON PRODUCTOS (Codigo);


-- Creación del Rol de Aplicación
CREATE ROLE IF NOT EXISTS 'rol_dba_sgid';

-- Otorgamiento de ejecución estricta sobre los componentes de software de la base de datos
GRANT EXECUTE ON PROCEDURE SGID_LogiChain.sp_RegistrarRecepcion TO 'rol_dba_sgid';
GRANT EXECUTE ON PROCEDURE SGID_LogiChain.sp_ProcesarDespacho TO 'rol_dba_sgid';
GRANT EXECUTE ON FUNCTION SGID_LogiChain.fn_VerificarAlertaStock TO 'rol_dba_sgid';

-- Otorgamiento de CRUD controlado a las tablas para el uso correcto del MVC en Java Desktop
GRANT SELECT, INSERT, UPDATE, DELETE ON SGID_LogiChain.TEMPORAL_CARRO_COMPRAS TO 'rol_dba_sgid';
GRANT SELECT, INSERT, UPDATE ON SGID_LogiChain.CLIENTES TO 'rol_dba_sgid';
GRANT SELECT, INSERT, UPDATE ON SGID_LogiChain.PRODUCTOS TO 'rol_dba_sgid';
GRANT SELECT, INSERT ON SGID_LogiChain.DESPACHOS TO 'rol_dba_sgid';
GRANT SELECT ON SGID_LogiChain.AUDITORIA_PRODUCTOS TO 'rol_dba_sgid';
GRANT SELECT ON SGID_LogiChain.RECEPCIONES TO 'rol_dba_sgid';
GRANT SELECT ON SGID_LogiChain.DETALLE_DESPACHOS TO 'rol_dba_sgid';

-- Creación de Usuarios de los Estudiantes (Ejemplos siguiendo inicial del nombre + apellido todo en minúscula)
CREATE USER IF NOT EXISTS 'jmatiaz'@'localhost' IDENTIFIED BY 'LogiChain2026*Secure!';
CREATE USER IF NOT EXISTS 'lcasas'@'localhost' IDENTIFIED BY 'LogiChain2026*Secure!';
CREATE USER IF NOT EXISTS 'mquiros'@'localhost' IDENTIFIED BY 'LogiChain2026*Secure!';

FLUSH PRIVILEGES;