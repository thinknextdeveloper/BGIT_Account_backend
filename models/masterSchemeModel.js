const { sql, getPool } = require("../config/db");
const dbName = process.env.DB_DATABASE;
const getAllSchemes = async () => {
  const pool = await getPool();
  const request = pool.request();

  const result = await request.query(`
    SELECT [CollegeName], [Scheme]
    FROM [${dbName}].[dbo].[MasterScheme]
    WHERE [CollegeName] IS NOT NULL
    ORDER BY [CollegeName], [Scheme]
  `);

  return result.recordset;
};

const createScheme = async (collegeName, scheme) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);
  request.input("Scheme", sql.VarChar(100), scheme);

  await request.query(`
    INSERT INTO [${dbName}].[dbo].[MasterScheme] ([CollegeName], [Scheme])
    VALUES (@CollegeName, @Scheme)
  `);

  return { CollegeName: collegeName, Scheme: scheme };
};

module.exports = {
  getAllSchemes,
  createScheme,
};