import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/common/Navbar";
import { useWallet } from "../context/WalletContext";
import {
  getDIDRegistry, getCredentialRegistry, getPermissionManager,
  generateDID, generateCredentialHash, shortenAddress, formatTimestamp,
  CREDENTIAL_TYPES, CREDENTIAL_STATUS,
} from "../utils/contracts";
import {
  Shield, Plus, Eye, RotateCcw, Copy, Download, QrCode,
  CheckCircle, XCircle, Clock, Award, Lock, Zap,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// ── Stat Card ───────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color = "cyber" }) => (
  <div className="glass card-hover rounded-xl p-5 border border-cyber-400/10">
    <div className="flex items-center justify-between mb-3">
      <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">{label}</span>
      <Icon className={`w-5 h-5 text-${color}-400`} />
    </div>
    <div className={`font-display font-bold text-3xl text-${color}-400`}>{value}</div>
  </div>
);

// ── Credential Card ─────────────────────────────────────────────────────
const CredentialCard = ({ cred, onRevoke }) => {
  const [showQR, setShowQR] = useState(false);
  const statusColors = { Active: "status-active", Revoked: "status-revoked", Suspended: "status-pending" };
  const status = CREDENTIAL_STATUS[Number(cred.status)] || "Unknown";

  return (
    <div className="glass card-hover rounded-xl p-5 border border-cyber-400/10">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`status-dot ${statusColors[status]}`} />
            <span className="font-mono text-xs text-gray-400">{status}</span>
          </div>
          <h4 className="font-semibold text-white">{cred.credentialTypeLabel || CREDENTIAL_TYPES[Number(cred.credType)]}</h4>
        </div>
        <Award className="w-8 h-8 text-cyber-400 opacity-60" />
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-gray-500">Issuer</span>
          <span className="text-gray-300">{shortenAddress(cred.issuer)}</span>
        </div>
        <div className="flex justify-between text-xs font-mono">
          <span className="text-gray-500">Issued</span>
          <span className="text-gray-300">{formatTimestamp(cred.issuedAt)}</span>
        </div>
        {cred.expiresAt && Number(cred.expiresAt) > 0 && (
          <div className="flex justify-between text-xs font-mono">
            <span className="text-gray-500">Expires</span>
            <span className="text-yellow-400">{formatTimestamp(cred.expiresAt)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-mono">
          <span className="text-gray-500">ID</span>
          <span className="text-gray-400">{cred.credentialId?.slice(0, 10)}...</span>
        </div>
      </div>

      {showQR && (
        <div className="flex justify-center mb-4 p-3 bg-white rounded-lg">
          <QRCodeSVG value={cred.credentialId || "N/A"} size={120} />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => { navigator.clipboard.writeText(cred.credentialId); toast.success("ID copied!"); }}
          className="flex-1 btn-cyber text-xs py-1.5 flex items-center justify-center gap-1"
        >
          <Copy className="w-3 h-3" /> Copy ID
        </button>
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex-1 btn-cyber text-xs py-1.5 flex items-center justify-center gap-1"
        >
          <QrCode className="w-3 h-3" /> QR
        </button>
        {status === "Active" && (
          <button
            onClick={() => onRevoke(cred.credentialId)}
            className="flex-1 text-xs py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded font-mono transition-all flex items-center justify-center gap-1"
          >
            <XCircle className="w-3 h-3" /> Revoke
          </button>
        )}
      </div>
    </div>
  );
};

// ── Register DID Modal ──────────────────────────────────────────────────
const RegisterDIDModal = ({ onClose, onSuccess, signer, account }) => {
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const did = generateDID(account);
      const profileData = {
        did,
        owner: account,
        created: Date.now(),
        type: "VeritasID-DID-Document",
        version: "1.0",
      };

      // Upload to IPFS via backend
      const ipfsRes = await axios.post("/api/ipfs/upload-json", {
        data: profileData,
        name: `did-${account}`,
      });
      const { ipfsHash } = ipfsRes.data;

      // Get compressed public key
      const publicKey = (await signer.provider.getSigner()).address;

      // Register on blockchain
      const registry = getDIDRegistry(signer);
      toast.loading("Confirm transaction in MetaMask...", { id: "tx" });
      const tx = await registry.registerDID(did, ipfsHash, publicKey);
      toast.loading("Waiting for confirmation...", { id: "tx" });
      const receipt = await tx.wait();
      toast.dismiss("tx");

      // Record in backend
      await axios.post("/api/did/register", {
        did, ipfsHash, txHash: receipt.hash,
      });

      toast.success("DID registered on blockchain! 🎉");
      onSuccess(did);
      onClose();
    } catch (err) {
      toast.dismiss("tx");
      console.error(err);
      toast.error(err.reason || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-bright rounded-2xl p-8 max-w-md w-full border border-cyber-400/30">
        <h3 className="font-display font-bold text-xl text-white mb-2">Register Your DID</h3>
        <p className="text-gray-400 text-sm mb-6">
          This will create a Decentralized Identifier on the blockchain, linking your wallet address to a unique identity.
        </p>
        <div className="glass rounded-lg p-4 mb-6 font-mono text-sm">
          <div className="text-gray-500 text-xs mb-2">Your DID will be:</div>
          <div className="text-cyber-400 break-all">did:veritas:{account?.toLowerCase()}</div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-cyber py-3">Cancel</button>
          <button onClick={handleRegister} disabled={loading} className="flex-1 btn-cyber-filled py-3">
            {loading ? "Processing..." : "Register DID"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { account, signer, user, fetchMe } = useWallet();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    if (account) loadData();
  }, [account]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!signer) return;
      const credRegistry = getCredentialRegistry(signer);
      const permManager = getPermissionManager(signer);

      // Get credential IDs
      const credIds = await credRegistry.getSubjectCredentials(account);

      // Fetch each credential
      const creds = await Promise.all(
        credIds.map((id) => credRegistry.getCredential(id).catch(() => null))
      );
      setCredentials(creds.filter(Boolean));

      // Get permissions
      const permIds = await permManager.getSubjectPermissions(account);
      const perms = await Promise.all(
        permIds.map((id) => permManager.getPermission(id).catch(() => null))
      );
      setPermissions(perms.filter(Boolean));
    } catch (err) {
      console.error("Dashboard load error:", err);
      // If contracts not deployed yet, show empty state
      setCredentials([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCredential = async (credentialId) => {
    if (!window.confirm("Revoke this credential? This cannot be undone.")) return;
    try {
      const credRegistry = getCredentialRegistry(signer);
      toast.loading("Confirm in MetaMask...", { id: "revoke" });
      const tx = await credRegistry.revokeCredential(credentialId);
      await tx.wait();
      toast.dismiss("revoke");
      toast.success("Credential revoked");
      await axios.post("/api/credentials/revoke", { credentialId, txHash: tx.hash });
      loadData();
    } catch (err) {
      toast.dismiss("revoke");
      toast.error(err.reason || "Revocation failed");
    }
  };

  const handleRevokePermission = async (permissionId) => {
    try {
      const permManager = getPermissionManager(signer);
      toast.loading("Confirm in MetaMask...", { id: "rperm" });
      const tx = await permManager.revokePermission(permissionId);
      await tx.wait();
      toast.dismiss("rperm");
      toast.success("Permission revoked");
      await axios.post("/api/permissions/revoke", { permissionId, txHash: tx.hash });
      loadData();
    } catch (err) {
      toast.dismiss("rperm");
      toast.error(err.reason || "Failed");
    }
  };

  const activeCredentials = credentials.filter((c) => Number(c.status) === 0);
  const activePermissions = permissions.filter((p) => p.isActive);

  return (
    <div className="min-h-screen bg-void-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display font-bold text-3xl md:text-4xl gradient-text mb-2">
                Identity Dashboard
              </h1>
              <p className="text-gray-400 font-mono text-sm">
                {shortenAddress(account)} •{" "}
                <span className={user?.did ? "text-cyber-400" : "text-yellow-400"}>
                  {user?.did ? "DID Registered ✓" : "DID Not Registered"}
                </span>
              </p>
            </div>
            {!user?.did && (
              <button
                onClick={() => setShowRegisterModal(true)}
                className="btn-cyber-filled flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Register DID
              </button>
            )}
          </div>

          {/* DID Display */}
          {user?.did && (
            <div className="mt-6 glass rounded-xl p-4 border border-cyber-400/20 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs font-mono text-gray-500 mb-1">YOUR DECENTRALIZED IDENTIFIER</div>
                <div className="font-mono text-cyber-400 text-sm md:text-base break-all">{user.did}</div>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(user.did); toast.success("DID copied!"); }}
                className="btn-cyber text-xs py-2 px-4 flex items-center gap-1 flex-shrink-0"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Credentials" value={activeCredentials.length} icon={Award} />
          <StatCard label="Permissions" value={activePermissions.length} icon={Lock} />
          <StatCard label="Total Creds" value={credentials.length} icon={Shield} color="purple" />
          <StatCard label="Status" value={user?.did ? "Active" : "Setup"} icon={Zap} color={user?.did ? "cyber" : "yellow"} />
        </div>

        {/* Credentials Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-white">
              My Credentials
            </h2>
            <button
              onClick={loadData}
              className="btn-cyber text-xs py-2 px-4 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-xl p-5 border border-cyber-400/10 animate-pulse h-48" />
              ))}
            </div>
          ) : credentials.length === 0 ? (
            <div className="glass rounded-xl p-12 border border-cyber-400/10 text-center">
              <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-mono text-sm">No credentials yet</p>
              <p className="text-gray-600 text-xs mt-2">Ask an issuer to send credentials to your DID</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {credentials.map((cred, i) => (
                <CredentialCard key={i} cred={cred} onRevoke={handleRevokeCredential} />
              ))}
            </div>
          )}
        </div>

        {/* Permissions Section */}
        <div>
          <h2 className="font-display font-semibold text-xl text-white mb-6">
            Active Permissions
          </h2>
          {permissions.length === 0 ? (
            <div className="glass rounded-xl p-8 border border-cyber-400/10 text-center">
              <Lock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-mono text-sm">No active permissions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {permissions.map((perm, i) => (
                <div key={i} className="glass rounded-xl p-4 border border-cyber-400/10 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`status-dot ${perm.isActive ? "status-active" : "status-revoked"}`} />
                      <span className="font-mono text-xs text-gray-400">{perm.isActive ? "Active" : "Revoked"}</span>
                    </div>
                    <div className="font-mono text-sm text-gray-300">
                      Verifier: <span className="text-cyber-400">{shortenAddress(perm.verifier)}</span>
                    </div>
                    <div className="font-mono text-xs text-gray-500 mt-1">{perm.purpose}</div>
                  </div>
                  {perm.isActive && (
                    <button
                      onClick={() => handleRevokePermission(/* permissionId */ i)}
                      className="text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded px-3 py-1.5 font-mono transition-all"
                    >
                      Revoke Access
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showRegisterModal && (
        <RegisterDIDModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={(did) => { fetchMe(); }}
          signer={signer}
          account={account}
        />
      )}
    </div>
  );
}
