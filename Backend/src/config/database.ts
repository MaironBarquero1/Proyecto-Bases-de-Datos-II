import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1",
  port:3307,
  user: "root",
  password: "MiClaveSegura123*",
  database: "SGID_LogiChain",
});

export default pool;