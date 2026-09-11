const { sql } = require("../config/db");

/**
 * Scheme Repository Layer
 * Interacts with MSSQL MasterScheme table using parameterized queries.
 */
class SchemeRepository {
  /**
   * Fetch distinct CollegeName and Scheme records from MasterScheme for assigned user colleges
   */
  async getSchemes(username, collegeName = null) {
    const request = new sql.Request();
    request.input("username", sql.VarChar(100), username);
    request.input("collegeName", sql.VarChar(100), collegeName || null);

    const query = `
      SELECT DISTINCT ms.CollegeName, ms.Scheme
      FROM MasterScheme ms
      INNER JOIN UserMaster um ON ms.CollegeName = um.CollegeName
      WHERE um.UserName = @username
        AND (@collegeName IS NULL OR ms.CollegeName = @collegeName)
      ORDER BY ms.CollegeName ASC, ms.Scheme ASC;
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Insert new CollegeName and Scheme record into MasterScheme
   */
  async createScheme(collegeName, scheme) {
    const request = new sql.Request();
    request.input("collegeName", sql.VarChar(100), collegeName);
    request.input("scheme", sql.VarChar(100), scheme);

    const checkQuery = `
      SELECT COUNT(1) AS existingCount
      FROM MasterScheme
      WHERE CollegeName = @collegeName AND Scheme = @scheme;
    `;
    const checkResult = await request.query(checkQuery);
    if (checkResult.recordset[0]?.existingCount > 0) {
      throw new Error("This Scheme already exists for the selected College.");
    }

    const insertQuery = `
      INSERT INTO MasterScheme (CollegeName, Scheme)
      VALUES (@collegeName, @scheme);
    `;
    await request.query(insertQuery);
    return true;
  }
}

module.exports = new SchemeRepository();
