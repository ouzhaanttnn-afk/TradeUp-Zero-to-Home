# TradeUp Development Contract

## Binding source of truth

- `docs/TRADEUP_MASTER_GDD_v2.1.md` is the only binding product and design source of truth.
- If code, README files, older documents, comments, or assumptions conflict with GDD v2.1, GDD v2.1 wins.
- In ambiguity, choose the simpler, less advantageous, less intrusive implementation that changes neither the economy nor monetization.
- Do not silently add deferred ideas to a working build.

## Locked product rules

- Priority never changes: economic correctness, decision depth, first session, active market, retention, monetization, then content scale.
- Money uses integer minor units. Purchase, preparation, inspection, transparent fees, settlement, net worth, and career reporting share the canonical economy service.
- `bookCost = purchasePrice + preparationCost + inspectionCost + transparentFees`.
- `realizedProfit = completedSaleProceeds - bookCost`; asking price is never a cost basis.
- Inventory, Preparing, Ready, Listed, Reserved, and SoldPending remain player-owned. Only SoldComplete closes ownership.
- Listing an asset cannot remove it from net worth; withdrawal returns it losslessly; a transaction ID can apply only once; an atomic purchase cannot make cash negative.
- Production UI never reveals exact fair value. It may show the GDD-defined estimate range and evidence-dependent confidence.
- Negotiation has exactly two player offer rights. Do not add extra offers, retries, guaranteed deals, premium currency, cash packs, forced ads, a second sight, or invisible major defects.
- Keep the four-tab portrait shell: Pazar, Envanter, İlanlarım, Servet. Respect safe areas, 320–430 px widths, text scaling, reduced motion, haptics-off, and missing-asset fallback.
- Assets are not a gameplay blocker. Follow: manifest and placeholder, 24 hero families, condition/evidence overlays, then measured expansion.

## Scope freeze

Until v1.0, do not add a gameplay mechanic, ad placement, IAP type, premium currency, mission system, negotiation right, or economy layer. Allowed changes are limited to:

- GDD-compliance bug fixes;
- performance, crash, accessibility, localization, and store-policy fixes;
- numerical calibration inside the GDD's stated envelope, behind config and backed by telemetry;
- provider/SDK replacement that preserves placement and entitlement behavior;
- test, analytics, asset, and content improvements that do not create a new mechanic.

Do not change mechanics, progression, economy, negotiation, rewarded ads, IAP, or monetization design without an explicit GDD revision. When consent or eligibility is uncertain, do not show an ad or grant a purchase advantage.

## Mandatory production order

Work on only one package at a time. Complete it, commit it, and wait for the user's `Devam` before starting the next package.

1. P0 — Economic integrity: unified OwnedAsset, book cost, journal, net worth, settlement tests.
2. P0 — Deterministic world: injected clock, lifecycle tick, active NPC hazard, incremental arrivals.
3. P1 — Decision vertical slice: compare, evidence/inspection, 24 deep families, preparation actions.
4. P1 — First session: scripted starting notebook, real choice, negotiation, listing, first profit.
5. P2 — Meta: expertise, Takip, career timeline, home reveal, analytics event contract.
6. P3 — Monetization foundation: billing, entitlement, consent and rewarded adapters; exactly four placements and four non-consumable SKUs; sandbox/test identities first, production behind its quality gate.
7. P4 — Content scale only after vertical-slice and monetization-safety tests pass.

`Devam` starts only the next package; it does not reopen product design.

## Required workflow and quality gates

For every package:

1. Inspect the current implementation and relevant GDD sections.
2. Implement only the next defined package.
3. Add unit, invariant, migration, integration, or UI tests appropriate to the change.
4. Run `pnpm test`, `pnpm lint`, and `pnpm build`; fix all failures.
5. Leave no visible fake button, TODO, placeholder control, dead control, or knowingly broken path.
6. Reconcile journal totals with cash, active book cost, and realized profit after save/load and settlement flows.
7. Commit the completed package and stop until `Devam`.

The pure engine contract is mandatory: identical seed, game time, config, and command sequence must produce identical economic results on web, tests, and native. Before calling the vertical slice complete, satisfy the full Definition of Done and resilience tests in GDD v2.1, including core invariants, core-loop integration, WebView smoke, migration, 320–430 px layout, text scaling, reduced motion, haptics-off, and missing-asset fallback.
