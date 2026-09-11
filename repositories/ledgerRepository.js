const { sql } = require("../config/db");

/**
 * Ledger Repository Layer
 * Interacts with MSSQL MasterLedgers table using parameterized queries.
 */
class LedgerRepository {
  /**
   * Fetch distinct CollegeName and LedgerName records from MasterLedgers for assigned user colleges
   */
  async getLedgers(username, collegeName = null) {
    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);
    request.input("collegeName", sql.VarChar(100), collegeName || null);

    const query = `
      SELECT DISTINCT ml.CollegeName, ml.LedgerName
      FROM MasterLedgers ml
      INNER JOIN UserMaster um ON ml.CollegeName = um.CollegeName
      WHERE CAST(um.UserName AS VARCHAR(100)) = @username
        AND (@collegeName IS NULL OR ml.CollegeName = @collegeName)
      ORDER BY ml.CollegeName ASC, ml.LedgerName ASC;
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Insert new CollegeName and LedgerName record into MasterLedgers with duplicate check
   */
  async createLedger(collegeName, ledgerName) {
    const request = new sql.Request();
    request.input("collegeName", sql.VarChar(100), collegeName);
    request.input("ledgerName", sql.VarChar(100), ledgerName);

    // Duplicate Check matching VB.NET Select LedgerName from MasterLedgers where LedgerName='...' And CollegeName='...'
    const checkQuery = `
      SELECT COUNT(1) AS existingCount
      FROM MasterLedgers
      WHERE LedgerName = @ledgerName AND CollegeName = @collegeName;
    `;
    const checkResult = await request.query(checkQuery);
    if (checkResult.recordset[0]?.existingCount > 0) {
      throw new Error("This LedgerName Already Exist.");
    }

    const insertQuery = `
      INSERT INTO MasterLedgers (CollegeName, LedgerName)
      VALUES (@collegeName, @ledgerName);
    `;
    await request.query(insertQuery);
    return true;
  }


  
}

module.exports = new LedgerRepository();
