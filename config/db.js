const sql = require("mssql/msnodesqlv8");
require("dotenv").config();

// SQL Server Configuration
const config = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-Q884IGA;Database=DBSmartCampusBGIET;Trusted_Connection=Yes;",
};

let pool = null;

/**
 * Connect to SQL Server
 */
async function connectDB() {
  try {
    if (pool && pool.connected) {
      return pool;
    }

    pool = await sql.connect(config);

    console.log("✅ SQL Server Connected Successfully");
    return pool;
  } catch (err) {
    console.error("❌ Database Connection Error:", err.message);
    throw err;
  }
}

/**
 * Get existing pool or reconnect
 */
async function getPool() {
  try {
    if (!pool || !pool.connected) {
      if (pool) {
        try {
          await pool.close();
        } catch (e) { }
      }

      pool = await connectDB();
    }

    return pool;
  } catch (err) {
    throw err;
  }
}

/**
 * Retry wrapper for database operations
 */
async function withRetry(callback, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const pool = await getPool();
      return await callback(pool);
    } catch (err) {
      lastError = err;

      console.error(
        `❌ Database operation failed (Attempt ${attempt}/${retries}):`,
        err.message
      );

      // Close broken connection
      if (pool) {
        try {
          await pool.close();
        } catch (e) { }

        pool = null;
      }

      // Wait before retrying
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError;
}

/**
 * Close DB Connection
 */
async function closeDB() {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      console.log("🔒 SQL Server Connection Closed");
    } catch (err) {
      console.error("Error closing database:", err.message);
    }
  }
}

module.exports = {
  sql,
  config,
  connectDB,
  getPool,
  withRetry,
  closeDB,
};