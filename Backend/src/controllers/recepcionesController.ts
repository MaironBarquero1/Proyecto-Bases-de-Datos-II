import { Request, Response } from "express";
import pool from "../config/database";
import { sendSuccess, sendError } from "../middleware/errorHandler";
import { RegistrarRecepcionBody, RecepcionExtendida } from "../types";
import { RowDataPacket } from "mysql2";

/**
 * POST /api/recepciones
 * Registra una recepción de mercancía invocando sp_RegistrarRecepcion.
 * El SP valida el rol del cliente (debe ser 'origen' o 'ambos'),
 * incrementa el stock y garantiza atomicidad ACID.
 */
export async function registrarRecepcion(
  req: Request,
  res: Response
): Promise<void> {
  const { Id_Producto, Cantidad_Entrante, Id_Cliente, Numero_Lote } =
    req.body as RegistrarRecepcionBody;

  // Input validation
  if (!Id_Producto || !Cantidad_Entrante || !Id_Cliente || !Numero_Lote) {
    sendError(
      res,
      new Error("Campos requeridos: Id_Producto, Cantidad_Entrante, Id_Cliente, Numero_Lote"),
      400
    );
    return;
  }

  if (typeof Cantidad_Entrante !== "number" || Cantidad_Entrante <= 0) {
    sendError(res, new Error("Cantidad_Entrante debe ser un número mayor a 0"), 400);
    return;
  }

  try {
    await pool.execute("CALL sp_RegistrarRecepcion(?, ?, ?, ?)", [
      Id_Producto,
      Cantidad_Entrante,
      Id_Cliente,
      Numero_Lote.trim(),
    ]);

    sendSuccess(res, null, "Recepción registrada exitosamente", 201);
  } catch (error) {
    const msg = (error as Error).message || "";
    const isBusinessRule = msg.includes("rol de destino");
    sendError(res, error, isBusinessRule ? 422 : 500);
  }
}

/**
 * GET /api/recepciones
 * Lista todas las recepciones con información ampliada.
 * Soporta filtro opcional por rango de fechas: ?fechaInicio=&fechaFin=
 */
export async function listarRecepciones(
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
        r.Id_Recepcion,
        r.Id_Producto,
        p.Codigo  AS CodigoProducto,
        p.Nombre  AS NombreProducto,
        r.Id_Cliente,
        c.Nombre  AS NombreCliente,
        r.Numero_Lote,
        r.Cantidad,
        r.Fecha,
        r.Usuario
      FROM RECEPCIONES r
      INNER JOIN PRODUCTOS p ON p.Id_Producto = r.Id_Producto
      INNER JOIN CLIENTES  c ON c.Id_Cliente  = r.Id_Cliente
    `;

    const params: (string | number | Date)[] = [];

    if (fechaInicio && fechaFin) {
      query += " WHERE r.Fecha BETWEEN ? AND ?";
      params.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      query += " WHERE r.Fecha >= ?";
      params.push(fechaInicio);
    } else if (fechaFin) {
      query += " WHERE r.Fecha <= ?";
      params.push(fechaFin);
    }

    query += " ORDER BY r.Fecha DESC";

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    sendSuccess<RecepcionExtendida[]>(res, rows as RecepcionExtendida[]);
  } catch (error) {
    sendError(res, error);
  }
}
