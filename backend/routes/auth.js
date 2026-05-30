const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Activity = require("../models/Activity");
const { authMiddleware } = require("../middleware/auth");

/**
 * GET /api/auth/nonce/:address
 * Get signing nonce for a wallet address
 */
router.get("/nonce/:address", async (req, res) => {
  try {
    const walletAddress = req.params.address.toLowerCase();

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    let user = await User.findOne({ walletAddress });

    if (!user) {
      // Auto-create user on first nonce request
      user = new User({ walletAddress });
      await user.save();
    }

    const message = `Welcome to VeritasID!\n\nSign this message to authenticate.\n\nNonce: ${user.nonce}\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;

    res.json({
      nonce: user.nonce,
      message,
      walletAddress,
    });
  } catch (error) {
    console.error("Nonce error:", error);
    res.status(500).json({ error: "Failed to get nonce" });
  }
});

/**
 * POST /api/auth/verify
 * Verify wallet signature and return JWT
 */
router.post("/verify", async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    if (!ethers.isAddress(normalizedAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Find user and check nonce
    const user = await User.findOne({ walletAddress: normalizedAddress });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!message.includes(user.nonce)) {
      return res.status(401).json({ error: "Invalid or expired nonce" });
    }

    // Rotate nonce to prevent replay attacks
    user.refreshNonce();
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      {
        walletAddress: normalizedAddress,
        role: user.role,
        did: user.did,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Log activity
    await Activity.create({
      walletAddress: normalizedAddress,
      action: "LOGIN",
      details: { method: "wallet_signature" },
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: {
        walletAddress: user.walletAddress,
        did: user.did,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Auth verify error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get("/me", authMiddleware, async (req, res) => {
  res.json({
    user: {
      walletAddress: req.user.walletAddress,
      did: req.user.did,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      bio: req.user.bio,
      ipfsProfileHash: req.user.ipfsProfileHash,
      recoveryWallet: req.user.recoveryWallet,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin,
    },
  });
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { username, email, bio, avatar, recoveryWallet } = req.body;
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email.toLowerCase();
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (recoveryWallet !== undefined) {
      if (recoveryWallet && !ethers.isAddress(recoveryWallet)) {
        return res.status(400).json({ error: "Invalid recovery wallet address" });
      }
      updates.recoveryWallet = recoveryWallet.toLowerCase();
    }

    const user = await User.findOneAndUpdate(
      { walletAddress: req.walletAddress },
      updates,
      { new: true }
    );

    await Activity.create({
      walletAddress: req.walletAddress,
      action: "PROFILE_UPDATED",
      details: { fields: Object.keys(updates) },
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: "Profile update failed" });
  }
});

module.exports = router;
