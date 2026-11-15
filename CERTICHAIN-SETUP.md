# CertiChain: configuration and verification boundaries

Existing browser demo records, roles, pages and routes remain in place. No Cloud or permanent application database is connected. Clearing the browser or switching devices loses demo data and local transaction references.

## Temporary authentication service

`services/wallet-auth` is separate deployable source, **not an active backend in this Lovable preview**. This preview has no provisioned shared atomic TTL storage. Authentication therefore fails closed; it does not pretend an in-memory map or localStorage prevents distributed replay.

The service uses a Durable Object to serialize nonce verification and consumption, and stores only challenges (5 minutes) and opaque sessions (1 hour). Alarms delete expired entries. This is a reliable temporary-storage deployment, not a permanent academic-data database. Its underlying deployment storage is durable for restart safety, but records have mandatory expiry. Only enable it if that TTL-only storage meets your requirement.

To activate it, a hosting operator must deploy the service and bind `WALLET_TTL`, set `APP_ORIGIN` to the application's exact HTTPS origin, and route `/api/public/wallet/*` on that same domain to this service. A separate `workers.dev` domain does **not** satisfy same-origin cookie requirements. Lovable's preview hostname does not provide a configurable route for this source. No provisioning or deployment was performed here.

Set trusted `ISSUER_WALLETS` to a comma-separated allowlist of public keys on the service, then enable `VITE_WALLET_AUTH_ENABLED=true` in the app. That flag is not a security authority: service identity verification and on-chain issuer constraints are the authorities. Ordinary signed-in wallets receive no administrative role. Admin Demo remains synthetic and does not become a production admin.

Cookies are HttpOnly, Secure, SameSite=Strict with the `__Host-` prefix. Challenge includes exact origin, public key, purpose, issued/expiry times and 256-bit nonce. Ed25519 signature is checked against the server's original stored message. Nonce consumption is serialized and atomic within the Durable Object. Disconnect/account changes clear local authentication and call logout. If logout is unreachable, the UI warns that server revocation could not be completed; server expiry still applies. No seed phrase/private key is requested by the app.

## Anchor Devnet program

Structure:

```text
solana/
  Anchor.toml
  Cargo.toml
  programs/certichain/
    Cargo.toml
    build.rs
    src/lib.rs
  tests/validator.mjs
scripts/
  configure-solana.mjs
  export-idl.mjs
```

No invented Program ID or deployment wallet is included. `build.rs` requires `CERTICHAIN_PROGRAM_ID` from the actual deployment keypair; compilation intentionally stops without it.

Operator workflow, requiring Anchor 0.31.1, compatible Solana CLI/SBF toolchain, a funded Devnet upgrade-authority wallet and an actual program keypair:

1. Create the deployment keypair outside source control with `solana-keygen new --outfile solana/target/deploy/certichain-keypair.json` (never upload it or commit it).
2. Run `node scripts/configure-solana.mjs solana/target/deploy/certichain-keypair.json`. This only derives the public program identity; it does not deploy.
3. Export `CERTICHAIN_PROGRAM_ID` to that public identity, then run `anchor build` from `solana/`.
4. Run `node scripts/export-idl.mjs` from the project root. The **actual generated IDL** is emitted into `solana/idl/certichain.json`; no fabricated generated IDL is shipped.
5. Deploy the program on Devnet using the configured operator wallet. Read its executable account from Devnet to confirm deployment.
6. Call `initialize` using the program's upgrade authority and its real `ProgramData` PDA. Initialization rejects arbitrary first callers. The config's issuer is that upgrade authority. No frontend-provided role can bypass it.
7. Set app `VITE_SOLANA_PROGRAM_ID` to the deployed address, and optionally `VITE_SOLANA_RPC_URL` to a public **Devnet** RPC endpoint. Never put an RPC private API key in `VITE_*`.
8. Align the temporary-auth service issuer allowlist with the on-chain config issuer.
9. Before live usage, run `solana/tests/validator.mjs` against a deployed local validator using `ISSUER_KEYPAIR` and the generated IDL. It requires `@coral-xyz/anchor` in the project, only needed for operator integration tests. This test was not executed here because no Anchor/Solana CLI/deployment identity is provided.

Program accounts: Config = 41 bytes including discriminator; CertificateRecord = 82 bytes including discriminator. Anchor `init` with payer and exact space handles rent-exemption. Certificate PDA seeds are UTF-8 `certificate` and SHA-256 of normalized internal certificate ID. No names, NIM or description are sent on-chain. Issuer authorization uses on-chain config; duplicate PDA initialization fails; only original issuer revokes; record remains after revocation.

Frontend ABI encoding mirrors Anchor instruction discriminators and account order. Before enabling production use, compare it against generated IDL and run validator integration. No uncompiled ABI is claimed as verified.

## Hash and on-chain verification

`src/lib/certificate-hash.ts` uses fixed-key ordered NFC-normalized UTF-8 JSON, schema version v1, SHA-256, exactly 32 bytes, hex display. Fields: certificate ID, verification code, internal student ID, name, institution, issue date, initial status `valid`. Local revocation does not mutate the initial issuance commitment; chain revocation is separate. Hash is an integrity commitment, not encryption.

The frontend verifies Devnet genesis hash, executable program, PDA owner, account discriminator/length and bump before matching hashes or reporting revocation. RPC errors are inconclusive, never invalid certificates. Send flow requests Phantom signature, sends raw transaction, waits for confirmed commitment and rereads the account before recording success. A confirmation timeout is inconclusive; use public verification before manually retrying. Explorer links appear only for actual current network reads or transactions confirmed in the current flow. Local references alone are never proof.

## Tests

Run `bunx vitest run`. The Lovable harness automatically checks and builds the app; do not manually duplicate its builds. Real Phantom signatures, actual deployed TTL-service behavior, generated IDL, Anchor compilation, local validator and Devnet transactions remain separate operator verification requirements.