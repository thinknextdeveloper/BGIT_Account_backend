const { sql, getPool } = require("../config/db");
const dbName = process.env.DB_DATABASE;
const getLedgerNamesForCollege = async (collegeName) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);

  const result = await request.query(`
    SELECT DISTINCT [LedgerName]
    FROM [${dbName}].[dbo].[Ledger]
    WHERE [CollegeName] = @CollegeName
      AND [LedgerName] IS NOT NULL
    ORDER BY [LedgerName]
  `);

  return result.recordset.map((r) => r.LedgerName);
};

const getConcessionReport = async (collegeName, ledgerName) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);

  let query = `
    SELECT
      RegistrationNo,
      IDNo,
      UniRollNo,
      StudentName,
      Class,
      LedgerName,
      SUM(Debit) AS ConcessionGiven
    FROM Ledger
    WHERE CollegeName = @CollegeName
      AND ConcessionEntry = 'Yes'
  `;

  if (ledgerName) {
    query += ` AND LedgerName = @LedgerName`;
    request.input("LedgerName", sql.VarChar(100), ledgerName);
  }

  query += `
    GROUP BY IDNo, RegistrationNo, UniRollNo, StudentName, Class, LedgerName
    ORDER BY IDNo
  `;

  const result = await request.query(query);
  return result.recordset;
};

module.exports = {
  getLedgerNamesForCollege,
  getConcessionReport,
};