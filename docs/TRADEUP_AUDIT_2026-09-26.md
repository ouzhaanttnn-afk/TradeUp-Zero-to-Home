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
- Night Market, Workshop and Home Styles entitlements are recorded but do not currently expose a selectable owned appearance. They must not be sold until their promised cosmetic content is usable and reviewable.
- All five products require Apple metadata, localized display copy, price schedules and review screenshots before submission.

## GDD v2.2 conflicts introduced after the 1.0.1 submission

The following additions conflict with the binding v1.0 scope freeze and must not influence the next release economy without an explicit GDD revision:

- missions (`src/domain/missions.ts`);
- career specializations and their economic perks (`src/domain/specialization.ts`);
- home perks that alter capacity, preparation speed, buyer tempo or bids (`src/domain/homePerks.ts`);
- additional market events that alter category demand (`src/domain/marketEvents.ts`).

Dialogue, localization, collection presentation, sound/haptic feedback and visual polish can remain when they do not alter the locked economy or add a new mechanic.

## Verification

- `pnpm test`: 376 tests passed before the iPhone-only regression test was added.
- `pnpm lint`: passed.
- `pnpm build`: passed.
