const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const { authMiddleware } = require("../middleware/auth");

router.post("/grant", authMiddleware, async (req, res) => {
  try {
    const { verifierAddress, credentialId, purpose, txHash, expiresAt } = req.body;
    if (!verifierAddress) return res.status(400).json({ error: "verifierAddress required" });

    await Activity.create({
      walletAddress: req.walletAddress,
      action: "PERMISSION_GRANTED",
      details: { verifierAddress, credentialId, purpose, expiresAt },
      txHash: txHash || "",
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to log permission grant" });
  }
});

router.post("/revoke", authMiddleware, async (req, res) => {
  try {
    const { permissionId, txHash } = req.body;
    if (!permissionId) return res.status(400).json({ error: "permissionId required" });

    await Activity.create({
      walletAddress: req.walletAddress,
      action: "PERMISSION_REVOKED",
      details: { permissionId },
      txHash: txHash || "",
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to log permission revoke" });
  }
});

module.exports = router;
