import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import Navbar from "../components/common/Navbar";
import {
  Shield, Lock, Globe, Zap, CheckCircle, Key, Database,
  Eye, Users, Award, ArrowRight, Github, Twitter, ExternalLink
} from "lucide-react";

// ── Hero Particle Canvas ────────────────────────────────────────────────
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,207,${p.alpha})`;
        ctx.fill();
      });
      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,229,207,${0.1 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

// ── Feature Card ────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, desc, delay = 0 }) => (
  <div className="glass card-hover rounded-xl p-6 border border-cyber-400/10" style={{ animationDelay: `${delay}ms` }}>
    <div className="w-12 h-12 rounded-lg bg-cyber-400/10 border border-cyber-400/20 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-cyber-400" />
    </div>
    <h3 className="font-display font-semibold text-white mb-2 text-sm tracking-wide">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

// ── Step Card ───────────────────────────────────────────────────────────
const StepCard = ({ num, title, desc }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-cyber-400 flex items-center justify-center font-display font-bold text-cyber-400 text-sm">
      {num}
    </div>
    <div>
      <h4 className="font-semibold text-white mb-1">{title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ── Tech Badge ──────────────────────────────────────────────────────────
const TechBadge = ({ label }) => (
  <span className="tag text-sm py-1.5 px-3">{label}</span>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { isConnected, connectWallet, loading } = useWallet();

  const handleGetStarted = () => {
    if (isConnected) navigate("/dashboard");
    else connectWallet();
  };

  return (
    <div className="min-h-screen bg-void-900 overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center cyber-grid overflow-hidden">
        <ParticleCanvas />
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4 pt-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full border border-cyber-400/20 mb-8">
            <div className="w-2 h-2 rounded-full status-active" />
            <span className="font-mono text-xs text-cyber-400 tracking-widest uppercase">
              Powered by Blockchain
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl mb-6 leading-none tracking-tight">
            <span className="gradient-text glow-text">VeritasID</span>
          </h1>
          <p className="font-display text-xl md:text-2xl text-gray-300 mb-4 tracking-wide">
            Your Identity. Your Keys. Your Control.
          </p>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            A fully decentralized identity platform built on blockchain technology.
            Own your credentials, authenticate without passwords, and share only what you choose.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGetStarted}
              disabled={loading}
              className="btn-cyber-filled flex items-center gap-2 text-base px-8 py-4 rounded-lg font-display tracking-wide"
            >
              {loading ? "Connecting..." : isConnected ? "Go to Dashboard" : "Connect Wallet & Start"}
              <ArrowRight className="w-5 h-5" />
            </button>
            <a href="#how-it-works" className="btn-cyber flex items-center gap-2 text-base px-8 py-4 rounded-lg font-display tracking-wide">
              How it Works
            </a>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { label: "Privacy First", val: "100%" },
              { label: "Decentralized", val: "True" },
              { label: "No Password", val: "Ever" },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="font-display font-black text-2xl md:text-3xl text-cyber-400 glow-text">{val}</div>
                <div className="font-mono text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void-900 to-transparent" />
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="tag mb-4">Core Features</p>
          <h2 className="font-display font-bold text-3xl md:text-5xl text-white mb-4">
            Everything You Need for <span className="gradient-text">Self-Sovereign Identity</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Built for a world where you control your data — not corporations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard icon={Shield} title="Decentralized Identity (DID)" desc="Generate a unique DID tied to your wallet. No central authority. Your identity lives on the blockchain." delay={0} />
          <FeatureCard icon={Key} title="Wallet Authentication" desc="Sign in with MetaMask — no passwords, no email, no tracking. Pure cryptographic identity." delay={100} />
          <FeatureCard icon={Award} title="Verifiable Credentials" desc="Receive digitally signed credentials from trusted institutions — degrees, IDs, employment proofs." delay={200} />
          <FeatureCard icon={Eye} title="Selective Disclosure" desc="Share only what verifiers need. Minimal data, maximum privacy. You decide what to reveal." delay={300} />
          <FeatureCard icon={Database} title="IPFS Storage" desc="Credentials and documents stored on decentralized IPFS. Only hashes live on the blockchain." delay={400} />
          <FeatureCard icon={Globe} title="Cross-Platform Verification" desc="Verifiers can check credentials instantly without contacting the original issuer." delay={500} />
          <FeatureCard icon={Lock} title="Smart Contract Security" desc="Tamper-proof contracts enforce access control, revocation, and permission management." delay={600} />
          <FeatureCard icon={Users} title="Role-Based Portals" desc="Separate dashboards for users, issuers (institutions), and verifiers (companies)." delay={700} />
          <FeatureCard icon={Zap} title="ZK-Ready Architecture" desc="Built with zero-knowledge proof compatibility in mind for future privacy upgrades." delay={800} />
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 bg-void-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="tag mb-4">Workflow</p>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-white">
              How <span className="gradient-text">VeritasID</span> Works
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <h3 className="font-display font-semibold text-cyber-400 text-sm uppercase tracking-widest">For Identity Holders</h3>
              <StepCard num="01" title="Connect Your Wallet" desc="Install MetaMask and connect to VeritasID. Your wallet address becomes your unique identifier." />
              <StepCard num="02" title="Register Your DID" desc="Generate a Decentralized Identifier (DID) on-chain. Your profile metadata is stored on IPFS." />
              <StepCard num="03" title="Collect Credentials" desc="Trusted issuers (universities, employers, governments) issue signed credentials to your DID." />
              <StepCard num="04" title="Share Selectively" desc="Grant verifiers access to specific credentials with expiring permissions. Revoke anytime." />
            </div>
            <div className="space-y-8">
              <h3 className="font-display font-semibold text-cyber-400 text-sm uppercase tracking-widest">For Issuers & Verifiers</h3>
              <StepCard num="01" title="Get Issuer Role" desc="Organizations request issuer authorization on-chain. Verified by admin for trust." />
              <StepCard num="02" title="Issue Credentials" desc="Upload credential data to IPFS, store hash on blockchain, and sign it cryptographically." />
              <StepCard num="03" title="Request Verification" desc="Verifiers request credential access from users via the Verifier Portal." />
              <StepCard num="04" title="Instant On-Chain Check" desc="Check credential hash, status, and issuer authenticity directly on the blockchain." />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECURITY ─────────────────────────────────────────────────── */}
      <section id="security" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="tag mb-4">Security</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-6">
              Built Security-First, <span className="gradient-text">From The Ground Up</span>
            </h2>
            <div className="space-y-4">
              {[
                "Cryptographic signature-based authentication",
                "No centralized data store — all data on IPFS + blockchain",
                "Smart contract role-based access control",
                "Credential hash tamper detection",
                "Nonce-based replay attack prevention",
                "Granular permission management with expiry",
                "Credential revocation mechanism",
                "Zero-knowledge proof ready architecture",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-8 border border-cyber-400/20 glow-border relative overflow-hidden">
            <div className="scan-line absolute inset-0" />
            <div className="font-mono text-sm space-y-3 relative z-10">
              {[
                { k: "DID", v: "did:veritas:0x742d...4a8f", c: "text-cyber-400" },
                { k: "Status", v: "✓ Active & Verified", c: "text-green-400" },
                { k: "Chain", v: "Ethereum (Hardhat Local)", c: "text-purple-400" },
                { k: "Storage", v: "IPFS (Pinata Gateway)", c: "text-blue-400" },
                { k: "Auth", v: "Wallet Signature (EIP-191)", c: "text-yellow-400" },
                { k: "Credentials", v: "3 Active / 0 Revoked", c: "text-cyber-400" },
                { k: "Permissions", v: "2 Active Grants", c: "text-orange-400" },
              ].map(({ k, v, c }) => (
                <div key={k} className="flex justify-between items-center border-b border-cyber-400/10 pb-2">
                  <span className="text-gray-500">{k}</span>
                  <span className={c}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────────────────── */}
      <section id="tech" className="py-24 px-4 bg-void-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <p className="tag mb-4">Built With</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-12">
            Production-Grade <span className="gradient-text">Tech Stack</span>
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              "React.js", "Vite", "Tailwind CSS", "Ethers.js", "MetaMask",
              "Solidity", "Hardhat", "Node.js", "Express.js", "MongoDB",
              "IPFS", "Pinata", "JWT", "EIP-191", "Web3",
            ].map((tech) => <TechBadge key={tech} label={tech} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center glass rounded-2xl p-12 border border-cyber-400/20 glow-border relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-glow opacity-50 pointer-events-none" />
          <h2 className="font-display font-black text-3xl md:text-5xl gradient-text mb-4 relative z-10">
            Own Your Identity Today
          </h2>
          <p className="text-gray-400 mb-8 relative z-10">
            Join the decentralized identity revolution. No sign-up, no password, no third party.
          </p>
          <button
            onClick={handleGetStarted}
            disabled={loading}
            className="btn-cyber-filled text-base px-10 py-4 rounded-lg font-display tracking-wide flex items-center gap-2 mx-auto relative z-10"
          >
            {loading ? "Connecting..." : "Get Started Free"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-cyber-400/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyber-400" />
            <span className="font-display font-bold text-white">VeritasID</span>
            <span className="text-gray-500 text-sm font-mono ml-2">v1.0.0 — Hackathon Build</span>
          </div>
          <p className="text-gray-500 text-sm font-mono">
            Built with ❤️ for a decentralized future
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-500 hover:text-cyber-400 transition-colors"><Github className="w-5 h-5" /></a>
            <a href="#" className="text-gray-500 hover:text-cyber-400 transition-colors"><Twitter className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
