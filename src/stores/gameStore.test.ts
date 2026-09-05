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

import { initialState } from "../game";
import { quoteAssetExit, reconcileJournal } from "../domain/economy";
import { playFeedbackSound } from "../infrastructure/audio";
import { loadGameWithStatus } from "../services/persistence";
import { useGameStore } from "./gameStore";

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
});

describe("FTUE store integration", () => {
  it("wires the full first-session loop through player actions", () => {
    useGameStore.setState({ game: initialState(), ready: true, notice: "" });
    useGameStore.getState().acceptBuyer("offer:ftue-starting-notebook");
    expect(useGameStore.getState().game.ftue.stage).toBe("COMPARE");
    expect(useGameStore.getState().game.listings).toHaveLength(3);

    useGameStore.getState().markCompared();
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
