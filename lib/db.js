import sql from 'mssql';

export const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: true,
    trustServerCertificate: true,
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



