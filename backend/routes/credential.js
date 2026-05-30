const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const { authMiddleware, issuerMiddleware } = require("../middleware/auth");
const User = require("../models/User");

/**
 * POST /api/credentials/issue
 * Record a newly issued credential (blockchain tx done from frontend)
 */
router.post("/issue", issuerMiddleware, async (req, res) => {
  try {
    const { credentialId, subjectAddress, credentialType, ipfsHash, txHash, typeLabel, expiresAt } = req.body;
    if (!credentialId || !subjectAddress || !credentialType || !ipfsHash) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await Activity.create({
      walletAddress: req.walletAddress,
      action: "CREDENTIAL_ISSUED",
      details: { credentialId, subjectAddress, credentialType, typeLabel, ipfsHash, expiresAt },
      txHash: txHash || "",
    });

    await Activity.create({
      walletAddress: subjectAddress.toLowerCase(),
      action: "CREDENTIAL_RECEIVED",
      details: { credentialId, issuerAddress: req.walletAddress, credentialType, typeLabel },
      txHash: txHash || "",
    });

    res.json({ success: true, credentialId });
  } catch (error) {
    console.error("Issue credential error:", error);
    res.status(500).json({ error: "Failed to record credential issuance" });
  }
});

/**
 * POST /api/credentials/verify
 * Log a verification attempt
 */
router.post("/verify", authMiddleware, async (req, res) => {
  try {
    const { credentialId, subjectAddress, result } = req.body;

    await Activity.create({
      walletAddress: req.walletAddress,
      action: "CREDENTIAL_VERIFIED",
      details: { credentialId, subjectAddress, result },
    });

    res.json({ success: true, logged: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to log verification" });
  }
});

/**
 * POST /api/credentials/revoke
 * Log credential revocation
 */
router.post("/revoke", issuerMiddleware, async (req, res) => {
  try {
    const { credentialId, txHash } = req.body;
    if (!credentialId) return res.status(400).json({ error: "credentialId required" });

    await Activity.create({
      walletAddress: req.walletAddress,
      action: "CREDENTIAL_REVOKED",
      details: { credentialId },
      txHash: txHash || "",
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to record revocation" });
  }
});

/**
 * GET /api/credentials/history/:address
 * Get credential activity for an address
 */
router.get("/history/:address", authMiddleware, async (req, res) => {
  try {
    const { address } = req.params;
    if (address.toLowerCase() !== req.walletAddress && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const activities = await Activity.find({
      walletAddress: address.toLowerCase(),
      action: { $in: ["CREDENTIAL_ISSUED", "CREDENTIAL_RECEIVED", "CREDENTIAL_VERIFIED", "CREDENTIAL_REVOKED"] },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;
