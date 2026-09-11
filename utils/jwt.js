const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.Id,
      username: user.UserName,
      role: user.Role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};
console.log("JWT_SECRET =", process.env.JWT_SECRET);
module.exports = { generateToken };