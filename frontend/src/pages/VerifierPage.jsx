import React, { useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import Navbar from "../components/common/Navbar";
import { useWallet } from "../context/WalletContext";
import {
  getCredentialRegistry, getDIDRegistry,
  shortenAddress, formatTimestamp, CREDENTIAL_TYPES, CREDENTIAL_STATUS,
} from "../utils/contracts";
import { Search, CheckCircle, XCircle, AlertCircle, Shield, Eye } from "lucide-react";

const ResultBadge = ({ valid }) =>
  valid ? (
    <span className="flex items-center gap-2 text-cyber-400 font-mono font-bold text-lg">
      <CheckCircle className="w-6 h-6" /> VALID
    </span>
  ) : (
    <span className="flex items-center gap-2 text-red-400 font-mono font-bold text-lg">
      <XCircle className="w-6 h-6" /> INVALID
    </span>
  );

export default function VerifierPage() {
  const { signer, provider } = useWallet();
  const [mode, setMode] = useState("credential"); // "credential" | "did"
  const [input, setInput] = useState("");
  const [hashInput, setHashInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verifyCredential = async () => {
    if (!input.trim()) return toast.error("Enter a Credential ID");
    if (!signer && !provider) return toast.error("Connect wallet for blockchain queries, or use read-only mode");

    setLoading(true);
    setResult(null);
    try {
      const prov = signer || provider || new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const registry = getCredentialRegistry(prov);

      const credentialId = input.trim();
      const providedHash = hashInput.trim()
        ? hashInput.trim()
        : ethers.ZeroHash;

      const [isValid, status, issuer] = await registry.verifyCredential(credentialId, providedHash);
      const cred = await registry.getCredential(credentialId);

      setResult({
        type: "credential",
        isValid,
        status: CREDENTIAL_STATUS[Number(status)],
        issuer,
        cred,
      });
    } catch (err) {
      console.error(err);
      toast.error("Credential not found or invalid ID");
      setResult({ type: "credential", isValid: false, error: "Not found" });
    } finally {
      setLoading(false);
    }
  };

  const resolveDID = async () => {
    if (!input.trim()) return toast.error("Enter a DID or wallet address");
    setLoading(true);
    setResult(null);
    try {
      const prov = signer || new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const registry = getDIDRegistry(prov);

      let didDoc;
      if (ethers.isAddress(input.trim())) {
        didDoc = await registry.resolveDID(input.trim());
      } else {
        didDoc = await registry.resolveByDID(input.trim());
      }

      setResult({ type: "did", didDoc, isValid: didDoc.isActive });
    } catch (err) {
      toast.error("DID not found");
      setResult({ type: "did", isValid: false, error: "Not found" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    if (mode === "credential") verifyCredential();
    else resolveDID();
  };

  return (
    <div className="min-h-screen bg-void-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display font-bold text-3xl md:text-4xl gradient-text mb-2">
            Verifier Portal
          </h1>
          <p className="text-gray-400 font-mono text-sm">
            Verify credentials and resolve DIDs on-chain — no login required
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 glass rounded-xl p-1">
          <button
            onClick={() => { setMode("credential"); setResult(null); setInput(""); }}
            className={`flex-1 py-3 rounded-lg font-mono text-sm transition-all ${
              mode === "credential"
                ? "bg-cyber-400/20 text-cyber-400 border border-cyber-400/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Verify Credential
          </button>
          <button
            onClick={() => { setMode("did"); setResult(null); setInput(""); }}
            className={`flex-1 py-3 rounded-lg font-mono text-sm transition-all ${
              mode === "did"
                ? "bg-cyber-400/20 text-cyber-400 border border-cyber-400/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Resolve DID
          </button>
        </div>

        {/* Input Form */}
        <div className="glass rounded-2xl p-6 border border-cyber-400/20 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2">
                {mode === "credential" ? "CREDENTIAL ID (bytes32 hash)" : "DID STRING OR WALLET ADDRESS"}
              </label>
              <input
                type="text"
                placeholder={mode === "credential" ? "0x1234abcd..." : "did:veritas:0x... or 0x..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-void-700 border border-cyber-400/20 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-400/60"
              />
            </div>

            {mode === "credential" && (
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2">
                  CREDENTIAL CONTENT HASH (optional — for tamper check)
                </label>
                <input
                  type="text"
                  placeholder="0x... keccak256 hash of credential JSON"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  className="w-full bg-void-700 border border-cyber-400/20 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-400/60"
                />
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full btn-cyber-filled py-3 flex items-center justify-center gap-2 font-display tracking-wide"
            >
              <Search className="w-4 h-4" />
              {loading ? "Querying Blockchain..." : mode === "credential" ? "Verify Credential" : "Resolve DID"}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`glass rounded-2xl p-6 border ${result.isValid ? "border-cyber-400/30 glow-border" : "border-red-500/30"}`}>
            <div className="flex items-center justify-between mb-6">
              <ResultBadge valid={result.isValid} />
              <span className="tag">{mode === "credential" ? "CREDENTIAL" : "DID"}</span>
            </div>

            {result.error ? (
              <div className="flex items-center gap-2 text-red-400 font-mono text-sm">
                <AlertCircle className="w-4 h-4" />
                {result.error}
              </div>
            ) : result.type === "credential" && result.cred ? (
              <div className="space-y-3 font-mono text-sm">
                {[
                  { k: "Type", v: result.cred.credentialTypeLabel || CREDENTIAL_TYPES[Number(result.cred.credType)] },
                  { k: "Issuer", v: shortenAddress(result.cred.issuer) },
                  { k: "Subject", v: shortenAddress(result.cred.subject) },
                  { k: "Status", v: result.status },
                  { k: "Issued At", v: formatTimestamp(result.cred.issuedAt) },
                  {
                    k: "Expires",
                    v: Number(result.cred.expiresAt) === 0 ? "Never" : formatTimestamp(result.cred.expiresAt),
                  },
                  { k: "IPFS Hash", v: result.cred.ipfsHash?.slice(0, 24) + "..." },
                ].map(({ k, v }) => (
                  <div key={k} className="flex justify-between items-center border-b border-cyber-400/10 pb-2">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-gray-200">{v}</span>
                  </div>
                ))}
              </div>
            ) : result.type === "did" && result.didDoc ? (
              <div className="space-y-3 font-mono text-sm">
                {[
                  { k: "DID", v: result.didDoc.did },
                  { k: "Owner", v: shortenAddress(result.didDoc.owner) },
                  { k: "Status", v: result.didDoc.isActive ? "Active" : "Deactivated" },
                  { k: "Created", v: formatTimestamp(result.didDoc.createdAt) },
                  { k: "Updated", v: formatTimestamp(result.didDoc.updatedAt) },
                  { k: "IPFS Doc", v: result.didDoc.ipfsHash?.slice(0, 24) + "..." },
                ].map(({ k, v }) => (
                  <div key={k} className="flex justify-between items-center border-b border-cyber-400/10 pb-2">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-gray-200 break-all text-right max-w-xs">{v}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
