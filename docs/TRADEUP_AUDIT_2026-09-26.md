# TradeUp audit — 2026-09-26

## Release blocker

- App Store review rejected iOS 1.0.1 (14) under Guideline 4 after testing on an iPad Air 11-inch (M3).
- The Xcode target advertised iPhone and iPad (`TARGETED_DEVICE_FAMILY = "1,2"`) even though the binding GDD defines a 320–430 px portrait shell.
- The release target is now iPhone-only and the iPad orientation declaration is removed. A new signed build is required; build 14 cannot be repaired in place.

## Monetization readiness

- The native StoreKit adapter requests all five locked non-consumable product identifiers and verifies current entitlements before granting them.
- `tradeup_premium_lifetime` exists in App Store Connect and is Ready for Review.
- The other four product records do not yet exist in App Store Connect.
- Animated avatars have a working entitlement gate and reduced-motion behavior.
- Night Market, Workshop and Premium Obsidian themes now expose selectable, persisted, entitlement-gated appearances.
- Home Styles now exposes three selectable interior/finale variants after the first home purchase. Animated avatars remain entitlement-gated and respect reduced motion.
- Premium now displays its founder badge. The two promised alternate application icons still need native icon assets and an iOS selector before Premium can be considered fully delivered.
- All five products require Apple metadata, localized display copy, price schedules and review screenshots before submission.

## GDD v2.2 conflicts introduced after the 1.0.1 submission

The following additions conflict with the binding v1.0 scope freeze and must not influence the next release economy without an explicit GDD revision:

- missions (`src/domain/missions.ts`);
- career specializations and their economic perks (`src/domain/specialization.ts`);
- home perks that alter capacity, preparation speed, buyer tempo or bids (`src/domain/homePerks.ts`);
- additional market events that alter category demand (`src/domain/marketEvents.ts`).

Dialogue, localization, collection presentation, sound/haptic feedback and visual polish can remain when they do not alter the locked economy or add a new mechanic.

The release path now hides missions and specializations, removes their preparation-time effect, removes home-perk messaging, and keeps showcase capacity independent from the purchased home. The underlying draft modules remain in source for possible future GDD revision, but they are not active mechanics.

## Verification

- `pnpm test`: 379 tests passed, including iPhone-only and cosmetic-entitlement regression coverage.
- `pnpm lint`: passed.
- `pnpm build`: passed.
