import { pool } from "./ConnectionDB";
import {AuditoriaProducto} from '../Models/AuditoriaProducto';

export class AuditoriaProductoRepository {
  static async buscarPorProducto(productoId: number): Promise<AuditoriaProducto[]> {
    return new Promise((resolve, reject) =>{
        pool.query('SELECT * FROM AUDITORIA_PRODUCTOS p WHERE p.Id_Producto = ?',[productoId],(err,results) =>{
            if(err) reject(err);
            else resolve(results as AuditoriaProducto[])
        });
    });
  }

  static async buscarPorProductoYFecha(
    productoId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<AuditoriaProducto[]> {
    return new Promise((resolve,reject) =>{
        pool.query(
        `SELECT * FROM AUDITORIA_PRODUCTOS WHERE Id_Producto = ? AND Fecha BETWEEN ? AND ?`,
        [productoId, fechaInicio, fechaFin],
        (err, results) => {
          if (err) reject(err);
          else resolve(results as AuditoriaProducto[]);
        }
      );
    });
  }

  static async buscarUltimoMovimiento(
    productoId: number,
  ): Promise<AuditoriaProducto | null> {
    return new Promise((resolve,reject) =>{
        pool.query(
        `SELECT * FROM AUDITORIA_PRODUCTOS WHERE Id_Producto = ? ORDER BY Fecha DESC LIMIT 1`,
        [productoId],
        (err, results: any[]) => {
          if (err) reject(err);
          else resolve(results.length > 0 ? results[0] : null);
        }
      );
    });
  }
}
