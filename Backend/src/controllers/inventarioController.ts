import { Request, Response } from "express";
import pool from "../config/database";
import { sendSuccess, sendError } from "../middleware/errorHandler";
import { ProductoMonitoreo } from "../types";
import { RowDataPacket } from "mysql2";

/**
 * GET /api/inventario/monitoreo
 * Invoca sp_MonitoreoInventarioTiempoReal que devuelve todos los productos
 * con su ubicación, stock, últimos movimientos y el estado de alerta
 * calculado por fn_VerificarAlertaStock ('OK' | 'REORDEN').
 */
export async function monitoreoInventario(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "CALL sp_MonitoreoInventarioTiempoReal()"
    );

    // mysql2 wraps CALL results in an array of result sets;
    // the first element contains our rows.
    const data = Array.isArray(rows[0]) ? rows[0] : rows;

    sendSuccess<ProductoMonitoreo[]>(res, data as ProductoMonitoreo[]);
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * GET /api/inventario/stock-critico
 * Shortcut: only returns products in REORDEN state.
 */
export async function productosStockCritico(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         p.Id_Producto,
         p.Codigo,
         p.Nombre,
         p.Detalle,
         p.Cantidad_Actual,
         p.Stock_Critico,
         p.Bodega,
         p.Pasillo,
         p.Estante,
         fn_VerificarAlertaStock(p.Id_Producto) AS EstadoStock
       FROM PRODUCTOS p
       WHERE fn_VerificarAlertaStock(p.Id_Producto) = 'REORDEN'
       ORDER BY p.Nombre ASC`
    );
    sendSuccess<ProductoMonitoreo[]>(res, rows as ProductoMonitoreo[]);
  } catch (error) {
    sendError(res, error);
  }
}
