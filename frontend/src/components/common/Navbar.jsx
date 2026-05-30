import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useWallet } from "../../context/WalletContext";
import { shortenAddress } from "../../utils/contracts";
import { Menu, X, Shield, ChevronDown, LogOut, User, Activity, LayoutDashboard, Award, Search } from "lucide-react";

export default function Navbar() {
  const { account, user, isConnected, connectWallet, logout, loading } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, auth: true },
    { label: "Issuer Portal", path: "/issuer", icon: Award, auth: true },
    { label: "Verifier", path: "/verifier", icon: Search, auth: false },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "glass border-b border-cyber-400/10" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-cyber-400 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 blur-md bg-cyber-400/30 group-hover:bg-cyber-400/50 transition-all rounded" />
            </div>
            <span className="font-display font-bold text-xl tracking-wider gradient-text">
              VeritasID
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, path, auth }) => {
              if (auth && !isConnected) return null;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`px-4 py-2 rounded font-mono text-sm transition-all duration-200 ${
                    location.pathname === path
                      ? "text-cyber-400 bg-cyber-400/10 border border-cyber-400/20"
                      : "text-gray-400 hover:text-cyber-400 hover:bg-cyber-400/5"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 glass-bright px-3 py-2 rounded-lg hover:border-cyber-400/40 transition-all"
                >
                  <div className="w-2 h-2 rounded-full status-active" />
                  <span className="font-mono text-sm text-cyber-400">
                    {user?.username || shortenAddress(account)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropOpen ? "rotate-180" : ""}`} />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass-bright rounded-lg border border-cyber-400/20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-cyber-400/10">
                      <p className="text-xs text-gray-500 font-mono">Connected as</p>
                      <p className="text-sm text-cyber-400 font-mono truncate">{shortenAddress(account)}</p>
                      {user?.did && <p className="text-xs text-gray-500 font-mono truncate mt-1">{user.did}</p>}
                    </div>
                    {[
                      { label: "Profile", icon: User, path: "/profile" },
                      { label: "Activity", icon: Activity, path: "/activity" },
                    ].map(({ label, icon: Icon, path }) => (
                      <button
                        key={path}
                        onClick={() => { navigate(path); setDropOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-cyber-400 hover:bg-cyber-400/5 transition-all font-mono"
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                    <button
                      onClick={() => { logout(); setDropOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/5 transition-all font-mono border-t border-cyber-400/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="btn-cyber-filled flex items-center gap-2 text-sm py-2 px-5"
              >
                {loading ? (
                  <span className="animate-pulse">Connecting...</span>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Connect Wallet
                  </>
                )}
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-400 hover:text-cyber-400 transition-colors"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden glass border-t border-cyber-400/10 py-4 space-y-2">
            {navLinks.map(({ label, path, icon: Icon, auth }) => {
              if (auth && !isConnected) return null;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-cyber-400 font-mono text-sm"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
            {isConnected ? (
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-400 font-mono text-sm"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => { connectWallet(); setMenuOpen(false); }}
                className="w-full btn-cyber-filled text-sm py-2 mx-4"
              >
                Connect Wallet
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
