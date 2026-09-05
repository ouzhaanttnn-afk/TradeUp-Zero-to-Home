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
- Versioned IndexedDB persistence with an explicit v2 → … → v12 migration chain and recoverable backup
- Per-listing negotiation history that preserves remaining rights across navigation and reload
- Ordered critical-save queue plus Capacitor background/resume synchronization
- Career event history produced by canonical economic transactions
- Data-driven fictional product families and `assetKey` manifest
- Original app icon and 24 dedicated product-family hero assets with deterministic fallback
- PWA manifest/service worker and Capacitor Android wrapper
- Player-controlled text scale, reduced motion, native haptics, and semantic audio levels with web-safe fallbacks

## Commands

```powershell
pnpm install
pnpm dev
pnpm lint
pnpm test
pnpm test:browser
pnpm test:offline
pnpm build
pnpm cap:sync
```

Android debug/release builds require a local JDK and Android SDK:

```powershell
cd android
.\gradlew.bat assembleDebug
```

Never commit signing keys, passwords, API keys or store credentials. See `docs/RELEASE_CHECKLIST.md` for publisher-owned release steps.

Browser tests require Chrome and use a separate temporary profile. `test:browser`
checks 320/390/430 px layouts, large text, reduced motion, haptics preference
persistence, missing product images, comparison navigation, and offline reload.
It also completes the first-session loop with both starting notebook choices,
reconciling cash, book cost, realized profit and the journal after each stage
and after reload. Automated completion is not evidence of player retention or comprehension.
`test:offline` runs only the offline scenario. These do not replace native-device QA.
