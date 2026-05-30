const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const { authMiddleware } = require("../middleware/auth");

/**
 * GET /api/activity/my
 * Get current user's activity log
 */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const activities = await Activity.find({ walletAddress: req.walletAddress })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Activity.countDocuments({ walletAddress: req.walletAddress });

    res.json({ activities, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

module.exports = router;
