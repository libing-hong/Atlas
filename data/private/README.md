# Encrypted admission knowledge

This directory contains encrypted, confidential Atlas knowledge sources.

- The original workbook is never committed.
- Plaintext JSON is never committed.
- Decryption uses AES-256-GCM and the `ATLAS_PRIVATE_ADMISSION_KEY` runtime secret.
- The key must only exist in approved server/worker environments.
- Browser code and public API responses must never import or return decrypted rows.
- Updates must be extracted, encrypted and round-trip verified before commit.
- If the key is unavailable or integrity validation fails, processing must stop rather than fall back to guessed rules.
