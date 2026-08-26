// const bcrypt = require("bcryptjs");
// const { sql } = require("../config/db");
// const { generateToken } = require("../utils/jwt");

// const login = async (req, res) => {
//   try {
//     const { name, password, level } = req.body;

//     if (!name || !password || !level) {
//       return res.status(400).json({
//         success: false,
//         message: "Name, Password and Level are required.",
//       });
//     }

//     const request = new sql.Request();
//     request.input("UserName", sql.VarChar(100), name);
//     request.input("ApplicationName", sql.VarChar(100), "Accounts");
//     const result = await request.execute("sp_GetUserForLogin");

//     // if (!result.recordset || result.recordset.length === 0) {
//     //   return res.status(401).json({
//     //     success: false,
//     //     message: "Invalid username, password, or level.",
//     //   });
//     // }

//     const user = result.recordset[0];

//     const dbLoginType = String(user.LoginType || "").trim();
//     const dbPassword = String(user.Password || "").trim();
//     const submittedLevel = String(level || "").trim();
//     const submittedPassword = String(password || "").trim();
//     const dbApplicationName = String(user.ApplicationName || "").trim();


//     console.log("User from DB:", user);

//     console.log("DB UserName:", user.UserName);
//     console.log("DB Password:", user.Password);
//     console.log("DB LoginType:", user.LoginType);
//     console.log("DB ApplicationName:", user.ApplicationName);

//     console.log("Request Body:", req.body);
//     // if (dbLoginType.toLowerCase() !== submittedLevel.toLowerCase()) {
//     //   return res.status(401).json({
//     //     success: false,
//     //     message: "Invalid username, password, or level.",
//     //   });
//     // }

//     if (dbPassword !== submittedPassword) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid  password.",
//       });
//     }
//     if (dbLoginType.toLowerCase() !== submittedLevel.toLowerCase()) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid login level.",
//       });

//     }
//     if (dbApplicationName.toLowerCase() !== "accounts") {
//       return res.status(401).json({
//         success: false,
//         message: "You are not authorized to access the Accounts application.",
//       });
//     }
//     const token = generateToken({
//       Id: user.UserMasterID,
//       UserName: user.UserName,
//       Role: user.LoginType,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Login successful.",
//       data: {
//         token,
//         user: {
//           id: user.UserMasterID,
//           username: user.UserName,
//           role: user.LoginType,
//           rightsLevel: user.RightsLevel,
//           collegeId: user.CollegeId,
//           applicationName: user.ApplicationName,
//           collegeName: user.CollegeName,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     return res.status(500).json({
//      success: false,
//     message: error.message || "Something went wrong. Please try again.",
//     error: error.stack, // Optional: remove this in production
//     });
//   }
// };

// module.exports = {
//   login,
// };
const bcrypt = require("bcryptjs");
const { sql, withRetry } = require("../config/db");
const { generateToken } = require("../utils/jwt");

const login = async (req, res) => {
  try {
    const { name, password, level } = req.body;

    if (!name || !password || !level) {
      return res.status(400).json({
        success: false,
        message: "Name, Password and Level are required.",
      });
    }

    const result = await withRetry(async (pool) => {
      const request = pool.request();
      request.input("UserName", sql.VarChar(100), name);
      request.input("ApplicationName", sql.VarChar(100), "Accounts");
      return request.execute("sp_GetUserForLogin");
    });

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username, password, or level.",
      });
    }

    const user = result.recordset[0];

    const dbLoginType = String(user.LoginType || "").trim();
    const dbPassword = String(user.Password || "").trim();
    const submittedLevel = String(level || "").trim();
    const submittedPassword = String(password || "").trim();
    const dbApplicationName = String(user.ApplicationName || "").trim();

    console.log("User from DB:", user);
    console.log("DB UserName:", user.UserName);
    console.log("DB Password:", user.Password);
    console.log("DB LoginType:", user.LoginType);
    console.log("DB ApplicationName:", user.ApplicationName);
    console.log("Request Body:", req.body);

    if (dbPassword !== submittedPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid  password.",
      });
    }

    if (dbLoginType.toLowerCase() !== submittedLevel.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: "Invalid login level.",
      });
    }

    if (dbApplicationName.toLowerCase() !== "accounts") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to access the Accounts application.",
      });
    }

    const token = generateToken({
      Id: user.UserMasterID,
      UserName: user.UserName,
      Role: user.LoginType,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: {
          id: user.UserMasterID,
          username: user.UserName,
          role: user.LoginType,
          rightsLevel: user.RightsLevel,
          collegeId: user.CollegeId,
          applicationName: user.ApplicationName,
          collegeName: user.CollegeName,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong. Please try again.",
      error: error.stack, 
    });
  }
};

module.exports = {
  login,
};