const mysql = require('mysql2/promise');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'hostel_db';
const backupDbName = `${dbName}_backup`;

const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            process.env.DB_PORT     || 3306,
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || 'root',
  database:        dbName,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  multipleStatements: false,
  timezone:           '+00:00'
});

const backupPool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            process.env.DB_PORT     || 3306,
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || 'root',
  database:        backupDbName,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  multipleStatements: false,
  timezone:           '+00:00'
});

// Test connection and setup backup DB on startup
pool.getConnection()
  .then(async (conn) => {
    console.log(`✅ MySQL connected successfully to ${dbName}`);
    try {
      // First ensure the database exists without selecting it
      const rootConn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root'
      });
      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${backupDbName}\``);
      await rootConn.end();
      console.log(`✅ MySQL Backup DB ensured: ${backupDbName}`);
    } catch (e) {
      console.error('❌ Failed to create Backup DB:', e.message);
    }
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
  });

// Handle unexpected bracket/connection errors to prevent server crash
pool.on('error', (err) => {
  console.error('⚠️ Unexpected MySQL Pool Error:', err);
});
backupPool.on('error', (err) => {
  console.error('⚠️ Unexpected MySQL Backup Pool Error:', err);
});

// Monkey patch query for dual-write
const originalQuery = pool.query.bind(pool);
pool.query = async function (sql, values) {
  const result = await originalQuery(sql, values);
  
  if (sql && typeof sql === 'string' && /^\s*(INSERT|UPDATE|DELETE|CALL|REPLACE)/i.test(sql)) {
    try {
      await backupPool.query(sql, values);
    } catch (err) {
      console.warn('⚠️ Backup auto-sync query failed (manual sync may be required):', err.message);
    }
  }
  return result;
};

// Also monkey patch connection.query if transactions or explicit connections are used
const originalGetConnection = pool.getConnection.bind(pool);
pool.getConnection = async function() {
  const conn = await originalGetConnection();
  const originalConnQuery = conn.query.bind(conn);
  
  conn.query = async function(sql, values) {
    const result = await originalConnQuery(sql, values);
    if (sql && typeof sql === 'string' && /^\s*(INSERT|UPDATE|DELETE|CALL|REPLACE)/i.test(sql)) {
      try {
        await backupPool.query(sql, values);
      } catch (err) {
        console.warn('⚠️ Backup auto-sync connection query failed:', err.message);
      }
    }
    return result;
  };
  return conn;
};

pool.backupDbName = backupDbName;
module.exports = pool;
