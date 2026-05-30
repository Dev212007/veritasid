import { ethers } from "ethers";

// ── ABIs (minimal – only functions you call) ──────────────────────────────
export const DID_REGISTRY_ABI = [
  "function registerDID(string _did, string _ipfsHash, string _publicKey) external",
  "function updateDID(string _newIpfsHash) external",
  "function deactivateDID() external",
  "function resolveDID(address _owner) external view returns (tuple(string did,address owner,string ipfsHash,uint256 createdAt,uint256 updatedAt,bool isActive,string publicKey))",
  "function hasDID(address _address) external view returns (bool)",
  "function totalDIDs() external view returns (uint256)",
  "event DIDRegistered(address indexed owner, string did, string ipfsHash, uint256 timestamp)",
];

export const CREDENTIAL_REGISTRY_ABI = [
  "function issueCredential(address _subject, uint8 _credType, string _ipfsHash, bytes32 _credentialHash, uint256 _expiresAt, string _typeLabel) external returns (bytes32)",
  "function revokeCredential(bytes32 _credentialId) external",
  "function verifyCredential(bytes32 _credentialId, bytes32 _providedHash) external view returns (bool isValid, uint8 status, address issuer)",
  "function getSubjectCredentials(address _subject) external view returns (bytes32[])",
  "function getCredential(bytes32 _credentialId) external view returns (tuple(bytes32 credentialId,address issuer,address subject,uint8 credType,string ipfsHash,bytes32 credentialHash,uint256 issuedAt,uint256 expiresAt,uint8 status,string credentialTypeLabel))",
  "function isCredentialValid(bytes32 _credentialId) external view returns (bool)",
  "function authorizeIssuer(address _issuer) external",
  "function authorizedIssuers(address) external view returns (bool)",
  "function totalCredentials() external view returns (uint256)",
  "event CredentialIssued(bytes32 indexed credentialId, address indexed issuer, address indexed subject, uint8 credType, uint256 timestamp)",
];

export const PERMISSION_MANAGER_ABI = [
  "function grantPermission(address _verifier, bytes32 _credentialId, uint256 _expiresAt, string _purpose) external returns (bytes32)",
  "function revokePermission(bytes32 _permissionId) external",
  "function hasPermission(address _subject, address _verifier, bytes32 _credentialId) external view returns (bool)",
  "function getSubjectPermissions(address _subject) external view returns (bytes32[])",
  "function getPermission(bytes32 _permissionId) external view returns (tuple(address subject,address verifier,bytes32 credentialId,uint256 grantedAt,uint256 expiresAt,bool isActive,string purpose))",
  "event PermissionGranted(bytes32 indexed permissionId, address indexed subject, address indexed verifier, bytes32 credentialId, uint256 expiresAt)",
];

// ── Contract Addresses (filled by deploy script) ──────────────────────────
// IMPORTANT: After running `npm run deploy:local` in /blockchain,
// copy the addresses from blockchain/deployments.json into the vars below.
export const CONTRACT_ADDRESSES = {
  DIDRegistry: import.meta.env.VITE_DID_REGISTRY || "",
  CredentialRegistry: import.meta.env.VITE_CREDENTIAL_REGISTRY || "",
  PermissionManager: import.meta.env.VITE_PERMISSION_MANAGER || "",
};

// ── Contract factory helpers ──────────────────────────────────────────────
export const getDIDRegistry = (signerOrProvider) =>
  new ethers.Contract(CONTRACT_ADDRESSES.DIDRegistry, DID_REGISTRY_ABI, signerOrProvider);

export const getCredentialRegistry = (signerOrProvider) =>
  new ethers.Contract(CONTRACT_ADDRESSES.CredentialRegistry, CREDENTIAL_REGISTRY_ABI, signerOrProvider);

export const getPermissionManager = (signerOrProvider) =>
  new ethers.Contract(CONTRACT_ADDRESSES.PermissionManager, PERMISSION_MANAGER_ABI, signerOrProvider);

// ── DID Helpers ───────────────────────────────────────────────────────────
export const generateDID = (address) =>
  `did:veritas:${address.toLowerCase()}`;

export const generateCredentialHash = (data) =>
  ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data)));

// ── Credential type mapping ───────────────────────────────────────────────
export const CREDENTIAL_TYPES = {
  0: "College Degree",
  1: "Government ID",
  2: "Employment",
  3: "Membership",
  4: "Custom",
};

export const CREDENTIAL_STATUS = {
  0: "Active",
  1: "Revoked",
  2: "Expired",
  3: "Suspended",
};

export const shortenAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

export const formatTimestamp = (ts) => {
  if (!ts) return "—";
  const n = typeof ts === "bigint" ? Number(ts) : ts;
  return new Date(n * 1000).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};
