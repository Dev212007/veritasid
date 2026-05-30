// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PermissionManager
 * @notice Manages user consent and data sharing permissions
 * @dev Users explicitly grant/revoke access to their credentials
 */
contract PermissionManager {

    // ============ Structs ============
    struct Permission {
        address subject;        // DID owner granting permission
        address verifier;       // Who is being granted access
        bytes32 credentialId;   // Specific credential (or bytes32(0) for all)
        uint256 grantedAt;
        uint256 expiresAt;      // 0 = no expiry
        bool isActive;
        string purpose;         // Why this access was granted
    }

    // ============ State Variables ============
    // permissionId => Permission
    mapping(bytes32 => Permission) public permissions;

    // subject => verifier => credentialId => permissionId
    mapping(address => mapping(address => mapping(bytes32 => bytes32))) public permissionLookup;

    // subject => all their granted permissionIds
    mapping(address => bytes32[]) public subjectPermissions;

    // verifier => all permissionIds granted to them
    mapping(address => bytes32[]) public verifierPermissions;

    // ============ Events ============
    event PermissionGranted(
        bytes32 indexed permissionId,
        address indexed subject,
        address indexed verifier,
        bytes32 credentialId,
        uint256 expiresAt
    );
    event PermissionRevoked(
        bytes32 indexed permissionId,
        address indexed subject,
        address indexed verifier
    );

    // ============ Functions ============

    /**
     * @notice Grant a verifier permission to access a credential
     * @param _verifier Address being granted access
     * @param _credentialId Specific credential ID (bytes32(0) = all credentials)
     * @param _expiresAt Expiry timestamp (0 = never)
     * @param _purpose Description of why access is being granted
     */
    function grantPermission(
        address _verifier,
        bytes32 _credentialId,
        uint256 _expiresAt,
        string calldata _purpose
    ) external returns (bytes32) {
        require(_verifier != address(0), "Invalid verifier");
        require(_verifier != msg.sender, "Cannot grant to self");
        require(
            _expiresAt == 0 || _expiresAt > block.timestamp,
            "Invalid expiry"
        );

        bytes32 permissionId = keccak256(
            abi.encodePacked(msg.sender, _verifier, _credentialId, block.timestamp)
        );

        permissions[permissionId] = Permission({
            subject: msg.sender,
            verifier: _verifier,
            credentialId: _credentialId,
            grantedAt: block.timestamp,
            expiresAt: _expiresAt,
            isActive: true,
            purpose: _purpose
        });

        permissionLookup[msg.sender][_verifier][_credentialId] = permissionId;
        subjectPermissions[msg.sender].push(permissionId);
        verifierPermissions[_verifier].push(permissionId);

        emit PermissionGranted(permissionId, msg.sender, _verifier, _credentialId, _expiresAt);
        return permissionId;
    }

    /**
     * @notice Revoke a previously granted permission
     * @param _permissionId Permission ID to revoke
     */
    function revokePermission(bytes32 _permissionId) external {
        Permission storage perm = permissions[_permissionId];
        require(perm.subject == msg.sender, "Not your permission");
        require(perm.isActive, "Already revoked");

        perm.isActive = false;
        emit PermissionRevoked(_permissionId, msg.sender, perm.verifier);
    }

    /**
     * @notice Check if a verifier has permission to access a subject's credential
     * @param _subject DID owner
     * @param _verifier Verifier address
     * @param _credentialId Credential being accessed
     */
    function hasPermission(
        address _subject,
        address _verifier,
        bytes32 _credentialId
    ) external view returns (bool) {
        bytes32 permissionId = permissionLookup[_subject][_verifier][_credentialId];
        if (permissionId == bytes32(0)) {
            // Check wildcard permission (all credentials)
            permissionId = permissionLookup[_subject][_verifier][bytes32(0)];
        }
        if (permissionId == bytes32(0)) return false;

        Permission memory perm = permissions[permissionId];
        bool notExpired = perm.expiresAt == 0 || perm.expiresAt > block.timestamp;
        return perm.isActive && notExpired;
    }

    /**
     * @notice Get all permissions granted by a subject
     */
    function getSubjectPermissions(address _subject) external view returns (bytes32[] memory) {
        return subjectPermissions[_subject];
    }

    /**
     * @notice Get all permissions granted to a verifier
     */
    function getVerifierPermissions(address _verifier) external view returns (bytes32[] memory) {
        return verifierPermissions[_verifier];
    }

    /**
     * @notice Get permission details
     */
    function getPermission(bytes32 _permissionId) external view returns (Permission memory) {
        return permissions[_permissionId];
    }
}
