import { Request, Response } from "express";
import pool from "../config/database";
import { sendSuccess, sendError } from "../middleware/errorHandler";
import {
  Cliente,
  CrearClienteBody,
  ActualizarClienteBody,
} from "../types";
import { RowDataPacket, ResultSetHeader } from "mysql2";


export async function listarClientes(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT Id_Cliente, Nombre, Rol FROM CLIENTES ORDER BY Nombre ASC"
    );
    sendSuccess<Cliente[]>(res, rows as Cliente[]);
  } catch (error) {
    sendError(res, error);
  }
}


export async function obtenerCliente(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    sendError(res, new Error("ID inválido"), 400);
    return;
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT Id_Cliente, Nombre, Rol FROM CLIENTES WHERE Id_Cliente = ?",
      [id]
    );
    if (rows.length === 0) {
      sendError(res, new Error("Cliente no encontrado"), 404);
      return;
    }
    sendSuccess<Cliente>(res, rows[0] as Cliente);
  } catch (error) {
    sendError(res, error);
  }
}

export async function crearCliente(
  req: Request,
  res: Response
): Promise<void> {
  const { Nombre, Rol } = req.body as CrearClienteBody;

  if (!Nombre || !Rol) {
    sendError(res, new Error("Nombre y Rol son requeridos"), 400);
    return;
  }

  if (!["origen", "destino", "ambos"].includes(Rol)) {
    sendError(
      res,
      new Error("Rol inválido. Debe ser: origen, destino o ambos"),
      400
    );
    return;
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO CLIENTES (Nombre, Rol) VALUES (?, ?)",
      [Nombre.trim(), Rol]
    );
    sendSuccess<{ Id_Cliente: number }>(
      res,
      { Id_Cliente: result.insertId },
      "Cliente creado exitosamente",
      201
    );
  } catch (error) {
    sendError(res, error);
  }
}


export async function actualizarCliente(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    sendError(res, new Error("ID inválido"), 400);
    return;
  }

  const { Nombre, Rol } = req.body as ActualizarClienteBody;

  if (!Nombre && !Rol) {
    sendError(res, new Error("Debe proporcionar Nombre o Rol para actualizar"), 400);
    return;
  }

  if (Rol && !["origen", "destino", "ambos"].includes(Rol)) {
    sendError(
      res,
      new Error("Rol inválido. Debe ser: origen, destino o ambos"),
      400
    );
    return;
  }

  try {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (Nombre) {
      fields.push("Nombre = ?");
      values.push(Nombre.trim());
    }
    if (Rol) {
      fields.push("Rol = ?");
      values.push(Rol);
    }
    values.push(id);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE CLIENTES SET ${fields.join(", ")} WHERE Id_Cliente = ?`,
      values
    );

    if (result.affectedRows === 0) {
      sendError(res, new Error("Cliente no encontrado"), 404);
      return;
    }

    sendSuccess(res, null, "Cliente actualizado exitosamente");
  } catch (error) {
    sendError(res, error);
  }
}


export async function eliminarCliente(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    sendError(res, new Error("ID inválido"), 400);
    return;
  }

  try {
    await pool.execute("CALL sp_EliminarCliente(?)", [id]);
    sendSuccess(res, null, "Cliente eliminado exitosamente");
  } catch (error) {
    const msg = (error as Error).message || "";
    const isBusinessRule = msg.includes("No se puede eliminar");
    sendError(res, error, isBusinessRule ? 422 : 500);
  }
}
