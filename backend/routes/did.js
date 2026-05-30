const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const User = require("../models/User");
const Activity = require("../models/Activity");
const { authMiddleware } = require("../middleware/auth");

/**
 * POST /api/did/register
 * Register DID in MongoDB (blockchain tx done from frontend)
 */
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const { did, ipfsHash, txHash, publicKey } = req.body;

    if (!did || !ipfsHash) {
      return res.status(400).json({ error: "DID and IPFS hash required" });
    }

    // Check DID not already taken in DB
    const existing = await User.findOne({ did });
    if (existing && existing.walletAddress !== req.walletAddress) {
      return res.status(409).json({ error: "DID already registered" });
    }

    const user = await User.findOneAndUpdate(
      { walletAddress: req.walletAddress },
      {
        did,
        ipfsProfileHash: ipfsHash,
      },
      { new: true }
    );

    await Activity.create({
      walletAddress: req.walletAddress,
      action: "DID_CREATED",
      details: { did, ipfsHash },
      txHash: txHash || "",
    });

    res.json({ success: true, did, user });
  } catch (error) {
    console.error("DID register error:", error);
    res.status(500).json({ error: "DID registration failed" });
  }
});

/**
 * GET /api/did/resolve/:identifier
 * Resolve DID by address or DID string
 */
router.get("/resolve/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    let user;

    if (ethers.isAddress(identifier)) {
      user = await User.findOne({ walletAddress: identifier.toLowerCase() });
    } else {
      user = await User.findOne({ did: identifier });
    }

    if (!user) {
      return res.status(404).json({ error: "DID not found" });
    }

    res.json({
      did: user.did,
      walletAddress: user.walletAddress,
      ipfsHash: user.ipfsProfileHash,
      username: user.username,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: "DID resolution failed" });
  }
});

/**
 * GET /api/did/search?q=query
 * Search DID by username or address
 */
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) {
      return res.status(400).json({ error: "Query too short (min 3 chars)" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { did: { $regex: q, $options: "i" } },
        { walletAddress: { $regex: q, $options: "i" } },
      ],
      did: { $exists: true, $ne: "" },
    })
      .select("walletAddress did username avatar createdAt")
      .limit(10);

    res.json({ results: users });
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * GET /api/did/stats
 * Get platform statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDIDs = await User.countDocuments({ did: { $exists: true, $ne: "" } });
    const totalIssuers = await User.countDocuments({ role: "issuer" });

    res.json({ totalUsers, totalDIDs, totalIssuers });
  } catch (error) {
    res.status(500).json({ error: "Stats fetch failed" });
  }
});

module.exports = router;
