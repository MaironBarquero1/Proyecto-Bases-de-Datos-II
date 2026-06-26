import { Request, Response } from "express";
import { getAuthenticatedConnection } from "../config/database";
import { sendSuccess, sendError } from "../middleware/errorHandler";
import { LoginBody } from "../types";

/**
 * POST /api/auth/login
 *
 * Validates credentials by actually connecting to MySQL with the supplied
 * user/password (as required by the project spec). On success the server
 * confirms the connection is valid and returns the authenticated username.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { usuario, password } = req.body as LoginBody;

  if (!usuario || !password) {
    sendError(res, new Error("Usuario y contraseña son requeridos"), 400);
    return;
  }

  let connection;
  try {
    connection = await getAuthenticatedConnection(usuario, password);

    // Verify the role assigned to this DB user
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT CURRENT_USER() AS dbUser"
    );

    sendSuccess(res, {
      usuario,
      dbUser: (rows[0] as { dbUser: string }).dbUser,
      mensaje: "Autenticación exitosa",
    });
  } catch (error) {
    // Access denied → 401; anything else → 500
    const isAuthError =
      error instanceof Error && error.message.includes("Access denied");
    sendError(
      res,
      new Error(
        isAuthError ? "Credenciales inválidas. Acceso denegado." : (error as Error).message
      ),
      isAuthError ? 401 : 500
    );
  } finally {
    if (connection) await connection.end();
  }
}

// mysql2 type needed for inline import
import mysql from "mysql2/promise";
