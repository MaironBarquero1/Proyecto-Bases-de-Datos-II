import { Despacho, Estado } from "../Models/Despacho";
import { pool } from "./ConexionDB";

export class DespachoRepositorio {
  static async CrearDespacho(
    despacho: Omit<Despacho, "idDespacho"|"estado">,
  ): Promise<Despacho> {
    
      pool.query(
        "INSERT INTO DESPACHOS (Id_Cliente,Fecha,Estado,Operario) VALUES(?,?,?,?)",
        [
          despacho.idCliente,
          despacho.fecha,
          Estado.pendiente,
          despacho.operario,
        ]
      );
    
  }

  static async AgregarProductoTemporal(operario:string,Id_producto:number,cantidad:number):Promise<boolean>{
    return new Promise((resolve,reject)=>{
      pool.query("INSERT INTO TEMPORAL_CARRO_COMPRAS (Usuario,Id_Producto, Cantidad) VALUES (?,?,?) ON DUPLICATE KEY UPDATE Cantidad = VALUES(Cantidad)",
        [operario,Id_producto,cantidad]);
    });
  }
}
