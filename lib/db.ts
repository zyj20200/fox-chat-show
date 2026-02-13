import mysql, { Pool } from "mysql2/promise";

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const defaultConfig: DbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "",
};

let currentConfig: DbConfig = { ...defaultConfig };
let pool: Pool = createPool(currentConfig);

function createPool(config: DbConfig): Pool {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

export function getPool(): Pool {
  return pool;
}

export function getConfig(): DbConfig {
  return { ...currentConfig };
}

export async function setConfig(config: DbConfig): Promise<void> {
  // Test connection before switching
  const testPool = createPool(config);
  await testPool.query("SELECT 1");
  await testPool.end();

  await pool.end();
  currentConfig = { ...config };
  pool = createPool(currentConfig);
}

export default pool;
