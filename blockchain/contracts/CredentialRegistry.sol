// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CredentialRegistry
 * @notice Manages issuance, verification, and revocation of Verifiable Credentials
 * @dev Only hashes are stored on-chain; full credentials live on IPFS
 */
contract CredentialRegistry {

    // ============ Enums ============
    enum CredentialStatus { Active, Revoked, Expired, Suspended }
    enum CredentialType { Degree, GovernmentID, Employment, Membership, Custom }

    // ============ Structs ============
    struct Credential {
        bytes32 credentialId;       // keccak256 hash of (issuer + subject + type + timestamp)
        address issuer;
        address subject;
        CredentialType credType;
        string ipfsHash;            // IPFS hash of the encrypted credential
        bytes32 credentialHash;     // keccak256 of credential content for tamper detection
        uint256 issuedAt;
        uint256 expiresAt;          // 0 = no expiry
        CredentialStatus status;
        string credentialTypeLabel; // Human-readable label
    }

    // ============ State Variables ============
    mapping(bytes32 => Credential) public credentials;
    mapping(address => bytes32[]) public subjectCredentials;   // subject => credential IDs
    mapping(address => bytes32[]) public issuerCredentials;    // issuer => credential IDs
    mapping(address => bool) public authorizedIssuers;

    address public admin;
    uint256 public totalCredentials;

    // ============ Events ============
    event CredentialIssued(
        bytes32 indexed credentialId,
        address indexed issuer,
        address indexed subject,
        CredentialType credType,
        uint256 timestamp
    );
    event CredentialRevoked(bytes32 indexed credentialId, address indexed revokedBy, uint256 timestamp);
    event CredentialSuspended(bytes32 indexed credentialId, address indexed suspendedBy, uint256 timestamp);
    event IssuerAuthorized(address indexed issuer, uint256 timestamp);
    event IssuerRevoked(address indexed issuer, uint256 timestamp);

    // ============ Modifiers ============
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }

    modifier credentialExists(bytes32 _credentialId) {
        require(credentials[_credentialId].issuer != address(0), "Credential not found");
        _;
    }

    // ============ Constructor ============
    constructor() {
        admin = msg.sender;
        authorizedIssuers[msg.sender] = true; // Admin is also an issuer
    }

    // ============ Admin Functions ============

    /**
     * @notice Authorize an issuer address
     * @param _issuer Address to authorize as credential issuer
     */
    function authorizeIssuer(address _issuer) external onlyAdmin {
        require(_issuer != address(0), "Invalid address");
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer, block.timestamp);
    }

    /**
     * @notice Revoke an issuer's authorization
     */
    function revokeIssuerAuthorization(address _issuer) external onlyAdmin {
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer, block.timestamp);
    }

    // ============ Issuer Functions ============

    /**
     * @notice Issue a new verifiable credential
     * @param _subject Wallet address of credential recipient
     * @param _credType Type of credential
     * @param _ipfsHash IPFS hash of the encrypted credential document
     * @param _credentialHash keccak256 hash of credential content
     * @param _expiresAt Expiry timestamp (0 = never expires)
     * @param _typeLabel Human-readable type label
     */
    function issueCredential(
        address _subject,
        CredentialType _credType,
        string calldata _ipfsHash,
        bytes32 _credentialHash,
        uint256 _expiresAt,
        string calldata _typeLabel
    ) external onlyAuthorizedIssuer returns (bytes32) {
        require(_subject != address(0), "Invalid subject");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        require(_expiresAt == 0 || _expiresAt > block.timestamp, "Invalid expiry");

        bytes32 credentialId = keccak256(
            abi.encodePacked(msg.sender, _subject, _credType, block.timestamp, totalCredentials)
        );

        credentials[credentialId] = Credential({
            credentialId: credentialId,
            issuer: msg.sender,
            subject: _subject,
            credType: _credType,
            ipfsHash: _ipfsHash,
            credentialHash: _credentialHash,
            issuedAt: block.timestamp,
            expiresAt: _expiresAt,
            status: CredentialStatus.Active,
            credentialTypeLabel: _typeLabel
        });

        subjectCredentials[_subject].push(credentialId);
        issuerCredentials[msg.sender].push(credentialId);
        totalCredentials++;

        emit CredentialIssued(credentialId, msg.sender, _subject, _credType, block.timestamp);
        return credentialId;
    }

    /**
     * @notice Revoke a credential (issuer only)
     */
    function revokeCredential(bytes32 _credentialId)
        external
        credentialExists(_credentialId)
    {
        Credential storage cred = credentials[_credentialId];
        require(
            msg.sender == cred.issuer || msg.sender == admin,
            "Not authorized to revoke"
        );
        require(cred.status == CredentialStatus.Active, "Credential not active");

        cred.status = CredentialStatus.Revoked;
        emit CredentialRevoked(_credentialId, msg.sender, block.timestamp);
    }

    /**
     * @notice Suspend a credential temporarily
     */
    function suspendCredential(bytes32 _credentialId)
        external
        credentialExists(_credentialId)
    {
        Credential storage cred = credentials[_credentialId];
        require(msg.sender == cred.issuer || msg.sender == admin, "Not authorized");
        require(cred.status == CredentialStatus.Active, "Credential not active");

        cred.status = CredentialStatus.Suspended;
        emit CredentialSuspended(_credentialId, msg.sender, block.timestamp);
    }

    // ============ Verification Functions ============

    /**
     * @notice Verify a credential's authenticity and status
     * @param _credentialId ID of the credential to verify
     * @param _providedHash Hash provided by the verifier to check against
     * @return isValid True if credential is valid
     * @return status Current credential status
     * @return issuer Address of the issuer
     */
    function verifyCredential(bytes32 _credentialId, bytes32 _providedHash)
        external
        view
        credentialExists(_credentialId)
        returns (bool isValid, CredentialStatus status, address issuer)
    {
        Credential memory cred = credentials[_credentialId];

        bool hashMatches = cred.credentialHash == _providedHash;
        bool notExpired = cred.expiresAt == 0 || cred.expiresAt > block.timestamp;
        bool isActive = cred.status == CredentialStatus.Active;

        isValid = hashMatches && notExpired && isActive;
        status = cred.status;
        issuer = cred.issuer;
    }

    /**
     * @notice Get all credential IDs for a subject
     */
    function getSubjectCredentials(address _subject) external view returns (bytes32[] memory) {
        return subjectCredentials[_subject];
    }

    /**
     * @notice Get credential details
     */
    function getCredential(bytes32 _credentialId)
        external
        view
        credentialExists(_credentialId)
        returns (Credential memory)
    {
        return credentials[_credentialId];
    }

    /**
     * @notice Check if a credential is currently valid
     */
    function isCredentialValid(bytes32 _credentialId) external view returns (bool) {
        if (credentials[_credentialId].issuer == address(0)) return false;
        Credential memory cred = credentials[_credentialId];
        bool notExpired = cred.expiresAt == 0 || cred.expiresAt > block.timestamp;
        return cred.status == CredentialStatus.Active && notExpired;
    }
}
