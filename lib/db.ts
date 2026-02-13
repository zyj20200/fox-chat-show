import mysql, { Pool } from "mysql2/promise";

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function getDefaultConfig(): DbConfig {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
  };
}

let currentConfig: DbConfig | null = null;
let pool: Pool | null = null;

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

function ensureInit() {
  if (!currentConfig) {
    currentConfig = getDefaultConfig();
    pool = createPool(currentConfig);
  }
}

export function getPool(): Pool {
  ensureInit();
  return pool!;
}

export function getConfig(): DbConfig {
  ensureInit();
  return { ...currentConfig! };
}

export async function setConfig(config: DbConfig): Promise<void> {
  const testPool = createPool(config);
  await testPool.query("SELECT 1");
  await testPool.end();

  if (pool) await pool.end();
  currentConfig = { ...config };
  pool = createPool(currentConfig);
}

export default { getPool, getConfig, setConfig };
