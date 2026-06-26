import { Request, Response } from "express";
import pool from "../config/database";
import { sendSuccess, sendError } from "../middleware/errorHandler";
import {
  CrearDespachoBody,
  AgregarItemCarroBody,
  ProcesarDespachoBody,
  DespachoConDetalle,
  CarroItem,
} from "../types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// ─── Helper ────────────────────────────────────────────────────────────────

/** Extracts the operario/usuario from the request (header or body). */
function getUsuario(req: Request): string {
  return (
    (req.headers["x-usuario"] as string) ||
    req.body?.usuario ||
    "sistema"
  );
}

// ─── Controllers ───────────────────────────────────────────────────────────

/**
 * GET /api/despachos
 * Lista despachos de la última semana (default) o de un rango de fechas,
 * ordenados de forma decreciente.
 */
export async function listarDespachos(
  req: Request,
  res: Response
): Promise<void> {
  const { fechaInicio, fechaFin } = req.query as {
    fechaInicio?: string;
    fechaFin?: string;
  };

  try {
    let query = `
      SELECT
        d.Id_Despacho,
        d.Id_Cliente,
        c.Nombre AS NombreCliente,
        d.Fecha,
        d.Estado,
        d.Operario
      FROM DESPACHOS d
      INNER JOIN CLIENTES c ON c.Id_Cliente = d.Id_Cliente
    `;

    const params: (string | number | Date)[] = [];

    if (fechaInicio && fechaFin) {
      query += " WHERE d.Fecha BETWEEN ? AND ?";
      params.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      query += " WHERE d.Fecha >= ?";
      params.push(fechaInicio);
    } else if (fechaFin) {
      query += " WHERE d.Fecha <= ?";
      params.push(fechaFin);
    } else {
      // Default: última semana
      query += " WHERE d.Fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    }

    query += " ORDER BY d.Fecha DESC";

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    sendSuccess<DespachoConDetalle[]>(res, rows as DespachoConDetalle[]);
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * GET /api/despachos/:id
 * Devuelve un despacho con su detalle de productos (solo si está procesado).
 */
export async function obtenerDespacho(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    sendError(res, new Error("ID inválido"), 400);
    return;
  }

  try {
    // Encabezado
    const [despRows] = await pool.execute<RowDataPacket[]>(
      `SELECT d.*, c.Nombre AS NombreCliente
       FROM DESPACHOS d
       INNER JOIN CLIENTES c ON c.Id_Cliente = d.Id_Cliente
       WHERE d.Id_Despacho = ?`,
      [id]
    );

    if (despRows.length === 0) {
      sendError(res, new Error("Despacho no encontrado"), 404);
      return;
    }

    const despacho = despRows[0] as DespachoConDetalle;

    // Detalle (solo despachos procesados tienen registros en DETALLE_DESPACHOS)
    if (despacho.Estado === "procesado") {
      const [detRows] = await pool.execute<RowDataPacket[]>(
        `SELECT
           dd.Id_Producto,
           p.Codigo  AS CodigoProducto,
           p.Nombre  AS NombreProducto,
           dd.Cantidad
         FROM DETALLE_DESPACHOS dd
         INNER JOIN PRODUCTOS p ON p.Id_Producto = dd.Id_Producto
         WHERE dd.Id_Despacho = ?`,
        [id]
      );
      despacho.Detalle = detRows as DespachoConDetalle["Detalle"];
    }

    sendSuccess<DespachoConDetalle>(res, despacho);
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * POST /api/despachos
 * Crea un nuevo despacho en estado 'pendiente'.
 * Solo clientes con rol 'destino' o 'ambos' pueden recibir despachos.
 */
export async function crearDespacho(
  req: Request,
  res: Response
): Promise<void> {
  const { Id_Cliente } = req.body as CrearDespachoBody;
  const operario = getUsuario(req);

  if (!Id_Cliente) {
    sendError(res, new Error("Id_Cliente es requerido"), 400);
    return;
  }

  try {
    // Validate that the client can receive dispatches
    const [clientRows] = await pool.execute<RowDataPacket[]>(
      "SELECT Rol FROM CLIENTES WHERE Id_Cliente = ?",
      [Id_Cliente]
    );

    if (clientRows.length === 0) {
      sendError(res, new Error("Cliente no encontrado"), 404);
      return;
    }

    const rol = clientRows[0].Rol as string;
    if (rol === "origen") {
      sendError(
        res,
        new Error("El cliente seleccionado no puede recibir despachos (rol: origen)"),
        422
      );
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO DESPACHOS (Id_Cliente, Fecha, Estado, Operario) VALUES (?, NOW(), 'pendiente', ?)",
      [Id_Cliente, operario]
    );

    sendSuccess<{ Id_Despacho: number }>(
      res,
      { Id_Despacho: result.insertId },
      "Despacho creado en estado pendiente",
      201
    );
  } catch (error) {
    sendError(res, error);
  }
}

// ─── Carro de compras ──────────────────────────────────────────────────────

/**
 * GET /api/despachos/carro
 * Lista los productos en el carro de compras del usuario actual.
 */
export async function verCarro(req: Request, res: Response): Promise<void> {
  const usuario = getUsuario(req);

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         t.Usuario,
         t.Id_Producto,
         p.Codigo     AS CodigoProducto,
         p.Nombre     AS NombreProducto,
         p.Cantidad_Actual,
         t.Cantidad
       FROM TEMPORAL_CARRO_COMPRAS t
       INNER JOIN PRODUCTOS p ON p.Id_Producto = t.Id_Producto
       WHERE t.Usuario = ?`,
      [usuario]
    );
    sendSuccess(res, rows);
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * POST /api/despachos/carro
 * Agrega o actualiza un producto en el carro del operario actual.
 */
export async function agregarAlCarro(
  req: Request,
  res: Response
): Promise<void> {
  const { Id_Producto, Cantidad } = req.body as AgregarItemCarroBody;
  const usuario = getUsuario(req);

  if (!Id_Producto || !Cantidad) {
    sendError(res, new Error("Id_Producto y Cantidad son requeridos"), 400);
    return;
  }

  if (typeof Cantidad !== "number" || Cantidad <= 0) {
    sendError(res, new Error("Cantidad debe ser un número mayor a 0"), 400);
    return;
  }

  try {
    // INSERT … ON DUPLICATE KEY UPDATE (upsert on composite PK)
    await pool.execute(
      `INSERT INTO TEMPORAL_CARRO_COMPRAS (Usuario, Id_Producto, Cantidad)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE Cantidad = ?`,
      [usuario, Id_Producto, Cantidad, Cantidad]
    );
    sendSuccess(res, null, "Producto agregado al carro exitosamente");
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * DELETE /api/despachos/carro/:idProducto
 * Elimina un producto específico del carro del operario.
 */
export async function eliminarDelCarro(
  req: Request,
  res: Response
): Promise<void> {
  const idProducto = parseInt(req.params.idProducto);
  const usuario = getUsuario(req);

  if (isNaN(idProducto)) {
    sendError(res, new Error("ID de producto inválido"), 400);
    return;
  }

  try {
    await pool.execute(
      "DELETE FROM TEMPORAL_CARRO_COMPRAS WHERE Usuario = ? AND Id_Producto = ?",
      [usuario, idProducto]
    );
    sendSuccess(res, null, "Producto eliminado del carro");
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * DELETE /api/despachos/carro
 * Vacía todo el carro del operario actual.
 */
export async function vaciarCarro(req: Request, res: Response): Promise<void> {
  const usuario = getUsuario(req);

  try {
    await pool.execute(
      "DELETE FROM TEMPORAL_CARRO_COMPRAS WHERE Usuario = ?",
      [usuario]
    );
    sendSuccess(res, null, "Carro vaciado exitosamente");
  } catch (error) {
    sendError(res, error);
  }
}

// ─── Procesar despacho ─────────────────────────────────────────────────────

/**
 * POST /api/despachos/:id/procesar
 * Invoca sp_ProcesarDespacho que ejecuta la lógica ACID completa:
 * - Valida stock de todos los productos en el carro
 * - Si hay stock suficiente: INSERT en DETALLE_DESPACHOS, UPDATE stock, estado → procesado
 * - Si no hay stock: estado → cancelado, ROLLBACK, limpia carro
 */
export async function procesarDespacho(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    sendError(res, new Error("ID inválido"), 400);
    return;
  }

  const { Id_Cliente } = req.body as ProcesarDespachoBody;

  if (!Id_Cliente) {
    sendError(res, new Error("Id_Cliente es requerido"), 400);
    return;
  }

  try {
    await pool.execute("CALL sp_ProcesarDespacho(?, ?)", [id, Id_Cliente]);
    sendSuccess(res, null, "Despacho procesado exitosamente");
  } catch (error) {
    const msg = (error as Error).message || "";
    const isBusinessRule =
      msg.includes("Inconsistencia") ||
      msg.includes("no opera como Destino") ||
      msg.includes("cancelado");
    sendError(res, error, isBusinessRule ? 422 : 500);
  }
}
