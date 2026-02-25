import sql from 'mssql';

export const sqlConfig = {
  user: 'admin',
  password: 'Admin',      
  database: 'prescriptoai',
  server: 'SONU',            
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

let pool;

export async function getConnection() {
  if (!pool) {
    pool = await sql.connect(sqlConfig);
  } else if (!pool.connected) {
    pool = await sql.connect(sqlConfig);
  }
  return pool;
}









export async function query(queryText, params = {}) {
  const pool = await getConnection();
  const request = pool.request();
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value);
  }
  return request.query(queryText);
}

export { sql };



