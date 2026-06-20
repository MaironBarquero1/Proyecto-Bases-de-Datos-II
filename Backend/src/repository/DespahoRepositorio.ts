import { Despacho, Estado } from "../Models/Despacho";
import { pool } from "./ConexionDB";

export class DespachoRepositorio {
  static async CrearDespacho(
    despacho: Omit<Despacho, "idDespacho">,
  ): Promise<Despacho> {
    return new Promise<Despacho>((resolve, reject) => {
      pool.query(
        "INSERT INTO DESPACHOS (Id_Cliente,Fecha,Estado,Operario) VALUES(?,?,?,?)",
        [
          despacho.idCliente,
          despacho.fecha,
          despacho.estado,
          despacho.operario,
        ],
        (err, results) => {
            if(err) reject(err);
            else resolve(results);
        },
      );
    });
  }

  static async 
}
