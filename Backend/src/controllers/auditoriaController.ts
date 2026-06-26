import { Request, Response } from "express";
import pool from "../config/database";
import { sendSuccess, sendError } from "../middleware/errorHandler";
import { MovimientoProducto, AuditoriaProducto } from "../types";
import { RowDataPacket } from "mysql2";


export async function movimientosProducto(
  req: Request,
  res: Response
): Promise<void> {
  const { codigo } = req.params;
  const { fechaInicio, fechaFin } = req.query as {
    fechaInicio?: string;
    fechaFin?: string;
  };

  if (!codigo) {
    sendError(res, new Error("Código de producto es requerido"), 400);
    return;
  }

  try {
    const inicio = fechaInicio ?? null;
    const fin = fechaFin ?? null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      "CALL sp_ReporteMovimientosProducto(?, ?, ?)",
      [codigo.toUpperCase(), inicio, fin]
    );

    const data = Array.isArray(rows[0]) ? rows[0] : rows;

    sendSuccess<MovimientoProducto[]>(res, data as MovimientoProducto[]);
  } catch (error) {
    sendError(res, error);
  }
}


export async function logAuditoriaProducto(
  req: Request,
  res: Response
): Promise<void> {
  const idProducto = parseInt(req.params.idProducto);
  if (isNaN(idProducto)) {
    sendError(res, new Error("ID de producto inválido"), 400);
    return;
  }

  const { fechaInicio, fechaFin } = req.query as {
    fechaInicio?: string;
    fechaFin?: string;
  };

  try {
    let query = `
      SELECT
        a.Id_Auditoria,
        a.Id_Producto,
        a.Fecha,
        a.Cantidad_Anterior,
        a.Nueva_Cantidad,
        a.Usuario,
        CASE
          WHEN a.Nueva_Cantidad > a.Cantidad_Anterior THEN 'Incremento'
          ELSE 'Reduccion'
        END AS TipoCambio
      FROM AUDITORIA_PRODUCTOS a
      WHERE a.Id_Producto = ?
    `;

    const params: (string | number | null)[] = [idProducto];

    if (fechaInicio) {
      query += " AND a.Fecha >= ?";
      params.push(fechaInicio);
    } else {
      query += " AND a.Fecha >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
    }

    if (fechaFin) {
      query += " AND a.Fecha <= ?";
      params.push(fechaFin);
    }

    query += " ORDER BY a.Fecha DESC";

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    sendSuccess<AuditoriaProducto[]>(res, rows as AuditoriaProducto[]);
  } catch (error) {
    sendError(res, error);
  }
}


export async function logAuditoriaGeneral(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         a.Id_Auditoria,
         a.Id_Producto,
         p.Codigo  AS CodigoProducto,
         p.Nombre  AS NombreProducto,
         a.Fecha,
         a.Cantidad_Anterior,
         a.Nueva_Cantidad,
         a.Usuario,
         CASE
           WHEN a.Nueva_Cantidad > a.Cantidad_Anterior THEN 'Incremento'
           ELSE 'Reduccion'
         END AS TipoCambio
       FROM AUDITORIA_PRODUCTOS a
       INNER JOIN PRODUCTOS p ON p.Id_Producto = a.Id_Producto
       ORDER BY a.Fecha DESC
       LIMIT 200`
    );
    sendSuccess(res, rows);
  } catch (error) {
    sendError(res, error);
  }
}
