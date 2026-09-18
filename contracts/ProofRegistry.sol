// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ProofRegistry
/// @notice Anchors document fingerprints without exposing document contents.
contract ProofRegistry {
    struct Proof {
        address owner;
        uint64 anchoredAt;
        string label;
    }

    mapping(bytes32 => Proof) private proofs;

    event ProofAnchored(bytes32 indexed fingerprint, address indexed owner, uint64 anchoredAt, string label);

    function anchor(bytes32 fingerprint, string calldata label) external {
        require(fingerprint != bytes32(0), "Empty fingerprint");
        require(proofs[fingerprint].anchoredAt == 0, "Proof already exists");
        require(bytes(label).length <= 80, "Label too long");
        uint64 timestamp = uint64(block.timestamp);
        proofs[fingerprint] = Proof(msg.sender, timestamp, label);
        emit ProofAnchored(fingerprint, msg.sender, timestamp, label);
    }

    function verify(bytes32 fingerprint) external view returns (bool exists, address owner, uint64 anchoredAt, string memory label) {
        Proof memory proof = proofs[fingerprint];
        return (proof.anchoredAt != 0, proof.owner, proof.anchoredAt, proof.label);
    }
}
