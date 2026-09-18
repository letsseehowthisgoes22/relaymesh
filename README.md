# RelayMesh

**Messages find a way. Even when networks fail.**

RelayMesh is a blockchain-agnostic, delay-tolerant messaging protocol that encrypts a message locally, breaks it into shuffled fragments, moves those fragments through opt-in devices, and reconstructs the message only for the intended receiver. RelayCoin (RLY) rewards relays after a receiver-signed delivery receipt.

## Working MVP

The browser demo performs real PBKDF2 key derivation, AES-256-GCM encryption, fragment shuffling, multi-path relay simulation, integrity checking, receiver-side reassembly, decryption, and reward settlement. Relays never receive plaintext.

```bash
python3 -m http.server 8081
```

Open `http://localhost:8081` and select **Run encrypted delivery**.

## Test

```bash
node tests/protocol.test.mjs
```

The tests cover successful encryption/reassembly, wrong-phrase rejection, and tamper detection.

## Architecture

1. The sender enters a message and shared recovery phrase.
2. PBKDF2 derives an AES key and deterministic routing material from the phrase plus a random salt.
3. AES-256-GCM encrypts the message locally.
4. Ciphertext is split and shuffled across independent store-carry-forward routes.
5. Rotating rendezvous tags let the receiver recognize packets without publishing a permanent identity.
6. The receiver reassembles, checks the ciphertext digest, and decrypts.
7. A signed receipt unlocks escrowed RLY for useful relays.

`contracts/RelayCoin.sol` is the RLY token. `contracts/RelayEscrow.sol` handles sender-funded relay rewards. `contracts/ProofRegistry.sol` provides an optional integrity-proof primitive.

## Stack

- Web Crypto API: PBKDF2, AES-GCM, SHA-256
- Vanilla HTML, CSS, and JavaScript
- Solidity 0.8.24 smart contracts
- ethers.js wallet integration
- Chain-adapter settlement: the MVP includes EVM contracts, while the transport and receipt format remain independent of any blockchain

## Current scope

The hackathon MVP simulates nearby devices in-browser and includes production-shaped smart contracts. Bluetooth, Wi-Fi Direct, LoRa, libp2p transport adapters, threshold coding, and testnet deployment are the next implementation layer.

## License

MIT
