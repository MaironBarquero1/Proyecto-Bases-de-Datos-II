import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "localhost",
  user: "host",
  password: "MiClaveSegura123*",
  database: "SGID_LogiChain",
});
