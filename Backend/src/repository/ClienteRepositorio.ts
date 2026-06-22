import { pool } from "./ConexionDB";
import { Cliente } from "../Models/Cliente";

export class ClienteRepositorio {
    static async obtenerTodos(): Promise<Cliente[]> {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM CLIENTES" );
        });
    }

    static async obtenerPorId(id: number): Promise<Cliente | null> {
        return new Promise((resolve, reject) => {
            pool.query(
                "SELECT * FROM CLIENTES WHERE Id_Cliente = ?",
                [id],
            );
        });
    }

    static async crear(cliente: Omit<Cliente, 'idCliente'>): Promise<Cliente> {
        return new Promise((resolve, reject) => {
            pool.query(
                "INSERT INTO CLIENTES (Nombre, Rol) VALUES (?, ?)",
                [cliente.nombre, cliente.rol],
            );
        });
    }

    static async actualizar(id: number, cliente: Partial<Cliente>): Promise<boolean> {
        return new Promise((resolve, reject) => {
            pool.query(
                "UPDATE CLIENTES SET Nombre = ?, Rol = ? WHERE Id_Cliente = ?",
                [cliente.nombre, cliente.rol, id],
            );
        });
    }

    static async eliminar(id: number): Promise<boolean> {
        try {
            await pool.query(
                "DELETE FROM CLIENTES WHERE Id_Cliente = ?",
                [id],
            );
            return true;
        } catch (error) {
            throw error;
        }    
    }
}