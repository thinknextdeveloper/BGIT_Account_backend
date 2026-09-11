const { sql, getPool } = require("../config/db");
const dbName = process.env.DB_DATABASE;
const getAllCategories = async () => {
  const pool = await getPool();
  const request = pool.request();

  const result = await request.query(`
    SELECT [CollegeName], [Category]
    FROM [${dbName}].[dbo].[MasterCategory]
    WHERE [CollegeName] IS NOT NULL
    ORDER BY [CollegeName], [Category]
  `);

  return result.recordset;
};

const createCategory = async (collegeName, category) => {
  const pool = await getPool();
  const request = pool.request();
  request.input("CollegeName", sql.VarChar(200), collegeName);
  request.input("Category", sql.VarChar(100), category);

  await request.query(`
    INSERT INTO [${dbName}].[dbo].[MasterCategory] ([CollegeName], [Category])
    VALUES (@CollegeName, @Category)
  `);

  return { CollegeName: collegeName, Category: category };
};

module.exports = {
  getAllCategories,
  createCategory,
};