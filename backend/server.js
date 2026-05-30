require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const didRoutes = require("./routes/did");
const credentialRoutes = require("./routes/credential");
const permissionRoutes = require("./routes/permission");
const ipfsRoutes = require("./routes/ipfs");
const activityRoutes = require("./routes/activity");

const app = express();
const PORT = process.env.PORT || 5000;

// ============ Middleware ============
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// ============ MongoDB Connection ============
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/veritasid")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err.message));

// ============ Routes ============
app.use("/api/auth", authRoutes);
app.use("/api/did", didRoutes);
app.use("/api/credentials", credentialRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/ipfs", ipfsRoutes);
app.use("/api/activity", activityRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "VeritasID API",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 VeritasID API running on http://localhost:${PORT}`);
});

module.exports = app;
