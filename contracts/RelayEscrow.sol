// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRelayCoin {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title RelayEscrow
/// @notice Holds delivery rewards and pays relays from receiver-signed receipts.
contract RelayEscrow {
    struct Delivery {
        address sender;
        address receiver;
        bytes32 merkleRoot;
        uint128 rewardPerRelay;
        uint64 expiresAt;
        uint32 maxClaims;
        uint32 claims;
        bool completed;
    }

    IRelayCoin public immutable token;
    mapping(bytes32 => Delivery) public deliveries;
    mapping(bytes32 => mapping(address => bool)) public claimed;

    event DeliveryOpened(bytes32 indexed deliveryId, bytes32 indexed merkleRoot, address indexed receiver, uint256 escrow);
    event RelayRewarded(bytes32 indexed deliveryId, address indexed relay, uint256 reward);
    event DeliveryCompleted(bytes32 indexed deliveryId, uint32 rewardedRelays);

    constructor(address relayCoin) { token = IRelayCoin(relayCoin); }

    function openDelivery(bytes32 deliveryId, bytes32 merkleRoot, address receiver, uint128 rewardPerRelay, uint32 maxClaims, uint64 expiresAt) external {
        require(deliveries[deliveryId].sender == address(0), "Delivery exists");
        require(receiver != address(0) && maxClaims > 0, "Invalid delivery");
        require(expiresAt > block.timestamp, "Invalid expiry");
        uint256 escrow = uint256(rewardPerRelay) * maxClaims;
        require(token.transferFrom(msg.sender, address(this), escrow), "Escrow failed");
        deliveries[deliveryId] = Delivery(msg.sender, receiver, merkleRoot, rewardPerRelay, expiresAt, maxClaims, 0, false);
        emit DeliveryOpened(deliveryId, merkleRoot, receiver, escrow);
    }

    function claim(bytes32 deliveryId, address relay, bytes32 receiptId, bytes calldata receiverSignature) external {
        Delivery storage d = deliveries[deliveryId];
        require(block.timestamp <= d.expiresAt && !d.completed, "Delivery inactive");
        require(!claimed[deliveryId][relay] && d.claims < d.maxClaims, "Already claimed");
        bytes32 message = keccak256(abi.encodePacked(address(this), block.chainid, deliveryId, relay, receiptId));
        require(_recover(_ethSigned(message), receiverSignature) == d.receiver, "Invalid receipt");
        claimed[deliveryId][relay] = true;
        d.claims++;
        require(token.transfer(relay, d.rewardPerRelay), "Reward failed");
        emit RelayRewarded(deliveryId, relay, d.rewardPerRelay);
    }

    function complete(bytes32 deliveryId) external {
        Delivery storage d = deliveries[deliveryId];
        require(msg.sender == d.receiver || block.timestamp > d.expiresAt, "Not authorized");
        require(!d.completed, "Already completed");
        d.completed = true;
        uint256 remainder = uint256(d.rewardPerRelay) * (d.maxClaims - d.claims);
        if (remainder > 0) require(token.transfer(d.sender, remainder), "Refund failed");
        emit DeliveryCompleted(deliveryId, d.claims);
    }

    function _ethSigned(bytes32 hash) private pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function _recover(bytes32 hash, bytes memory signature) private pure returns (address) {
        require(signature.length == 65, "Bad signature");
        bytes32 r; bytes32 s; uint8 v;
        assembly { r := mload(add(signature, 32)) s := mload(add(signature, 64)) v := byte(0, mload(add(signature, 96))) }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Bad recovery id");
        return ecrecover(hash, v, r, s);
    }
}
