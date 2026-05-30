const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      // Examples: DID_CREATED, CREDENTIAL_ISSUED, CREDENTIAL_VERIFIED,
      //           PERMISSION_GRANTED, PERMISSION_REVOKED, LOGIN, PROFILE_UPDATED
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    txHash: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    success: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ walletAddress: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
