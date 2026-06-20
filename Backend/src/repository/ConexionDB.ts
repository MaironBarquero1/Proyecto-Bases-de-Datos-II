import mysql from 'mysql';

export const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'host',
  password: 'MiClaveSegura123*',
  database: 'SGID_LogiChain'
});
