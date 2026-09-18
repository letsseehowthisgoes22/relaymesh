# RelayMesh 90-second demo script

**0:00–0:10 — Problem**

When cellular service, the internet, or a messaging platform fails, communication disappears with it. RelayMesh lets an encrypted message find another path.

**0:10–0:25 — Compose**

Here is a sensitive emergency update and a six-word phrase shared with the receiver. The message never leaves this browser in plaintext.

**0:25–0:45 — Encrypt and fragment**

I click Run encrypted delivery. RelayMesh derives an AES-256 key from the phrase, encrypts locally, and splits the ciphertext into five shuffled fragments. Each fragment takes a different store-carry-forward path through opt-in devices.

**0:45–1:00 — Reconnect**

The receiver recognizes short-lived rendezvous tags derived from the same phrase. No relay knows the plaintext, the complete message, or a permanent receiver identity. The receiver collects the packets, validates their digest, and reconstructs the ciphertext.

**1:00–1:15 — Reward**

After successful decryption, the receiver signs a delivery receipt. Our RelayEscrow contract uses that receipt to release RelayCoin, or RLY, to the relays that performed useful work. No delivery, no reward.

**1:15–1:30 — Close**

The MVP already performs real encryption, fragmentation, tamper rejection, recovery, and reward simulation. Next we connect the same protocol to Bluetooth, Wi-Fi Direct, libp2p, and LoRa. RelayMesh: messages find a way, even when networks fail.
