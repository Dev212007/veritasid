# VeritasID — Decentralized Identity Platform

> **Your Identity. Your Keys. Your Control.**
> Blockchain-powered, privacy-preserving, self-sovereign identity for the Web3 era.

---

## 🗂️ Project Structure

```
veritasid/
├── blockchain/                  ← Smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── DIDRegistry.sol      ← DID registration & resolution
│   │   ├── CredentialRegistry.sol ← Issue/verify/revoke credentials
│   │   └── PermissionManager.sol  ← User consent & access control
│   ├── scripts/
│   │   └── deploy.js            ← Deployment script
│   ├── hardhat.config.js
│   └── package.json
│
├── backend/                     ← Node.js + Express API
│   ├── models/
│   │   ├── User.js              ← MongoDB user model
│   │   └── Activity.js          ← Activity log model
│   ├── routes/
│   │   ├── auth.js              ← Wallet auth (nonce + signature)
│   │   ├── did.js               ← DID registration & search
│   │   ├── credential.js        ← Credential logging
│   │   ├── permission.js        ← Permission logging
│   │   ├── ipfs.js              ← Pinata IPFS upload/fetch
│   │   └── activity.js          ← Activity log
│   ├── middleware/
│   │   └── auth.js              ← JWT middleware
│   ├── server.js
│   └── package.json
│
└── frontend/                    ← React + Vite + Tailwind
    ├── src/
    │   ├── context/
    │   │   └── WalletContext.jsx ← MetaMask + auth state
    │   ├── utils/
    │   │   └── contracts.js     ← Ethers.js ABIs + helpers
    │   ├── pages/
    │   │   ├── LandingPage.jsx  ← Hero + features
    │   │   ├── DashboardPage.jsx ← User identity hub
    │   │   ├── IssuerPage.jsx   ← Issue credentials
    │   │   ├── VerifierPage.jsx ← Verify credentials
    │   │   ├── ProfilePage.jsx  ← Edit profile
    │   │   └── ActivityPage.jsx ← Activity log
    │   ├── components/common/
    │   │   └── Navbar.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

---

## ⚙️ Setup Instructions (Step by Step)

### Prerequisites
- Node.js v18+ (`node -v`)
- MongoDB running locally OR MongoDB Atlas account
- MetaMask browser extension installed
- Pinata account (free at pinata.cloud) — for IPFS

---

### Step 1 — Clone / Setup folders

```bash
# If you got this as a zip, extract it. Then:
cd veritasid
```

---

### Step 2 — Setup Blockchain

```bash
cd blockchain
npm install
npx hardhat compile
```

**Start local blockchain node** (keep this terminal open):
```bash
npx hardhat node
```

**In a NEW terminal — deploy contracts:**
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

You will see output like:
```
✅ DIDRegistry deployed: 0x5FbDB...
✅ CredentialRegistry deployed: 0xe7f17...
✅ PermissionManager deployed: 0x9fE46...
```
**Copy these 3 addresses — you'll need them next.**

---

### Step 3 — Setup Backend

```bash
cd backend
npm install
```

Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Edit `.env` and fill in:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/veritasid
JWT_SECRET=any_long_random_string_at_least_32_characters
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

Start backend:
```bash
npm run dev
```
You should see: `🚀 VeritasID API running on http://localhost:5000`

---

### Step 4 — Setup Frontend

```bash
cd frontend
npm install
```

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` — paste the contract addresses from Step 2:
```
VITE_DID_REGISTRY=0x5FbDB...         ← from deploy output
VITE_CREDENTIAL_REGISTRY=0xe7f17...  ← from deploy output
VITE_PERMISSION_MANAGER=0x9fE46...   ← from deploy output
VITE_API_URL=http://localhost:5000
VITE_CHAIN_ID=31337
```

Start frontend:
```bash
npm run dev
```
Open: `http://localhost:5173`

---

### Step 5 — Setup MetaMask

1. Open MetaMask → Click network dropdown → "Add Network"
2. Fill in:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Import a test account:
   - In the `npx hardhat node` terminal, you'll see accounts with private keys
   - Copy Account #0 private key
   - MetaMask → Import Account → Paste private key

---

### Step 6 — Get Pinata API Keys

1. Go to [pinata.cloud](https://pinata.cloud) → Sign up free
2. Dashboard → API Keys → Create New Key
3. Copy API Key and Secret Key into `backend/.env`

---

## 🎮 Demo Workflow

1. **Open** `http://localhost:5173`
2. **Click** "Connect Wallet & Start" → MetaMask popup → Sign message
3. **Dashboard** → Click "Register DID" → Confirm MetaMask transaction
4. **Issuer Portal** → Issue a credential to your own address (for demo)
5. **Dashboard** → See credential appear → Copy credential ID
6. **Verifier Portal** → Paste credential ID → Click "Verify Credential"
7. **Activity** → See full audit trail

---

## 🏆 Hackathon Presentation Points

1. **No passwords, ever** — Pure cryptographic identity via MetaMask
2. **True ownership** — Data on IPFS + blockchain, not our servers
3. **Selective disclosure** — Users choose exactly what to share
4. **Tamper-proof** — Hash verification catches any credential alteration
5. **Privacy-preserving** — ZK-proof ready architecture
6. **Cross-platform** — Any website can verify credentials via our API

## 💡 USPs (Unique Selling Points)

- First fully decentralized identity system with IPFS + Ethereum integration
- No vendor lock-in — open standard DIDs (W3C compatible design)
- Credential revocation mechanism on-chain
- QR-based verification for physical-world use cases
- Complete audit trail for all identity operations

## 🚀 Future Scope

- Zero-Knowledge Proof integration (zkSNARKs for age verification)
- Mobile app (React Native)
- Cross-chain identity (Polygon, BSC)
- AI-based fraud detection on credential issuers
- Government integration via OAuth bridge
- W3C DID spec full compliance
- Biometric binding for hardware wallet support

---

## 🛠️ Commands Quick Reference

```bash
# Blockchain
cd blockchain && npx hardhat node          # Start local chain
cd blockchain && npm run deploy:local      # Deploy contracts

# Backend
cd backend && npm run dev                  # Start API server

# Frontend
cd frontend && npm run dev                 # Start React app
```

---

*Built for hackathon — VeritasID v1.0.0*
