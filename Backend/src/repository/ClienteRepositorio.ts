import { pool } from "./ConexionDB";
import { Cliente } from "../Models/Cliente";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export class ClienteRepositorio {
    static async obtenerTodos(): Promise<Cliente[]> {
        try {
            const [rows] = await pool.query<RowDataPacket[] & Cliente[]>("SELECT * FROM CLIENTES" );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async obtenerPorId(id: number): Promise<Cliente | null> {
        try {
            const [rows] = await pool.query<RowDataPacket[] & Cliente[]>(
                "SELECT * FROM CLIENTES WHERE Id_Cliente = ?",
                [id],
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    static async crearCliente(cliente: Omit<Cliente, 'idCliente'>): Promise<number> {
        try {
            const [result] = await pool.query<ResultSetHeader>(
                "INSERT INTO CLIENTES (Nombre, Rol) VALUES (?, ?)",
                [cliente.nombre, cliente.rol],
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async actualizar(id: number, cliente: Partial<Cliente>): Promise<boolean> {
        try {
            const camposProtegidos = new Set(['id']);
            const camposValidos = Object.keys(cliente).filter(k => cliente[k as keyof Cliente] !== undefined && !camposProtegidos.has(k));

            if(camposValidos.length === 0) return false;

            const parametrosString = camposValidos.map(campo =>{`${campo} = ?`}).join(', ');

            const valoresConsulta = camposValidos.map(campo =>cliente[campo as keyof Cliente])
            valoresConsulta.push(id);
            const [result] = await pool.query<ResultSetHeader>(
                `UPDATE CLIENTES SET ${parametrosString} WHERE Id_Cliente = ?`,
                valoresConsulta,
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async eliminar(id: number): Promise<boolean> {
        try {
            const [result] = await pool.query<ResultSetHeader>(
                "DELETE FROM CLIENTES WHERE Id_Cliente = ?",
                [id],
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }    
    }
}