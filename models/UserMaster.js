const { sql } = require("../config/db");

const findUser = async (userName, loginType) => {
  const result = await sql.query`
    SELECT *
    FROM UserMaster
    WHERE UserName = ${userName}
      AND LoginType = ${loginType}
  `;

  return result.recordset[0];
};

const createUser = async (user) => {
  await sql.query`
    INSERT INTO UserMaster
    (
      UserName,
      Password,
      LoginType,
      ApplicationType,
      ApplicationName,
      CollegeName,
      RightsLevel,
      RememberPSW,
      CollegeId
    )
    VALUES
    (
      ${user.UserName},
      ${user.Password},
      ${user.LoginType},
      ${user.ApplicationType},
      ${user.ApplicationName},
      ${user.CollegeName},
      ${user.RightsLevel},
      ${user.RememberPSW},
      ${user.CollegeId}
    )
  `;
};

module.exports = {
  findUser,
  createUser,
};