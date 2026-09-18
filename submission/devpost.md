# RelayMesh

## Elevator pitch

Encrypted messages that fragment across opt-in devices, find the right receiver without a central network, and reward successful relays with RLY.

## Inspiration

When a cellular network, cloud provider, or platform goes down, ordinary messaging stops at exactly the moment people need it most. Existing mesh systems often depend on a live route, expose stable device identities, or give strangers no reason to carry someone else's traffic. We wanted a message to behave more like resilient cargo: encrypted at origin, divided across different paths, recognized only by its intended receiver, and economically rewarded only after delivery.

## What it does

RelayMesh turns a message and recovery phrase into an encrypted, delay-tolerant delivery bundle. The browser derives an AES-256 key, encrypts locally, splits the ciphertext into shuffled fragments, and sends the fragments through independent opt-in relays. The receiver uses rotating rendezvous tags to identify relevant fragments, verifies their integrity, reconstructs the bundle, and decrypts locally.

RelayCoin (RLY) makes the network self-sustaining. A sender escrows RLY for a delivery. Relays earn only when the receiver signs a receipt, so payment follows useful work instead of raw traffic. Deposits and rate limits create a natural spam-defense layer. RelayMesh is blockchain-agnostic: messages always move off-chain, and a chain adapter can settle the same signed receipt on any supported blockchain. The MVP includes an EVM adapter; Solana and other chain adapters can implement the same receipt interface.

## How we built it

The working MVP uses the browser Web Crypto API for PBKDF2 key derivation, AES-GCM authenticated encryption, random salts and IVs, and SHA-256 integrity checks. A deterministic shuffle derived from the phrase distributes fragments across simulated store-carry-forward routes. The receiver sorts fragment indexes only after collection and rejects corrupted bundles or an incorrect phrase.

The Web3 layer consists of two Solidity contracts. RelayCoin is an ERC-20-compatible test token for hackathon use. RelayEscrow locks a sender's delivery budget and pays registered relay claims only after an ECDSA receipt signed by the intended receiver. A separate ProofRegistry contract can timestamp important message or document fingerprints without publishing their contents.

## Challenges we ran into

The hardest design problem was separating routing from identity. A fixed receiver address would make traffic easy to correlate, while pure random forwarding would waste bandwidth. RelayMesh resolves that tension with phrase-derived, rotating rendezvous tags: relays can match packets to short-lived routing hints but cannot derive the receiver's identity or plaintext.

The second challenge was token incentives. Paying for every hop rewards spam. We instead tied settlement to the receiver's signed delivery receipt and placed rewards in sender-funded escrow.

## Accomplishments that we're proud of

- A functional end-to-end encryption, fragmentation, shuffle, reassembly, and decryption demo.
- Wrong phrases fail cryptographically and modified fragments fail integrity checks.
- Relays see only ciphertext fragments and temporary routing metadata.
- A delivery-receipt escrow contract connects network utility to RLY rewards.
- The protocol can move from browser simulation to Bluetooth, Wi-Fi Direct, LoRa, or libp2p transports without changing its cryptographic core.

## What we learned

Resilient messaging is not just a transport problem. It is the combination of privacy, asynchronous routing, receiver discovery, integrity, and incentives. Blockchain is most useful here as a settlement and accountability layer, while message contents remain completely off-chain.

## What's next

Next we will replace the simulated relays with a libp2p transport, add Bluetooth and Wi-Fi Direct adapters, use erasure coding so any threshold of fragments can recover the message, deploy RLY and RelayEscrow to an EVM testnet, and field-test a LoRa bridge for disaster and remote-area communication.

## Built with

JavaScript, Web Crypto API, AES-256-GCM, PBKDF2, SHA-256, Solidity, EVM, ethers.js, HTML, CSS, delay-tolerant networking, store-carry-forward routing
