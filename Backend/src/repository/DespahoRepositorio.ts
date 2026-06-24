import { ResultSetHeader } from "mysql2";
import { Despacho, Estado } from "../Models/Despacho";
import { pool } from "./ConexionDB";

export class DespachoRepositorio {
  static async CrearDespacho(
    despacho: Omit<Despacho, "idDespacho" | "estado">,
  ): Promise<number> {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        "INSERT INTO DESPACHOS (Id_Cliente,Fecha,Estado,Operario) VALUES(?,?,?,?)",
        [
          despacho.idCliente,
          despacho.fecha,
          Estado.pendiente,
          despacho.operario,
        ]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async AgregarProductoTemporal(
    operario: string,
    Id_producto: number,
    cantidad: number,
  ): Promise<number> {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        "INSERT INTO TEMPORAL_CARRO_COMPRAS (Usuario,Id_Producto, Cantidad) VALUES (?,?,?) ON DUPLICATE KEY UPDATE Cantidad = VALUES(Cantidad)",
        [operario, Id_producto, cantidad],
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }
}
