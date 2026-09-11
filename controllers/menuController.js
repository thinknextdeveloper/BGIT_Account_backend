const { getAllMenuItems } = require("../models/ITEMSNEW");

const buildMenuTree = (items) => {
  const nodeMap = {};

  items.forEach((item) => {
    const hierarKey = String(item.HIERAR).trim();
    nodeMap[hierarKey] = {
      id: item.ID_ITEM,
      name: item.NAME,
      hierar: hierarKey,
      text: item.TEXT,
      desc: item.DESC,
      func: item.FUNC,
      children: [],
    };
  });

  const roots = [];

  items.forEach((item) => {
    const hierarKey = String(item.HIERAR).trim();
    const node = nodeMap[hierarKey];
    const lastDotIndex = hierarKey.lastIndexOf(".");

    if (lastDotIndex === -1) {
      roots.push(node);
    } else {
      const parentKey = hierarKey.substring(0, lastDotIndex);
      const parentNode = nodeMap[parentKey];
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  return roots;
};

const getMenu = async (req, res) => {
  try {
    const items = await getAllMenuItems();

    if (!items || items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No menu items found.",
        data: [],
      });
    }

    const tree = buildMenuTree(items);

    return res.status(200).json({
      success: true,
      message: "Menu items fetched successfully.",
      data: tree,
    });
  } catch (error) {
    console.error("Get menu error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  getMenu,
};