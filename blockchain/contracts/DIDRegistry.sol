// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DIDRegistry
 * @notice Decentralized Identity Registry - Core contract for VeritasID
 * @dev Manages DID creation, updates, and resolution on-chain
 */
contract DIDRegistry {
    // ============ Structs ============
    struct DIDDocument {
        string did;
        address owner;
        string ipfsHash;        // IPFS hash of full DID document
        uint256 createdAt;
        uint256 updatedAt;
        bool isActive;
        string publicKey;       // Compressed public key hex
    }

    // ============ State Variables ============
    mapping(address => DIDDocument) private didDocuments;
    mapping(string => address) private didToAddress;
    mapping(address => bool) public registeredDIDs;

    uint256 public totalDIDs;

    // ============ Events ============
    event DIDRegistered(address indexed owner, string did, string ipfsHash, uint256 timestamp);
    event DIDUpdated(address indexed owner, string did, string newIpfsHash, uint256 timestamp);
    event DIDDeactivated(address indexed owner, string did, uint256 timestamp);

    // ============ Modifiers ============
    modifier onlyDIDOwner() {
        require(registeredDIDs[msg.sender], "DID not registered");
        require(didDocuments[msg.sender].isActive, "DID is deactivated");
        _;
    }

    modifier didNotRegistered() {
        require(!registeredDIDs[msg.sender], "DID already registered");
        _;
    }

    // ============ Functions ============

    /**
     * @notice Register a new DID for the caller's wallet
     * @param _did The DID string (e.g. did:veritas:0x123...)
     * @param _ipfsHash IPFS hash of the DID document
     * @param _publicKey Hex-encoded compressed public key
     */
    function registerDID(
        string calldata _did,
        string calldata _ipfsHash,
        string calldata _publicKey
    ) external didNotRegistered {
        require(bytes(_did).length > 0, "DID cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(didToAddress[_did] == address(0), "DID already taken");

        didDocuments[msg.sender] = DIDDocument({
            did: _did,
            owner: msg.sender,
            ipfsHash: _ipfsHash,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true,
            publicKey: _publicKey
        });

        didToAddress[_did] = msg.sender;
        registeredDIDs[msg.sender] = true;
        totalDIDs++;

        emit DIDRegistered(msg.sender, _did, _ipfsHash, block.timestamp);
    }

    /**
     * @notice Update the IPFS document hash for an existing DID
     * @param _newIpfsHash New IPFS hash for the updated DID document
     */
    function updateDID(string calldata _newIpfsHash) external onlyDIDOwner {
        require(bytes(_newIpfsHash).length > 0, "IPFS hash cannot be empty");

        didDocuments[msg.sender].ipfsHash = _newIpfsHash;
        didDocuments[msg.sender].updatedAt = block.timestamp;

        emit DIDUpdated(
            msg.sender,
            didDocuments[msg.sender].did,
            _newIpfsHash,
            block.timestamp
        );
    }

    /**
     * @notice Deactivate a DID (soft delete)
     */
    function deactivateDID() external onlyDIDOwner {
        string memory did = didDocuments[msg.sender].did;
        didDocuments[msg.sender].isActive = false;
        didDocuments[msg.sender].updatedAt = block.timestamp;

        emit DIDDeactivated(msg.sender, did, block.timestamp);
    }

    /**
     * @notice Resolve a DID by wallet address
     * @param _owner Wallet address to look up
     */
    function resolveDID(address _owner) external view returns (DIDDocument memory) {
        require(registeredDIDs[_owner], "DID not found");
        return didDocuments[_owner];
    }

    /**
     * @notice Resolve DID by DID string
     * @param _did DID string to look up
     */
    function resolveByDID(string calldata _did) external view returns (DIDDocument memory) {
        address owner = didToAddress[_did];
        require(owner != address(0), "DID not found");
        return didDocuments[owner];
    }

    /**
     * @notice Check if an address has a registered DID
     */
    function hasDID(address _address) external view returns (bool) {
        return registeredDIDs[_address] && didDocuments[_address].isActive;
    }

    /**
     * @notice Get the IPFS hash for a given address's DID document
     */
    function getIPFSHash(address _owner) external view returns (string memory) {
        require(registeredDIDs[_owner], "DID not found");
        return didDocuments[_owner].ipfsHash;
    }
}
