const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    did: {
      type: String,
      unique: true,
      sparse: true,
    },
    username: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    ipfsProfileHash: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "issuer", "verifier", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    nonce: {
      type: String,
      default: () => Math.floor(Math.random() * 1000000).toString(),
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    recoveryWallet: {
      type: String,
      default: "",
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Refresh nonce after each login
userSchema.methods.refreshNonce = function () {
  this.nonce = Math.floor(Math.random() * 1000000).toString();
};

module.exports = mongoose.model("User", userSchema);
