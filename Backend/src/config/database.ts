import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// ============================================================
// Conexión a MySQL (SGID_LogiChain)
//
// 1. `pool`  → pool de la aplicación. Sus credenciales viven en el .env
//    (un usuario con el rol_dba_sgid). Lo usan todos los controladores
//    para invocar procedimientos almacenados / consultas.
//
// 2. `getAuthenticatedConnection` → abre una conexión puntual con el
//    usuario/clave que envía el operario en el login. Si MySQL acepta las
//    credenciales el login es válido (tal como exige el enunciado: el login
//    se valida contra el usuario y contraseña de la base de datos).
// ============================================================

const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = parseInt(process.env.DB_PORT || "3306");
const DB_NAME = process.env.DB_NAME || "SGID_LogiChain";

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Abre una conexión validando las credenciales del operario contra MySQL.
 * Lanza un error "Access denied" si el usuario/clave no son correctos.
 * El llamador es responsable de cerrar la conexión (`connection.end()`).
 */
export async function getAuthenticatedConnection(
  usuario: string,
  password: string
): Promise<mysql.Connection> {
  return mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: usuario,
    password,
  });
}

export default pool;
