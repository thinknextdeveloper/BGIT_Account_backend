const { sql } = require("../config/db");
const dbName = process.env.DB_DATABASE || "DBSmartCampusBGIET";
const getAllMenuItems = async () => {
  const result = await sql.query`
    SELECT
      ID_ITEM,
      NAME,
      HIERAR,
      TEXT,
      [DESC],
      FUNC
    FROM ITEMS
    ORDER BY HIERAR
  `;

  return result.recordset;
};

const getMenuItemById = async (idItem) => {
  const result = await sql.query`
    SELECT
      ID_ITEM,
      NAME,
      HIERAR,
      TEXT,
      [DESC],
      FUNC
    FROM ITEMSNEW
    WHERE ID_ITEM = ${idItem}
  `;

  return result.recordset[0];
};

const createMenuItem = async (item) => {
  await sql.query`
    INSERT INTO ITEMSNEW
    (
      ID_ITEM,
      NAME,
      HIERAR,
      TEXT,
      [DESC],
      FUNC
    )
    VALUES
    (
      ${item.ID_ITEM},
      ${item.NAME},
      ${item.HIERAR},
      ${item.TEXT},
      ${item.DESC},
      ${item.FUNC}
    )
  `;
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
};