# TradeUp: Zero to Home

Portrait-first marketplace / flipping simulation built from the unified production GDD.

The binding product specification is
[`docs/TRADEUP_MASTER_GDD_v2.1.md`](docs/TRADEUP_MASTER_GDD_v2.1.md).

## Implemented foundation

- Seeded, replayable listing generation with many same-family listings
- Injected wall-clock adapter and monotonic integer game-time clock
- Incremental market scans that preserve existing listing identities
- Deterministic listing aging, expiry, signaled NPC competition, and buyer offers
- Unified `OwnedAsset` lifecycle across inventory, listings, reservations, and settlement
- Integer minor-unit money, full book cost, and append-only transaction journal
- Cash, active owned-asset valuation, and realized profit as separate accounting values
- Two-player-offer negotiation with stable seller floor and counteroffers
- Buy → inventory → listing/withdrawal → settlement loop with idempotent transactions
- Diminishing, capped offline progress with a protected opportunity sample
- Versioned IndexedDB persistence with an explicit v2 → … → v9 migration chain and recoverable backup
- Ordered critical-save queue plus Capacitor background/resume synchronization
- Career event history produced by canonical economic transactions
- Data-driven fictional product families and `assetKey` manifest
- Original app icon and 24 dedicated product-family hero assets with deterministic fallback
- PWA manifest/service worker and Capacitor Android wrapper
- Player-controlled reduced motion and native haptics with web-safe fallback

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
