# Buyer wait calibration — 2026-09-05

Scope: the user's explicit request to speed up waiting for buyers after listing.
The bounded amendment is recorded in the master GDD, section 27. It does not
authorize skipping the initial purchase tutorial or changing monetization.

## Change

- Minimum listing age for a normal buyer check: 3 → 1 game minute.
- Existing arrival probability: multiplied by 2, through `BUYER_TEMPO_CONFIG`.
- Same seeded draws, offer-amount formula, demand/price/preparation factors,
  world clock, expiry rules and settlement. No automatic sale or guaranteed buyer.
- The existing paid/free listing-exposure action uses the same shared algorithm;
  its minimum age, number of draws, eligibility and caps are unchanged.
- Already saved offers retain their amount and expiry. Only future checks use
  the new calibration. No save-schema migration is required.

## Reproducible comparison

Run `pnpm exec vitest run src/domain/buyerTempo.test.ts --disableConsoleIntercept`.

The test compares the old and new buyer algorithm for 60 existing families ×
128 dispersed seeded cases, using balanced asking prices. It observes the first
offer for up to 180 game minutes. These are buyer-subsystem simulations, not
real-player telemetry or guaranteed waiting times.

| Measure (7,680 cases) | Previous | Current |
| --- | ---: | ---: |
| Median first-offer wait | 28 game min | 14 game min |
| 90th-percentile first-offer wait | 54 game min | 39 game min |
| First offer within 10 game min | 23% | 44% |
| No offer within 180 game min | 0 | 0 |

Every case gets an offer no later than under the old calibration. For the same
seed/listing/minute where both versions produce an offer, its buyer, amount, ID
and expiry match. Tests also cover no check at age zero, preservation of existing
offers, unchanged cash/journal until acceptance, and equivalent save/load and
split-time advancement.

## Monitoring

Existing local `buyer_offer` analytics now include `buyerTempoRevision`, `scripted`
and `listingAgeAtOfferMin`. The latter is calculated from offer creation time
(expiry minus the unchanged offer lifetime), not the time a returning player
opens the app. Scripted tutorial offers must be excluded from normal wait analysis.
No external analytics provider or new data transmission was added.

Long waits remain possible. Evaluate real-player waiting and progression before
any further adjustment; this comparison does not establish retention or game balance.
