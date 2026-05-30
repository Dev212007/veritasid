const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

/**
 * POST /api/ipfs/upload-json
 * Upload JSON data to IPFS via Pinata
 */
router.post("/upload-json", authMiddleware, async (req, res) => {
  try {
    const { data, name } = req.body;
    if (!data) return res.status(400).json({ error: "Data is required" });

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: { name: name || `veritasid-${Date.now()}` },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Pinata error:", err);
      return res.status(500).json({ error: "IPFS upload failed" });
    }

    const result = await response.json();
    res.json({
      success: true,
      ipfsHash: result.IpfsHash,
      url: `${PINATA_GATEWAY}${result.IpfsHash}`,
    });
  } catch (error) {
    console.error("IPFS upload error:", error);
    res.status(500).json({ error: "IPFS upload failed" });
  }
});

/**
 * GET /api/ipfs/fetch/:hash
 * Fetch JSON data from IPFS
 */
router.get("/fetch/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const response = await fetch(`${PINATA_GATEWAY}${hash}`);
    if (!response.ok) return res.status(404).json({ error: "IPFS data not found" });
    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch IPFS data" });
  }
});

module.exports = router;
