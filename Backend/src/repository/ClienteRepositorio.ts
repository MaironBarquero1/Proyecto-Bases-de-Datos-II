import { pool } from "./ConexionDB";
import { Cliente } from "../Models/Cliente";

export class ClienteRepositorio {
    static async obtenerTodos(): Promise<Cliente[]> {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM CLIENTES", (err, results) => {
                if (err) reject(err);
                else resolve(results as Cliente[]);
            });
        });
    }

    static async obtenerPorId(id: number): Promise<Cliente | null> {
        return new Promise((resolve, reject) => {
            pool.query(
                "SELECT * FROM CLIENTES WHERE Id_Cliente = ?",
                [id],
                (err, results: any[]) => {
                    if (err) reject(err);
                    else resolve(results.length > 0 ? (results[0] as Cliente) : null);
                }
            );
        });
    }

    static async crear(cliente: Omit<Cliente, 'idCliente'>): Promise<Cliente> {
        return new Promise((resolve, reject) => {
            pool.query(
                "INSERT INTO CLIENTES (Nombre, Rol) VALUES (?, ?)",
                [cliente.nombre, cliente.rol],
                (err: any, result: any) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });
    }

    static async actualizar(id: number, cliente: Partial<Cliente>): Promise<boolean> {
        return new Promise((resolve, reject) => {
            pool.query(
                "UPDATE CLIENTES SET Nombre = ?, Rol = ? WHERE Id_Cliente = ?",
                [cliente.nombre, cliente.rol, id],
                (err: any, result: any) => {
                    if (err) reject(err);
                    else resolve(result.affectedRows > 0);
                }
            );
        });
    }

    static async eliminar(id: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            pool.query(
                "DELETE FROM CLIENTES WHERE Id_Cliente = ?",
                [id],
                (err: any, result: any) => {
                    if (err) reject(err);
                    else resolve(result.affectedRows > 0);
                }
            );
        });
    }
}