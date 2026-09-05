import { beforeEach, describe, expect, it, vi } from "vitest";
import { Haptics } from "@capacitor/haptics";

vi.mock("@capacitor/haptics", () => ({
  Haptics: { notification: vi.fn(() => Promise.resolve()) },
  NotificationType: { Success: "SUCCESS", Warning: "WARNING" },
}));
vi.mock("../infrastructure/audio", () => ({
  playFeedbackSound: vi.fn(() => Promise.resolve()),
}));
vi.mock("../services/persistence", () => ({
  clearGame: vi.fn(() => Promise.resolve()),
  loadGame: vi.fn(),
  loadGameWithStatus: vi.fn(() =>
    Promise.resolve({ state: initialState(), recovery: "NONE" }),
  ),
  saveGame: vi.fn(() => Promise.resolve()),
}));

import { initialState, validateState } from "../game";
import {
  addAssetCost,
  quoteAssetExit,
  reconcileJournal,
} from "../domain/economy";
import { playFeedbackSound } from "../infrastructure/audio";
import { loadGameWithStatus, saveGame } from "../services/persistence";
import { useGameStore } from "./gameStore";
import { systemTimeProvider } from "../infrastructure/time";
import {
  configureMonetizationAdapters,
  unavailableMonetizationAdapters,
} from "../services/monetization";

describe("application lifecycle", () => {
  it("keeps the background boundary when a provider responds while paused", async () => {
    await useGameStore.getState().flush();
    const clock = vi
      .spyOn(systemTimeProvider, "nowWallMs")
      .mockReturnValue(1_000);
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    configureMonetizationAdapters({
      ...unavailableMonetizationAdapters,
      consent: {
        refresh: async () => {
          await gate;
          return { canRequestAds: false, adPersonalizationAllowed: false };
        },
        openPrivacyOptions: async () => {},
      },
    });
    try {
      const game = initialState(1_000, "SANDBOX");
      game.ftue.stage = "COMPLETE";
      useGameStore.setState({
        game,
        ready: true,
        sessionActive: true,
        monetizationBusy: false,
      });
      const pending = useGameStore.getState().openPurchases();
      await useGameStore.getState().pause();
      clock.mockReturnValue(121_000);
      finish();
      await pending;
      expect(useGameStore.getState().game.lastWallClockMs).toBe(1_000);
      clock.mockReturnValue(301_000);
      await useGameStore.getState().resume();
      expect(useGameStore.getState().game.gameTimeMin).toBe(5);
    } finally {
      finish();
      clock.mockRestore();
      configureMonetizationAdapters(unavailableMonetizationAdapters);
      useGameStore.setState({ sessionActive: true });
    }
  });

  it("coalesces concurrent startup loads", async () => {
    await useGameStore.getState().flush();
    const game = initialState(0, "SANDBOX");
    let finish!: (value: { state: typeof game; recovery: "NONE" }) => void;
    vi.mocked(loadGameWithStatus).mockClear();
    vi.mocked(loadGameWithStatus).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const first = useGameStore.getState().hydrate();
    const second = useGameStore.getState().hydrate();
    expect(first).toBe(second);
    await vi.waitFor(() => expect(loadGameWithStatus).toHaveBeenCalledTimes(1));
    finish({ state: game, recovery: "NONE" });
    await Promise.all([first, second]);
  });

  it("pauses active time and resumes the current session only once without disk reload", async () => {
    await useGameStore.getState().flush();
    const clock = vi
      .spyOn(systemTimeProvider, "nowWallMs")
      .mockReturnValue(1_000);
    try {
      const game = initialState(1_000, "SANDBOX");
      game.ftue.stage = "COMPLETE";
      useGameStore.setState({ game, ready: true, sessionActive: true });
      vi.mocked(loadGameWithStatus).mockClear();
      await useGameStore.getState().pause();
      const paused = useGameStore.getState().game;
      useGameStore.getState().tick();
      expect(useGameStore.getState().game).toBe(paused);
      clock.mockReturnValue(121_000);
      await useGameStore.getState().pause();
      expect(useGameStore.getState().game.lastWallClockMs).toBe(1_000);
      await useGameStore.getState().resume();
      const resumed = useGameStore.getState().game;
      expect(resumed.gameTimeMin).toBe(paused.gameTimeMin + 2);
      expect(resumed.monetization.lifetimeActivePlayMinutes).toBe(
        paused.monetization.lifetimeActivePlayMinutes,
      );
      expect(loadGameWithStatus).not.toHaveBeenCalled();
      await useGameStore.getState().resume();
      expect(useGameStore.getState().game).toBe(resumed);
      expect(reconcileJournal(resumed)).toEqual({
        cash: true,
        activeBookCost: true,
        realizedProfit: true,
      });
    } finally {
      clock.mockRestore();
      useGameStore.setState({ sessionActive: true });
    }
  });

  it("serializes flush with newer gameplay writes", async () => {
    await useGameStore.getState().flush();
    const game = initialState(0, "SANDBOX");
    useGameStore.setState({ game, ready: true, sessionActive: true });
    vi.mocked(saveGame).mockClear();
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    vi.mocked(saveGame).mockImplementationOnce(() => gate);
    const flushing = useGameStore.getState().flush();
    await vi.waitFor(() => expect(saveGame).toHaveBeenCalledTimes(1));
    useGameStore.getState().tick();
    const advanced = useGameStore.getState().game;
    await Promise.resolve();
    expect(saveGame).toHaveBeenCalledTimes(1);
    finish();
    await flushing;
    await useGameStore.getState().flush();
    expect(vi.mocked(saveGame).mock.calls.at(-1)?.[0].gameTimeMin).toBe(
      advanced.gameTimeMin,
    );
  });

  it("reports background write failure and retains the session on return", async () => {
    await useGameStore.getState().flush();
    const game = initialState(0, "SANDBOX");
    useGameStore.setState({ game, ready: true, sessionActive: true });
    vi.mocked(saveGame).mockRejectedValueOnce(new Error("disk full"));
    await useGameStore.getState().pause();
    expect(useGameStore.getState().notice).toContain("kaydedilemedi");
    expect(useGameStore.getState().game.transactionJournal).toEqual(
      game.transactionJournal,
    );
    await useGameStore.getState().resume();
    expect(useGameStore.getState().game.transactionJournal).toEqual(
      game.transactionJournal,
    );
  });
});

describe("delayed provider responses", () => {
  it.each(["hydrate", "openPurchases"] as const)(
    "preserves gameplay while %s waits for consent",
    async (action) => {
      await useGameStore.getState().flush();
      const game = initialState(0, "SANDBOX");
      useGameStore.setState({ game, ready: true, monetizationBusy: false });
      vi.mocked(loadGameWithStatus).mockResolvedValueOnce({
        state: game,
        recovery: "NONE",
      });
      let entered!: () => void;
      const started = new Promise<void>((resolve) => {
        entered = resolve;
      });
      let finish!: () => void;
      const gate = new Promise<void>((resolve) => {
        finish = resolve;
      });
      configureMonetizationAdapters({
        ...unavailableMonetizationAdapters,
        consent: {
          refresh: async () => {
            entered();
            await gate;
            return { canRequestAds: false, adPersonalizationAllowed: false };
          },
          openPrivacyOptions: async () => {},
        },
      });
      try {
        const pending = useGameStore.getState()[action]();
        await started;
        useGameStore.getState().tick();
        useGameStore.getState().setLargeText(true);
        const advanced = useGameStore.getState().game;
        finish();
        await pending;
        const after = useGameStore.getState().game;
        expect(after.gameTimeMin).toBe(advanced.gameTimeMin);
        expect(after.listings).toEqual(advanced.listings);
        expect(after.accessibility.largeText).toBe(true);
        expect(after.transactionJournal).toEqual(advanced.transactionJournal);
        expect(reconcileJournal(after)).toEqual({
          cash: true,
          activeBookCost: true,
          realizedProfit: true,
        });
      } finally {
        finish();
        configureMonetizationAdapters(unavailableMonetizationAdapters);
        vi.mocked(loadGameWithStatus).mockReset();
        vi.mocked(loadGameWithStatus).mockResolvedValue({
          state: initialState(),
          recovery: "NONE",
        });
      }
    },
  );
});

describe("stale sale confirmation", () => {
  beforeEach(() => {
    const game = initialState(0, "SANDBOX");
    game.cashMinor = 1_000_000;
    game.transactionJournal[0].cashDeltaMinor = game.cashMinor;
    useGameStore.setState({ game, ready: true, notice: "" });
    useGameStore.getState().buy(game.listings[0], 20_000);
  });

  it("requires a fresh confirmation when costs changed even if the sale price stayed the same", () => {
    const game = useGameStore.getState().game;
    const oldAsset = game.ownedAssets[0];
    const charged = addAssetCost(
      game,
      oldAsset.id,
      "FEE",
      500,
      "fee:stale-sale",
      game.gameTimeMin,
    );
    if (!charged.ok) throw new Error(charged.reason);
    useGameStore.setState({ game: charged.state });
    useGameStore.getState().sell(oldAsset, true);
    expect(useGameStore.getState().game).toBe(charged.state);
    expect(useGameStore.getState().notice).toContain("yeniden onayla");
    const updated = charged.state.ownedAssets[0];
    useGameStore.getState().sell(updated, true);
    const sold = useGameStore.getState().game;
    expect(sold.realizedProfitMinor).toBe(
      quoteAssetExit(updated).quickSaleMinor - updated.bookCostMinor,
    );
    expect(reconcileJournal(sold)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });

  it("rejects an old confirmation after preparation changes the product", () => {
    const oldAsset = useGameStore.getState().game.ownedAssets[0];
    useGameStore.getState().prepare(oldAsset.id, "CLEAN");
    const prepared = useGameStore.getState().game;
    useGameStore.getState().sell(oldAsset, true);
    expect(useGameStore.getState().game).toBe(prepared);
    expect(useGameStore.getState().notice).toContain("yeniden onayla");
  });

  it("cannot use an old inventory card to sell a now-listed product", () => {
    const oldAsset = useGameStore.getState().game.ownedAssets[0];
    useGameStore
      .getState()
      .list(oldAsset, quoteAssetExit(oldAsset).balancedAskingMinor);
    const listed = useGameStore.getState().game;
    useGameStore.getState().sell(oldAsset, true);
    expect(useGameStore.getState().game).toBe(listed);
    expect(useGameStore.getState().notice).toContain("uygun değil");
  });
});

describe("buyer offer settlement", () => {
  beforeEach(() => {
    useGameStore.setState({ game: initialState(0), ready: true, notice: "" });
  });

  it("records the normal buyer wait and tempo revision without changing cash", () => {
    useGameStore.setState({
      game: initialState(0, "SANDBOX"),
      ready: true,
      sessionActive: true,
    });
    useGameStore.getState().buy(useGameStore.getState().game.listings[0], 100);
    const asset = useGameStore.getState().game.ownedAssets[0];
    useGameStore
      .getState()
      .list(asset, quoteAssetExit(asset).balancedAskingMinor);
    const listed = useGameStore.getState().game;
    for (
      let minute = 0;
      minute < 120 && !useGameStore.getState().game.buyerOffers.length;
      minute++
    ) {
      useGameStore.getState().tick();
    }
    const offered = useGameStore.getState().game;
    const offer = offered.buyerOffers[0];
    expect(offer).toBeDefined();
    const listing = offered.playerListings.find(
      (item) => item.id === offer.listingId,
    )!;
    const event = offered.analytics.events.find(
      (item) => item.id === `analytics:buyer_offer:${offer.id}`,
    )!;
    expect(event.properties).toMatchObject({
      buyerTempoRevision: "buyer-tempo-2026-09-05",
      scripted: false,
      listingAgeAtOfferMin:
        offer.expiresAtGameMin - 60 - listing.createdAtGameMin,
    });
    expect(offered.cashMinor).toBe(listed.cashMinor);
    expect(offered.transactionJournal).toEqual(listed.transactionJournal);
  });

  it.each(["offer", "listing"] as const)(
    "rejects an expired %s at the saved game-time boundary without changing accounting",
    (expired) => {
      const game = useGameStore.getState().game;
      const offer = game.buyerOffers[0];
      const listing = game.playerListings.find(
        (item) => item.id === offer.listingId,
      )!;
      if (expired === "offer") offer.expiresAtGameMin = game.gameTimeMin;
      else listing.expiresAtGameMin = game.gameTimeMin;
      const restored = validateState(JSON.parse(JSON.stringify(game)));
      useGameStore.setState({ game: restored });

      useGameStore.getState().acceptBuyer(offer.id);

      expect(useGameStore.getState().game).toBe(restored);
      expect(useGameStore.getState().notice).toContain(
        "artık kabul edilemiyor",
      );
      expect(reconcileJournal(restored)).toEqual({
        cash: true,
        activeBookCost: true,
        realizedProfit: true,
      });
    },
  );

  it("cannot accept a withdrawn offer after save/load", () => {
    const offer = useGameStore.getState().game.buyerOffers[0];
    useGameStore.getState().withdrawListing(offer.listingId);
    const restored = validateState(
      JSON.parse(JSON.stringify(useGameStore.getState().game)),
    );
    useGameStore.setState({ game: restored });
    useGameStore.getState().acceptBuyer(offer.id);
    expect(useGameStore.getState().game).toBe(restored);
    expect(restored.buyerOffers).toHaveLength(0);
    expect(restored.ownedAssets[0].state).toBe("IN_INVENTORY");
  });

  it("accepts just before expiry and cannot repeat the sale after save/load", () => {
    const game = useGameStore.getState().game;
    const offer = game.buyerOffers[0];
    offer.expiresAtGameMin = game.gameTimeMin + 1;
    const asset = game.ownedAssets[0];
    useGameStore.getState().acceptBuyer(offer.id);
    const restored = validateState(
      JSON.parse(JSON.stringify(useGameStore.getState().game)),
    );
    expect(restored.cashMinor).toBe(game.cashMinor + offer.amountMinor);
    expect(restored.realizedProfitMinor).toBe(
      game.realizedProfitMinor + offer.amountMinor - asset.bookCostMinor,
    );
    expect(restored.buyerOffers).toHaveLength(0);
    expect(restored.playerListings[0].state).toBe("SOLD_COMPLETE");
    useGameStore.setState({ game: restored });
    useGameStore.getState().acceptBuyer(offer.id);
    useGameStore.getState().acceptBuyer(offer.id);
    expect(useGameStore.getState().game).toBe(restored);
    expect(
      restored.transactionJournal.filter(
        (entry) => entry.kind === "SALE" && entry.assetId === asset.id,
      ),
    ).toHaveLength(1);
    expect(reconcileJournal(restored)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });
});

describe("replayed commands", () => {
  beforeEach(() => {
    const game = initialState(0, "SANDBOX");
    game.cashMinor = 1_000_000;
    game.transactionJournal[0].cashDeltaMinor = game.cashMinor;
    useGameStore.setState({ game, ready: true, notice: "" });
  });

  it.each([
    "purchase",
    "preparation",
    "inspection",
    "withdrawal",
    "sale",
  ] as const)(
    "replaying %s after save/load does not advance the market, duplicate analytics or change money",
    (action) => {
      const listing = useGameStore.getState().game.listings[0];
      let replay: () => unknown;
      if (action === "inspection") {
        replay = () =>
          useGameStore.getState().inspect(listing.id, "QUICK_TEST");
      } else if (action === "purchase") {
        replay = () => useGameStore.getState().buy(listing, 20_000);
      } else {
        useGameStore.getState().buy(listing, 20_000);
        const asset = useGameStore.getState().game.ownedAssets[0];
        if (action === "preparation") {
          replay = () => useGameStore.getState().prepare(asset.id, "CLEAN");
        } else if (action === "sale") {
          replay = () => useGameStore.getState().sell(asset, true);
        } else {
          useGameStore
            .getState()
            .list(asset, quoteAssetExit(asset).balancedAskingMinor);
          const playerListing = useGameStore.getState().game.playerListings[0];
          replay = () =>
            useGameStore.getState().withdrawListing(playerListing.id);
        }
      }
      replay();
      const restored = validateState(
        JSON.parse(JSON.stringify(useGameStore.getState().game)),
      );
      useGameStore.setState({ game: restored });
      vi.mocked(Haptics.notification).mockClear();
      vi.mocked(playFeedbackSound).mockClear();
      replay();
      replay();
      expect(useGameStore.getState().game).toBe(restored);
      expect(reconcileJournal(restored)).toEqual({
        cash: true,
        activeBookCost: true,
        realizedProfit: true,
      });
      expect(Haptics.notification).not.toHaveBeenCalled();
      expect(playFeedbackSound).not.toHaveBeenCalled();
    },
  );
});

describe("accessibility preferences", () => {
  beforeEach(() => {
    vi.mocked(Haptics.notification).mockClear();
    vi.mocked(playFeedbackSound).mockClear();
    useGameStore.setState({
      game: initialState(0, "SANDBOX"),
      ready: true,
      notice: "",
    });
  });

  it("suppresses native haptics when the player disables them", () => {
    useGameStore.getState().setHaptics(false);
    const game = useGameStore.getState().game;
    const listing = game.listings[0];

    expect(useGameStore.getState().buy(listing, game.cashMinor + 1)).toBe(
      false,
    );
    expect(Haptics.notification).not.toHaveBeenCalled();
    expect(useGameStore.getState().game.accessibility.hapticsEnabled).toBe(
      false,
    );
  });

  it("stores the explicit reduced-motion preference in game state", () => {
    useGameStore.getState().setReducedMotion(true);

    expect(useGameStore.getState().game.accessibility.reducedMotion).toBe(true);
    expect(useGameStore.getState().notice).toBe(
      "Arayüz hareketleri azaltıldı.",
    );
  });

  it("stores the large-text preference for the compact mobile layout", () => {
    useGameStore.getState().setLargeText(true);

    expect(useGameStore.getState().game.accessibility.largeText).toBe(true);
    expect(useGameStore.getState().notice).toBe("Büyük metin görünümü açıldı.");
  });

  it("keeps semantic audio silent when the sound level is off", () => {
    useGameStore.getState().setSoundLevel("OFF");
    const game = useGameStore.getState().game;

    useGameStore.getState().buy(game.listings[0], game.cashMinor + 1);

    expect(playFeedbackSound).not.toHaveBeenCalled();
    expect(useGameStore.getState().notice).toContain("nakit eksik");
  });

  it("routes enabled feedback through the semantic audio adapter", () => {
    useGameStore.getState().setSoundLevel("NORMAL");
    const game = useGameStore.getState().game;

    useGameStore.getState().buy(game.listings[0], game.cashMinor + 1);

    expect(playFeedbackSound).toHaveBeenCalledWith("WARNING", "NORMAL");
  });
});

describe("persistence recovery notice", () => {
  it("does not overwrite an unreadable save with fallback gameplay", async () => {
    await useGameStore.getState().flush();
    vi.mocked(saveGame).mockClear();
    vi.mocked(loadGameWithStatus).mockResolvedValueOnce({
      state: initialState(1_000, "SANDBOX"),
      recovery: "STORAGE_UNAVAILABLE",
    });
    await useGameStore.getState().hydrate();
    useGameStore.getState().tick();
    await useGameStore.getState().flush();
    expect(saveGame).not.toHaveBeenCalled();
    vi.mocked(loadGameWithStatus).mockResolvedValueOnce({
      state: initialState(1_000, "SANDBOX"),
      recovery: "NONE",
    });
    await useGameStore.getState().hydrate();
    await useGameStore.getState().flush();
    expect(saveGame).toHaveBeenCalled();
  });

  it("tells the player when the last valid backup was restored", async () => {
    vi.mocked(loadGameWithStatus).mockResolvedValueOnce({
      state: initialState(1_000, "SANDBOX"),
      recovery: "RECOVERED_BACKUP",
    });

    await useGameStore.getState().hydrate();

    expect(useGameStore.getState()).toMatchObject({
      ready: true,
      notice: "Kayıt sorunu bulundu; son sağlam yedek geri yüklendi.",
    });
  });
});

describe("purchase negotiation rights", () => {
  it("preserves each listing's two rights when switching between sellers and reloading", () => {
    const game = initialState(0, "SANDBOX");
    const listings = game.listings.slice(0, 2).map((listing) => ({
      ...listing,
      priceMinor: 1_000,
      instance: { ...listing.instance, fairValueMinor: 1_000_000 },
    }));
    game.listings = listings;
    useGameStore.setState({ game, ready: true });
    for (const listing of listings) useGameStore.getState().offer(listing);
    const restored = validateState(
      JSON.parse(JSON.stringify(useGameStore.getState().game)),
    );
    expect(restored.negotiations[listings[0].id].offersRemaining).toBe(1);
    expect(restored.negotiations[listings[1].id].offersRemaining).toBe(1);
    useGameStore.setState({ game: restored });
    for (const listing of listings) useGameStore.getState().offer(listing);
    const closed = useGameStore.getState().game;
    for (const listing of listings) {
      expect(closed.negotiations[listing.id]).toMatchObject({
        offersRemaining: 0,
        closed: true,
      });
      useGameStore.getState().offer(listing);
      expect(useGameStore.getState().game).toBe(closed);
    }
    expect(reconcileJournal(closed)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });
  beforeEach(() => {
    useGameStore.setState({
      game: initialState(0, "SANDBOX"),
      ready: true,
      notice: "",
    });
  });

  it("closes after exactly two player offers and never grants a retry", () => {
    const game = structuredClone(useGameStore.getState().game);
    const listing = {
      ...game.listings[0],
      priceMinor: 2_000,
      seller: "expert" as const,
      urgency: 0,
    };
    game.cashMinor = 1_000_000;
    game.transactionJournal[0] = {
      ...game.transactionJournal[0],
      cashDeltaMinor: 1_000_000,
    };
    game.listings = [listing];
    useGameStore.setState({ game });

    useGameStore.getState().offer(listing);
    expect(useGameStore.getState().game.negotiation?.offersRemaining).toBe(1);
    useGameStore.getState().offer(listing);
    expect(useGameStore.getState().game.negotiation).toMatchObject({
      offersRemaining: 0,
      closed: true,
    });
    const afterTwo = structuredClone(useGameStore.getState().game);
    useGameStore.getState().offer(listing);
    expect(useGameStore.getState().game).toEqual(afterTwo);
  });

  it("keeps an accepted but unfunded offer closed after save/load", () => {
    const game = useGameStore.getState().game;
    const listing = game.listings[0];
    listing.priceMinor = 100_000;
    listing.instance.fairValueMinor = 1_000;
    game.cashMinor = 0;
    game.transactionJournal[0].cashDeltaMinor = 0;
    useGameStore.setState({ game });
    useGameStore.getState().offer(listing);
    expect(useGameStore.getState().game.negotiation).toMatchObject({
      offersRemaining: 1,
      closed: true,
    });
    const restored = validateState(
      JSON.parse(JSON.stringify(useGameStore.getState().game)),
    );
    useGameStore.setState({ game: restored });
    useGameStore.getState().offer(listing);
    expect(useGameStore.getState().game).toBe(restored);
    expect(reconcileJournal(restored)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });

  it("uses the saved negotiation floor rather than recalculating from a changed item", () => {
    const game = useGameStore.getState().game;
    const listing = game.listings[0];
    listing.priceMinor = 10_000;
    listing.instance.fairValueMinor = 1_000;
    game.negotiation = {
      listingId: listing.id,
      offersRemaining: 1,
      sellerFloorMinor: 1_000_000,
      closed: false,
    };
    useGameStore.setState({ game });
    useGameStore.getState().offer(listing);
    expect(useGameStore.getState().game.negotiation).toMatchObject({
      offersRemaining: 0,
      sellerFloorMinor: 1_000_000,
      closed: true,
    });
    expect(useGameStore.getState().game.ownedAssets).toHaveLength(0);
  });

  it("requires review of a changed asking price without using an offer right", () => {
    const game = useGameStore.getState().game;
    const oldListing = structuredClone(game.listings[0]);
    game.listings[0].priceMinor += 1_000;
    useGameStore.setState({ game });
    useGameStore.getState().offer(oldListing);
    expect(useGameStore.getState().game).toBe(game);
    expect(useGameStore.getState().notice).toContain("İlan fiyatı değişti");
  });
});

describe("FTUE store integration", () => {
  it("does not award compare progress for missing, single or expired listings", () => {
    const state = initialState(0, "SANDBOX");
    state.listings = [state.listings[0]];
    useGameStore.setState({ game: state, ready: true });
    useGameStore.getState().markCompared("missing-listing");
    useGameStore.getState().markCompared(state.listings[0].id);
    expect(useGameStore.getState().game).toBe(state);
    const expired = {
      ...state,
      listings: state.listings.map((listing) => ({
        ...listing,
        state: "EXPIRED" as const,
      })),
    };
    useGameStore.setState({ game: expired });
    useGameStore.getState().openListing(expired.listings[0].id);
    useGameStore.getState().markCompared(expired.listings[0].id);
    expect(useGameStore.getState().game).toBe(expired);
  });

  it("enforces the alarm unlock and rejects bad input after unlocking", () => {
    const state = initialState(0, "SANDBOX");
    useGameStore.setState({ game: state, ready: true });
    useGameStore.getState().saveSearch(state.listings[0].familyId, 100, 50);
    expect(useGameStore.getState().game).toBe(state);
    expect(useGameStore.getState().notice).toContain("Seviye 3");
    const unlocked = {
      ...state,
      expertise: { ...state.expertise, marketXp: 100_000 },
    };
    useGameStore.setState({ game: unlocked });
    useGameStore.getState().saveSearch(state.listings[0].familyId, NaN, 50);
    expect(useGameStore.getState().game).toBe(unlocked);
    expect(useGameStore.getState().notice).toContain("kaydedilemedi");
    useGameStore.getState().saveSearch(state.listings[0].familyId, 100, 50);
    expect(
      validateState(useGameStore.getState().game).follow.savedSearches,
    ).toHaveLength(1);
  });

  it("wires the full first-session loop through player actions", () => {
    useGameStore.setState({ game: initialState(), ready: true, notice: "" });
    useGameStore.getState().acceptBuyer("offer:ftue-starting-notebook");
    expect(useGameStore.getState().game.ftue.stage).toBe("COMPARE");
    expect(useGameStore.getState().game.listings).toHaveLength(3);

    useGameStore
      .getState()
      .markCompared(useGameStore.getState().game.listings[0].id);
    let game = useGameStore.getState().game;
    const choice = game.listings.find(
      (listing) => listing.priceMinor <= game.cashMinor,
    )!;
    useGameStore.getState().inspect(choice.id, "QUICK_TEST");
    expect(useGameStore.getState().game.ftue.stage).toBe("NEGOTIATION");
    useGameStore.getState().offer(choice);
    if (useGameStore.getState().game.ftue.stage === "NEGOTIATION")
      useGameStore.getState().offer(choice);
    game = useGameStore.getState().game;
    expect(game.ftue.stage).toBe("PREPARATION");

    const assetId = game.ftue.firstAssetId!;
    useGameStore.getState().prepare(assetId, "CLEAN");
    game = useGameStore.getState().game;
    expect(game.ftue.stage).toBe("LISTING");
    const asset = game.ownedAssets.find((item) => item.id === assetId)!;
    useGameStore
      .getState()
      .list(asset, quoteAssetExit(asset).balancedAskingMinor);
    game = useGameStore.getState().game;
    expect(game.ftue.stage).toBe("BUYER_SALE");
    const offer = game.buyerOffers.find((item) =>
      item.id.startsWith("offer:ftue-first-flip:"),
    )!;
    expect(
      game.analytics.events.find(
        (event) => event.id === `analytics:buyer_offer:${offer.id}`,
      )?.properties,
    ).toMatchObject({
      buyerTempoRevision: "buyer-tempo-2026-09-05",
      scripted: true,
      listingAgeAtOfferMin: 0,
    });
    useGameStore.getState().acceptBuyer(offer.id);
    game = useGameStore.getState().game;
    expect(game.ftue.stage).toBe("COMPLETE");
    expect(game.analytics.events.map((event) => event.name)).toEqual(
      expect.arrayContaining([
        "compare_started",
        "evidence_action",
        "offer_submitted",
        "purchase_complete",
        "preparation_started",
        "listing_created",
        "buyer_offer",
        "sale_complete",
      ]),
    );
    expect(reconcileJournal(game)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });
});
