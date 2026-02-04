/**
 * Configuración de conexión a MySQL
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Pool de conexiones para mejor rendimiento
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456789Aa!',
  database: process.env.DB_NAME || 'alistamiento',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Verificar conexión al iniciar
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL exitosa');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error);
    return false;
  }
}

// Función helper para ejecutar queries
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T> {
  // Asegurar que params sea un array válido
  const safeParams = params && Array.isArray(params) ? params : [];
  const [rows] = await pool.execute(sql, safeParams);
  return rows as T;
}

export default pool;
