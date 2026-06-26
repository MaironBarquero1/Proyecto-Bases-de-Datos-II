import { Request, Response } from "express";
import pool from "../config/database";
import { sendSuccess, sendError } from "../middleware/errorHandler";
import {
  Producto,
  CrearProductoBody,
  ActualizarProductoBody,
  RecepcionExtendida,
} from "../types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * GET /api/productos
 * Lista todos los productos con su estado de stock.
 */
export async function listarProductos(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        Id_Producto, Codigo, Nombre, Detalle,
        Cantidad_Actual, Stock_Critico,
        Bodega, Pasillo, Estante
       FROM PRODUCTOS
       ORDER BY Nombre ASC`
    );
    sendSuccess<Producto[]>(res, rows as Producto[]);
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * GET /api/productos/disponibles
 * Lista productos con stock > 0 (para el módulo de despacho).
 */
export async function listarProductosDisponibles(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        Id_Producto, Codigo, Nombre, Detalle,
        Cantidad_Actual, Stock_Critico,
        Bodega, Pasillo, Estante
       FROM PRODUCTOS
       WHERE Cantidad_Actual > 0
       ORDER BY Nombre ASC`
    );
    sendSuccess<Producto[]>(res, rows as Producto[]);
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * GET /api/productos/:id
 * Devuelve un producto por ID.
 */
export async function obtenerProducto(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    sendError(res, new Error("ID inválido"), 400);
    return;
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM PRODUCTOS WHERE Id_Producto = ?",
      [id]
    );
    if (rows.length === 0) {
      sendError(res, new Error("Producto no encontrado"), 404);
      return;
    }
    sendSuccess<Producto>(res, rows[0] as Producto);
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * POST /api/productos
 * Crea un nuevo producto. La cantidad inicial siempre es 0 (se gestiona vía recepciones).
 */
export async function crearProducto(
  req: Request,
  res: Response
): Promise<void> {
  const {
    Codigo,
    Nombre,
    Detalle,
    Stock_Critico,
    Bodega,
    Pasillo,
    Estante,
  } = req.body as CrearProductoBody;

  if (!Codigo || !Nombre || Stock_Critico === undefined || !Bodega || !Pasillo || !Estante) {
    sendError(
      res,
      new Error("Campos requeridos: Codigo, Nombre, Stock_Critico, Bodega, Pasillo, Estante"),
      400
    );
    return;
  }

  if (typeof Stock_Critico !== "number" || Stock_Critico < 0) {
    sendError(res, new Error("Stock_Critico debe ser un número mayor o igual a 0"), 400);
    return;
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO PRODUCTOS
         (Codigo, Nombre, Detalle, Cantidad_Actual, Stock_Critico, Bodega, Pasillo, Estante)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        Codigo.trim().toUpperCase(),
        Nombre.trim(),
        Detalle?.trim() || null,
        Stock_Critico,
        Bodega.trim(),
        Pasillo.trim(),
        Estante.trim(),
      ]
    );
    sendSuccess<{ Id_Producto: number }>(
      res,
      { Id_Producto: result.insertId },
      "Producto creado exitosamente",
      201
    );
  } catch (error) {
    const msg = (error as Error).message || "";
    // Duplicate entry for Codigo
    sendError(res, error, msg.includes("Duplicate") ? 409 : 500);
  }
}

/**
 * PUT /api/productos/:id
 * Permite modificar Nombre, Stock_Critico y ubicación.
 * NO permite modificar Cantidad_Actual directamente (solo vía SP).
 */
export async function actualizarProducto(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    sendError(res, new Error("ID inválido"), 400);
    return;
  }

  const { Nombre, Stock_Critico, Bodega, Pasillo, Estante } =
    req.body as ActualizarProductoBody;

  if (!Nombre && Stock_Critico === undefined && !Bodega && !Pasillo && !Estante) {
    sendError(res, new Error("Debe proporcionar al menos un campo para actualizar"), 400);
    return;
  }

  if (Stock_Critico !== undefined && (typeof Stock_Critico !== "number" || Stock_Critico < 0)) {
    sendError(res, new Error("Stock_Critico debe ser un número mayor o igual a 0"), 400);
    return;
  }

  try {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (Nombre) { fields.push("Nombre = ?"); values.push(Nombre.trim()); }
    if (Stock_Critico !== undefined) { fields.push("Stock_Critico = ?"); values.push(Stock_Critico); }
    if (Bodega) { fields.push("Bodega = ?"); values.push(Bodega.trim()); }
    if (Pasillo) { fields.push("Pasillo = ?"); values.push(Pasillo.trim()); }
    if (Estante) { fields.push("Estante = ?"); values.push(Estante.trim()); }

    values.push(id);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE PRODUCTOS SET ${fields.join(", ")} WHERE Id_Producto = ?`,
      values
    );

    if (result.affectedRows === 0) {
      sendError(res, new Error("Producto no encontrado"), 404);
      return;
    }

    sendSuccess(res, null, "Producto actualizado exitosamente");
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * DELETE /api/productos/:id
 * Invoca sp_EliminarProducto; lanza error si tiene movimientos.
 */
export async function eliminarProducto(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    sendError(res, new Error("ID inválido"), 400);
    return;
  }

  try {
    await pool.execute("CALL sp_EliminarProducto(?)", [id]);
    sendSuccess(res, null, "Producto eliminado exitosamente");
  } catch (error) {
    const msg = (error as Error).message || "";
    sendError(res, error, msg.includes("No se puede eliminar") ? 422 : 500);
  }
}

/**
 * GET /api/productos/:id/recepciones
 * Lista el historial de recepciones de un producto.
 */
export async function listarRecepcionesProducto(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    sendError(res, new Error("ID inválido"), 400);
    return;
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         r.Id_Recepcion,
         r.Id_Producto,
         p.Codigo AS CodigoProducto,
         p.Nombre AS NombreProducto,
         r.Id_Cliente,
         c.Nombre AS NombreCliente,
         r.Numero_Lote,
         r.Cantidad,
         r.Fecha,
         r.Usuario
       FROM RECEPCIONES r
       INNER JOIN PRODUCTOS p ON p.Id_Producto = r.Id_Producto
       INNER JOIN CLIENTES  c ON c.Id_Cliente  = r.Id_Cliente
       WHERE r.Id_Producto = ?
       ORDER BY r.Fecha DESC`,
      [id]
    );
    sendSuccess<RecepcionExtendida[]>(res, rows as RecepcionExtendida[]);
  } catch (error) {
    sendError(res, error);
  }
}
