<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## CertiChain architecture
- All data access goes through `src/lib/store.ts` (async, localStorage demo DB) so it can be swapped for a real backend without touching pages.
- Sessions (admin / student-demo) live in `src/providers/session.tsx`; wallet state lives only in `src/providers/wallet.tsx` — never merge them, because wallet connection is not authentication.
- Never show on-chain status, signatures or explorer links unless a real verified on-chain check exists.
- Canonical certificate hashing uses a versioned fixed-field NFC JSON commitment with immutable initial issuance status; revocation is a separate state.
- Wallet signature authentication uses a separately deployed same-origin TTL service with serialized nonce consumption; without that service the app fails closed and never uses local demo sessions as issuer authority.
- Anchor identity and frontend IDL must be generated from the actual deployment keypair; no default program ID is allowed.
- Devnet operations use the Solana SDK, verify executable program/authority and account owner/discriminator before displaying evidence, and store confirmed transaction references only through the demo store.
