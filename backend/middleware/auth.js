const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ walletAddress: decoded.walletAddress.toLowerCase() });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.user = user;
    req.walletAddress = user.walletAddress;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(500).json({ error: "Authentication error" });
  }
};

const issuerMiddleware = async (req, res, next) => {
  await authMiddleware(req, res, () => {
    if (!["issuer", "admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Issuer role required" });
    }
    next();
  });
};

const adminMiddleware = async (req, res, next) => {
  await authMiddleware(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin role required" });
    }
    next();
  });
};

module.exports = { authMiddleware, issuerMiddleware, adminMiddleware };
