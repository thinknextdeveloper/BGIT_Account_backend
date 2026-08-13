const { connectDB } = require("./config/db");

async function check() {
  try {
    const pool = await connectDB();
    console.log("CONNECTED TO DB SUCCESSFULLY");

    // Check columns of MasterAnnualFee
    const annualFeeCols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'MasterAnnualFee'
    `);
    console.log("MasterAnnualFee Columns:", JSON.stringify(annualFeeCols.recordset));

    // Check columns of MasterFeeCategory
    const feeCatCols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'MasterFeeCategory'
    `);
    console.log("MasterFeeCategory Columns:", JSON.stringify(feeCatCols.recordset));

    // Check sample rows from MasterFeeCategory
    const feeCatRows = await pool.request().query(`
      SELECT TOP 10 * FROM MasterFeeCategory
    `);
    console.log("MasterFeeCategory Sample Rows:", JSON.stringify(feeCatRows.recordset));

    // Check sample rows from MasterAnnualFee
    const annualFeeRows = await pool.request().query(`
      SELECT TOP 5 * FROM MasterAnnualFee
    `);
    console.log("MasterAnnualFee Sample Rows:", JSON.stringify(annualFeeRows.recordset));

    process.exit(0);
  } catch (err) {
    console.error("SCHEMA ERROR:", err);
    process.exit(1);
  }
}

check();
