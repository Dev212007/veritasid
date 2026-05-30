import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/common/Navbar";
import { useWallet } from "../context/WalletContext";
import { shortenAddress } from "../utils/contracts";
import { User, Save, Shield, Copy } from "lucide-react";

export default function ProfilePage() {
  const { account, user, fetchMe } = useWallet();
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    bio: user?.bio || "",
    recoveryWallet: user?.recoveryWallet || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put("/api/auth/profile", form);
      await fetchMe();
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <h1 className="font-display font-bold text-3xl gradient-text mb-8">Profile</h1>

        {/* Identity Card */}
        <div className="glass rounded-2xl p-6 border border-cyber-400/20 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-cyber-400/10 border-2 border-cyber-400/30 flex items-center justify-center">
              <User className="w-8 h-8 text-cyber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-xl">{user?.username || "Anonymous"}</h2>
              <p className="font-mono text-sm text-gray-400">{shortenAddress(account)}</p>
              <span className="tag mt-1">{user?.role?.toUpperCase()}</span>
            </div>
          </div>

          {user?.did && (
            <div className="glass rounded-lg p-4 border border-cyber-400/10">
              <div className="text-xs font-mono text-gray-500 mb-1">DID</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-cyber-400 break-all flex-1">{user.did}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(user.did); toast.success("Copied!"); }}
                  className="text-gray-400 hover:text-cyber-400 transition-colors flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="glass rounded-2xl p-6 border border-cyber-400/20">
          <h3 className="font-display font-semibold text-lg text-white mb-6">Edit Profile</h3>
          <form onSubmit={handleSave} className="space-y-4">
            {[
              { key: "username", label: "USERNAME", placeholder: "your_name" },
              { key: "email", label: "EMAIL", placeholder: "you@example.com", type: "email" },
              { key: "bio", label: "BIO", placeholder: "Tell the world about yourself..." },
              { key: "recoveryWallet", label: "RECOVERY WALLET", placeholder: "0x... backup wallet address" },
            ].map(({ key, label, placeholder, type = "text" }) => (
              <div key={key}>
                <label className="block text-xs font-mono text-gray-400 mb-2">{label}</label>
                {key === "bio" ? (
                  <textarea
                    rows={3}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-void-700 border border-cyber-400/20 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-400/60 resize-none"
                  />
                ) : (
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-void-700 border border-cyber-400/20 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-400/60"
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="w-full btn-cyber-filled py-3 flex items-center justify-center gap-2 font-display tracking-wide"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
