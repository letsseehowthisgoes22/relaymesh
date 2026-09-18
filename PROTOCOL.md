# RelayMesh protocol

RelayMesh is an opt-in, delay-tolerant network for moving encrypted messages through participating devices without revealing the plaintext, sender identity, receiver identity, or complete route to any relay.

## Packet lifecycle

1. The sender generates a six-word recovery phrase.
2. PBKDF2 derives independent encryption, routing, and assembly keys from the phrase and a random salt.
3. AES-256-GCM encrypts the message locally.
4. The ciphertext is converted to redundant, LoRa-sized fragments. The MVP simulates erasure coding; production uses fountain coding.
5. The assembly key deterministically shuffles fragment order.
6. A Merkle root commits to every encrypted fragment.
7. Relay devices use store-carry-forward routing. They see only anonymous packet IDs, expiry, hop budget, and ciphertext.
8. The receiver derives rotating rendezvous tags from the shared phrase. Relays forward matching packets without learning the receiver's identity.
9. Once the receiver holds a sufficient threshold, the phrase recreates the assembly map and AES key.
10. The receiver verifies the Merkle commitment, reconstructs the ciphertext, decrypts locally, and signs delivery receipts.
11. RelayEscrow pays RelayCoin to relays presenting valid receiver-signed receipts.

## Security properties

- Plaintext never appears on-chain or at a relay.
- No single relay has the complete message or assembly map.
- Rotating rendezvous tags reduce receiver linkability.
- Merkle verification detects corrupted or substituted fragments.
- Authenticated encryption rejects incorrect recovery phrases and tampering.
- Expiry and hop budgets prevent permanent packet circulation.
- Escrow costs make spam non-free; signed receipts prevent unearned rewards.

## Threat boundaries

The hackathon MVP demonstrates cryptography, packet shuffling, multi-hop routing, reconstruction, and token rewards in software. It does not claim production anonymity against a global network observer. Real deployments would require audited cryptography, Sybil resistance, transport-specific radio compliance, cover traffic, metadata analysis, and independent smart-contract audits.
