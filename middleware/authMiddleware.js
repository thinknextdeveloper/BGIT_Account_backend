const jwt = require("jsonwebtoken");

/**
 * Middleware to authenticate requests using JWT token.
 * Extracts token from Authorization header (Bearer <token>).
 * Attaches decoded user payload (id, username, role) to req.user.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is missing or unauthorized.",
    });
  }

  const secretKey = process.env.JWT_SECRET || "default_secret_key";

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
