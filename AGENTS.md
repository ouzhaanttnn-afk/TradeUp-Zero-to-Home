# TradeUp Development Contract

## Binding source of truth

- `docs/TRADEUP_MASTER_GDD_v2.2.md` is the only binding product and design source of truth.
- If code, README files, older documents, comments, or assumptions conflict with GDD v2.2, GDD v2.2 wins.
- In ambiguity, choose the simpler, less advantageous, less intrusive implementation that changes neither the economy nor monetization.
- Do not silently add deferred ideas to a working build.

### Approved First Home patch exception (2026-10-17)

2026-10-23 privacy correction authorization: the user approved adapting Mihenk's
UMP-managed IDFA/ATT flow after the 1.2.0 (48) Guideline 5.1.2(i) rejection.
This supersedes the old ATT-free implementation, not the ad placements, NPA
requests, +25 rewards, IAP entitlements or optional ad-ID-free analytics.
Regional UMP decisions must precede Mobile Ads initialization; an ATT refusal
must not block gameplay or reward eligibility. Code/test/local policy changes
are authorized; no new Apple upload/submission, main merge, public deployment,
paid build or nomination change is authorized by this approval.

2026-10-21 delivery authorization: the user explicitly requested submitting the latest TestFlight build to App Review while preserving the nomination. App Review submission of 1.2.0 (48) and its three Game Center leaderboards is authorized; App Store publication remains manual and no main merge is authorized. The user separately approved updating only the live privacy page for Game Center and local sharing, preserving the web game and main.

2026-10-19 updated delivery authorization: the user explicitly requested `Teste gönder` after confirming TestFlight-only scope. The feature branch may be pushed and one free-quota signed build uploaded to TestFlight, with existing test access prepared. No App Review submission, main merge, public release or paid build is authorized. This supersedes the earlier IPA-only/no-upload restriction for this delivery.

After Codemagic build `6ad629597550aed8109029d2` stopped in the old configuration test before archive/upload, the user explicitly approved one additional free-quota TestFlight build (`Evet, düzelt ve bir kez daha gönder`). No further paid/repeated builds are authorized by this retry approval.

2026-10-19 release authorization: the user explicitly approved pushing only `codex/first-home-polish` and one signed IPA-only Codemagic build within the existing free quota. No main merge, Apple/TestFlight upload, App Review change, paid build or publication is authorized by this approval.

2026-10-18 revision: the user approved `docs/TRADEUP_GAME_CENTER_PLAN_2026-10-18.md`: optional Game Center-hosted leaderboards replace the custom cloud/verified-career design; existing home offers move into Market. This revision takes precedence where it conflicts with the earlier 1.2/1.3 boundary. No paid cloud, reset, economic coefficient change, push, merge, publication or Apple submission is authorized. Do not describe client-reported Game Center scores as server-verified.

The user explicitly approved implementing `docs/TRADEUP_1.2_IMPLEMENTATION_SPEC_2026-10-16.md` and waived the old scope freeze for that plan. Within this patch, the specification takes precedence for UI, local career records, first-home memories and the separately staged optional leaderboard. Its 1.2/1.3 delivery boundary is binding: no live global service, paid cloud setup, merge, push, deployment or Apple submission is authorized by implementation approval alone. Keep the existing economy, ad rules, IAP ownership and saves intact. Other work still follows GDD v2.2.

## Locked product rules

- Priority never changes: economic correctness, decision depth, first session, active market, retention, monetization, then content scale.
- Money uses integer minor units. Purchase, preparation, inspection, transparent fees, settlement, net worth, and career reporting share the canonical economy service.
- `bookCost = purchasePrice + preparationCost + inspectionCost + transparentFees`.
- `realizedProfit = completedSaleProceeds - bookCost`; asking price is never a cost basis.
- Inventory, Preparing, Ready, Listed, Reserved, and SoldPending remain player-owned. Only SoldComplete closes ownership.
- Listing an asset cannot remove it from net worth; withdrawal returns it losslessly; a transaction ID can apply only once; an atomic purchase cannot make cash negative.
- Production UI never reveals exact fair value. It may show the GDD-defined estimate range and evidence-dependent confidence.
- Negotiation has exactly two player offer rights. Do not add extra offers, retries, guaranteed deals, premium currency, cash packs, any ad beyond the approved 2026-09-19 trade interstitial exception, a second sight, or invisible major defects.
- Keep the four-tab portrait shell: Pazar, Takip, Portföy, Yolculuk. Envanter, Hazırlık, and İlanlarım are Portföy segments. Respect safe areas, 320–430 px widths, text scaling, reduced motion, haptics-off, and missing-asset fallback.
- Assets are not a gameplay blocker. Follow: manifest and placeholder, 24 hero families, condition/evidence overlays, then measured expansion.
- Approved 2026-09-19 scan amendment: new careers start with 50 active scans until 30 completed market trades (the gifted notebook does not count), then cap at 25 and clamp excess immediately. Each manual refresh consumes one and advances two game minutes. Credits regenerate one per 72 real seconds, including validated offline time; 0→50 takes 60 minutes early and 0→25 takes 30 minutes later. At zero, `MARKET_SCOUT` still restores exactly 25 through an explicit rewarded choice or verified ad-free bypass with unchanged caps/cooldown. Natural market flow never stops, credits never exceed the phase cap, and clock rollback grants nothing.
- Approved 2026-09-19 ad amendment: after the 30th, 60th, 90th etc. completed market trade, a single iOS interstitial may be attempted after sale settlement and persistence. The gifted notebook does not count. No consent, no fill, offline, or ad failure never blocks play. Verified Premium or No Ads skips it. Production serving stays gated; no other automatic ad or wealth/currency trigger is allowed.
- Approved GDD v2.2 profile amendment: a clean first launch asks for a 1–20 character player name and one of three free static avatars before FTUE. Existing saves migrate as already onboarded. `tradeup_animated_avatars_01` is the fifth permanent SKU and grants exactly three animated profile avatars; it is cosmetic-only, store-priced, restorable, and must stop moving under reduced motion.
- Approved 2026-09-27 GDD v2.2 package revision: there are six permanent non-consumable SKUs. Premium includes all four standalone cosmetic packs plus ad-free use; `tradeup_no_ads_lifetime` removes ads only and grants no cosmetics. Existing standalone ownership survives Premium revocation. Both ad-free paths keep reward caps, cooldowns and economic results unchanged.

## Scope freeze

Until v1.0, do not add a gameplay mechanic, ad placement beyond the approved 2026-09-19 trade interstitial, IAP type, premium currency, mission system, negotiation right, or economy layer. Allowed changes are limited to:

- GDD-compliance bug fixes;
- performance, crash, accessibility, localization, and store-policy fixes;
- numerical calibration inside the GDD's stated envelope, behind config and backed by telemetry;
- provider/SDK replacement that preserves placement and entitlement behavior;
- test, analytics, asset, and content improvements that do not create a new mechanic.

Do not change mechanics, progression, economy, negotiation, rewarded ads, IAP, or monetization design without an explicit GDD revision. When consent or eligibility is uncertain, do not show an ad or grant a purchase advantage.

## Mandatory production order

Follow the production order. Per the user's updated instruction, complete, verify and commit related work blocks and continue without requesting `Devam`, including at ordinary phase boundaries. Pause only for a critical user decision, missing publisher-owned credentials or information, or an action requiring new authority (such as publication or a GDD revision). Progress reports do not require the user to reply.

1. P0 — Economic integrity: unified OwnedAsset, book cost, journal, net worth, settlement tests.
2. P0 — Deterministic world: injected clock, lifecycle tick, active NPC hazard, incremental arrivals.
3. P1 — Decision vertical slice: compare, evidence/inspection, 24 deep families, preparation actions.
4. P1 — First session: scripted starting notebook, real choice, negotiation, listing, first profit.
5. P2 — Meta: expertise, Takip, career timeline, home reveal, analytics event contract.
6. P3 — Monetization foundation: billing, entitlement, consent and rewarded adapters; exactly four placements and six non-consumable SKUs; sandbox/test identities first, production behind its quality gate.
7. P4 — Content scale only after vertical-slice and monetization-safety tests pass.

Standing authorization covers the next in-scope packages in order; it does not reopen product design.

## Required workflow and quality gates

For every package:

1. Inspect the current implementation and relevant GDD sections.
2. Implement only the next defined package.
3. Add unit, invariant, migration, integration, or UI tests appropriate to the change.
4. Run `pnpm test`, `pnpm lint`, and `pnpm build`; fix all failures.
5. Leave no visible fake button, TODO, placeholder control, dead control, or knowingly broken path.
6. Reconcile journal totals with cash, active book cost, and realized profit after save/load and settlement flows.
7. Commit the completed work. Continue related small fixes within the authorized block; report at a meaningful phase boundary.

The pure engine contract is mandatory: identical seed, game time, config, and command sequence must produce identical economic results on web, tests, and native. Before calling the vertical slice complete, satisfy the full Definition of Done and resilience tests in GDD v2.2, including core invariants, core-loop integration, WebView smoke, migration, 320–430 px layout, text scaling, reduced motion, haptics-off, and missing-asset fallback.

## Hybrid assistant routing

- Keep the primary Codex model responsible for GDD interpretation, economy and monetization decisions, architecture, security, UI/UX judgment, final reviews, repository writes, and release decisions.
- The primary agent may proactively use the local OmniRoute service for bounded, low-risk work such as generic copy drafts, repetitive classification, non-sensitive summaries, and disposable ideation.
- Treat OmniRoute output as an untrusted draft: verify it before use and never let a secondary route write to the repository or make a final product decision directly.
- Never send credentials, authentication material, personal data, publisher data, unreleased secrets, or destructive instructions through a secondary route.
- On ambiguity, weak output, or conflict with GDD v2.2, discard the secondary output and complete the work with the primary Codex model.
