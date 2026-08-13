const { sql, getPool } = require("../config/db");
const dbName = process.env.DB_DATABASE || "DBSmartCampusBGIET";
const listSchemes = async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    const result = await request.query(`
      SELECT [CollegeName], [Scheme]
      FROM [${dbName}].[dbo].[MasterScheme]
      WHERE [CollegeName] IS NOT NULL
      ORDER BY [CollegeName], [Scheme]
    `);

    return res.status(200).json({
      success: true,
      message: "Master schemes fetched successfully.",
      data: result.recordset,
    });
  } catch (error) {
    console.error("List schemes error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch master schemes.",
    });
  }
};

const addScheme = async (req, res) => {
  try {
    const { collegeName, scheme } = req.body;

    if (!collegeName || !scheme) {
      return res.status(400).json({
        success: false,
        message: "collegeName and scheme are required.",
      });
    }

    const pool = await getPool();
    const request = pool.request();
    request.input("CollegeName", sql.VarChar(200), collegeName);
    request.input("Scheme", sql.VarChar(100), scheme);

    await request.query(`
      INSERT INTO [${dbName}].[dbo].[MasterScheme] ([CollegeName], [Scheme])
      VALUES (@CollegeName, @Scheme)
    `);

    return res.status(201).json({
      success: true,
      message: "Scheme created successfully.",
      data: { CollegeName: collegeName, Scheme: scheme },
    });
  } catch (error) {
    console.error("Add scheme error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create scheme.",
    });
  }
};

module.exports = {
  listSchemes,
  addScheme,
  getAllSchemes: listSchemes,
  createScheme: addScheme,
};