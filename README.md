# TradeUp: Zero to Home

Portrait-first marketplace / flipping simulation built from the unified production GDD.

## Implemented foundation

- Seeded, replayable listing generation with many same-family listings
- Cash and estimated wealth as separate state
- Two-player-offer negotiation with stable seller floor and counteroffers
- Buy → inventory → sell → realized-profit loop
- NPC/offline listing aging with capped elapsed time
- Versioned IndexedDB persistence and migration defaults
- Career event history derived from actual transactions
- Data-driven fictional product families and `assetKey` manifest
- Original app icon and nine product assets with deterministic fallback
- PWA manifest/service worker and Capacitor Android wrapper
- Native haptics adapter with web-safe fallback

## Commands

```powershell
pnpm install
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm cap:sync
```

Android debug/release builds require a local JDK and Android SDK:

```powershell
cd android
.\gradlew.bat assembleDebug
```

Never commit signing keys, passwords, API keys or store credentials. See `docs/RELEASE_CHECKLIST.md` for publisher-owned release steps.
