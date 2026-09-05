import { describe, expect, it } from "vitest";
import type { BuyerOffer, PlayerListing } from "../domain/models";
import { listingActivity } from "./listingActivity";

const listing: PlayerListing = {
  id: "listing:1",
  ownedAssetId: "asset:1",
  askingPriceMinor: 10000,
  interest: 0,
  createdAtGameMin: 10,
  expiresAtGameMin: 100,
  state: "ACTIVE",
};
const offer: BuyerOffer = {
  id: "offer:1",
  listingId: listing.id,
  amountMinor: 9000,
  buyer: "Deniz",
  expiresAtGameMin: 30,
};

describe("listing waiting and offer presentation", () => {
  it("shows elapsed game time rather than an invented arrival countdown", () => {
    expect(listingActivity(listing, [], 10)).toEqual({
      offers: [],
      waiting: true,
      ageLabel: "Az önce yayınlandı",
    });
    expect(listingActivity(listing, [], 17).ageLabel).toBe(
      "7 oyun dakikasıdır yayında",
    );
    expect(listingActivity(listing, [], 9).ageLabel).toBe("Az önce yayınlandı");
  });
  it("replaces waiting with only this listing's unexpired offers", () => {
    const unrelated = { ...offer, id: "unrelated", listingId: "other" };
    expect(listingActivity(listing, [unrelated], 12).waiting).toBe(true);
    expect(listingActivity(listing, [unrelated, offer], 12)).toMatchObject({
      offers: [offer],
      waiting: false,
    });
    expect(listingActivity(listing, [offer], 30)).toMatchObject({
      offers: [],
      waiting: true,
    });
  });
  it.each([
    "WITHDRAWN",
    "EXPIRED",
    "SOLD_COMPLETE",
    "RESERVED",
    "SOLD_PENDING",
  ] as const)("does not advertise pending buyers for a %s listing", (state) => {
    expect(listingActivity({ ...listing, state }, [offer], 12)).toMatchObject({
      offers: [],
      waiting: false,
    });
  });
  it("respects listing expiry even before the next lifecycle cleanup", () => {
    expect(
      listingActivity(listing, [{ ...offer, expiresAtGameMin: 200 }], 100),
    ).toMatchObject({ offers: [], waiting: false });
  });
});
