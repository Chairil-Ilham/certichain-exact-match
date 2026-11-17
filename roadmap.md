# CertiChain continuation
- [x] Configure candidate issuer, enforce Anchor signer checks, add identity tests, and write pre-deployment report without changing demo data (38 offline tests; no Solana activation claim).
- [x] Canonical SHA-256 hashing and rule tests.
- [x] Wallet lifecycle and signature-authentication core; fail closed without reliable shared TTL service.
- [x] Anchor source, deployment-derived configuration and IDL-generation scripts; validator test source provided.
- [x] Devnet transaction and public account verification integration; keep demo status separate (code and offline checks, not live deployment).
- [x] Regression tests, browser checks and implementation report.
- [ ] Anchor compilation, generated IDL and validator execution: blocked by unavailable Anchor/Solana toolchain and actual deployment identity.
- [ ] Live wallet authentication: blocked by a trusted external temporary authentication service (Cloud/database prohibited).
- [ ] Real Devnet deployment and wallet approval: blocked by successful Anchor build/validator tests, actual program identity, proof of candidate wallet ownership, funding and real Phantom approval; candidate issuer configured, not active.