import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import Navbar from "../components/common/Navbar";
import { useWallet } from "../context/WalletContext";
import {
  getCredentialRegistry, generateCredentialHash,
  shortenAddress, formatTimestamp, CREDENTIAL_TYPES, CREDENTIAL_STATUS,
} from "../utils/contracts";
import { Award, Send, CheckCircle, XCircle, Users, Plus } from "lucide-react";

const CRED_TYPE_OPTIONS = [
  { value: 0, label: "College Degree" },
  { value: 1, label: "Government ID" },
  { value: 2, label: "Employment Verification" },
  { value: 3, label: "Membership" },
  { value: 4, label: "Custom" },
];

export default function IssuerPage() {
  const { account, signer, user } = useWallet();
  const [form, setForm] = useState({
    subjectAddress: "",
    credType: 0,
    typeLabel: "College Degree",
    description: "",
    metadata: "",
    expiresAt: "",
  });
  const [issuedCreds, setIssuedCreds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (signer && account) checkAuthorization();
  }, [signer, account]);

  const checkAuthorization = async () => {
    try {
      const registry = getCredentialRegistry(signer);
      const authorized = await registry.authorizedIssuers(account);
      setIsAuthorized(authorized);
    } catch { setIsAuthorized(false); }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!ethers.isAddress(form.subjectAddress)) {
      return toast.error("Invalid subject address");
    }
    if (!form.description) return toast.error("Description is required");

    setLoading(true);
    try {
      // Build credential data
      const credData = {
        type: form.typeLabel,
        subject: form.subjectAddress,
        issuer: account,
        issuedAt: Date.now(),
        description: form.description,
        metadata: form.metadata,
      };

      // Upload to IPFS
      toast.loading("Uploading to IPFS...", { id: "ipfs" });
      const ipfsRes = await axios.post("/api/ipfs/upload-json", {
        data: credData,
        name: `credential-${Date.now()}`,
      });
      toast.dismiss("ipfs");
      const { ipfsHash } = ipfsRes.data;

      // Generate hash for tamper detection
      const credentialHash = generateCredentialHash(credData);

      const expiresAtTs = form.expiresAt
        ? Math.floor(new Date(form.expiresAt).getTime() / 1000)
        : 0;

      // Issue on blockchain
      const registry = getCredentialRegistry(signer);
      toast.loading("Confirm in MetaMask...", { id: "tx" });
      const tx = await registry.issueCredential(
        form.subjectAddress,
        form.credType,
        ipfsHash,
        credentialHash,
        expiresAtTs,
        form.typeLabel
      );
      toast.loading("Waiting for confirmation...", { id: "tx" });
      const receipt = await tx.wait();
      toast.dismiss("tx");

      // Log in backend
      await axios.post("/api/credentials/issue", {
        credentialId: receipt.logs?.[0]?.topics?.[1] || "unknown",
        subjectAddress: form.subjectAddress,
        credentialType: form.credType,
        typeLabel: form.typeLabel,
        ipfsHash,
        txHash: receipt.hash,
        expiresAt: expiresAtTs,
      });

      toast.success("Credential issued successfully! 🎉");
      setIssuedCreds((prev) => [{ ...credData, ipfsHash, txHash: receipt.hash }, ...prev]);
      setForm({ subjectAddress: "", credType: 0, typeLabel: "College Degree", description: "", metadata: "", expiresAt: "" });
    } catch (err) {
      toast.dismiss("ipfs");
      toast.dismiss("tx");
      console.error(err);
      toast.error(err.reason || err.message || "Issue failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display font-bold text-3xl md:text-4xl gradient-text mb-2">Issuer Portal</h1>
          <p className="text-gray-400 font-mono text-sm">
            {isAuthorized ? (
              <span className="text-cyber-400">✓ Authorized Issuer — {shortenAddress(account)}</span>
            ) : (
              <span className="text-yellow-400">⚠ Not authorized as issuer. Contact admin.</span>
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Issue Form */}
          <div className="glass rounded-2xl p-6 border border-cyber-400/20">
            <div className="flex items-center gap-3 mb-6">
              <Plus className="w-5 h-5 text-cyber-400" />
              <h2 className="font-display font-semibold text-lg text-white">Issue New Credential</h2>
            </div>

            <form onSubmit={handleIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2">SUBJECT WALLET ADDRESS *</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={form.subjectAddress}
                  onChange={(e) => setForm({ ...form, subjectAddress: e.target.value })}
                  className="w-full bg-void-700 border border-cyber-400/20 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-400/60 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2">CREDENTIAL TYPE *</label>
                <select
                  value={form.credType}
                  onChange={(e) => {
                    const opt = CRED_TYPE_OPTIONS[e.target.value];
                    setForm({ ...form, credType: Number(e.target.value), typeLabel: opt?.label || "" });
                  }}
                  className="w-full bg-void-700 border border-cyber-400/20 rounded-lg px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-cyber-400/60 transition-colors"
                >
                  {CRED_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {form.credType === 4 && (
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-2">CUSTOM TYPE LABEL *</label>
                  <input
                    type="text"
                    placeholder="e.g. Hackathon Certificate"
                    value={form.typeLabel}
                    onChange={(e) => setForm({ ...form, typeLabel: e.target.value })}
                    className="w-full bg-void-700 border border-cyber-400/20 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-400/60"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2">DESCRIPTION *</label>
                <textarea
                  rows={3}
                  placeholder="Describe this credential..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-void-700 border border-cyber-400/20 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-400/60 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2">ADDITIONAL METADATA (JSON)</label>
                <textarea
                  rows={2}
                  placeholder='{"grade": "A+", "year": "2024"}'
                  value={form.metadata}
                  onChange={(e) => setForm({ ...form, metadata: e.target.value })}
                  className="w-full bg-void-700 border border-cyber-400/20 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-400/60 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2">EXPIRY DATE (optional)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full bg-void-700 border border-cyber-400/20 rounded-lg px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-cyber-400/60"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !isAuthorized}
                className="w-full btn-cyber-filled py-3 flex items-center justify-center gap-2 font-display tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {loading ? "Issuing..." : "Issue Credential"}
              </button>
              {!isAuthorized && (
                <p className="text-yellow-400 text-xs font-mono text-center">
                  You need issuer authorization to issue credentials
                </p>
              )}
            </form>
          </div>

          {/* Recently Issued */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-5 h-5 text-cyber-400" />
              <h2 className="font-display font-semibold text-lg text-white">Recently Issued</h2>
            </div>

            {issuedCreds.length === 0 ? (
              <div className="glass rounded-xl p-10 border border-cyber-400/10 text-center">
                <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-mono text-sm">No credentials issued yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issuedCreds.map((cred, i) => (
                  <div key={i} className="glass rounded-xl p-4 border border-cyber-400/10">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-cyber-400" />
                      <span className="font-semibold text-white text-sm">{cred.type}</span>
                    </div>
                    <div className="font-mono text-xs text-gray-400 space-y-1">
                      <div>To: <span className="text-gray-300">{shortenAddress(cred.subject)}</span></div>
                      <div>IPFS: <span className="text-cyber-400">{cred.ipfsHash?.slice(0, 20)}...</span></div>
                      <div className="text-gray-500">{new Date(cred.issuedAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
