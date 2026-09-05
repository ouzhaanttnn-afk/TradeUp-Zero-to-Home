import { playerOfferMinor } from "../game";
import type { Negotiation } from "../domain/models";

export function purchaseBudget(
  askingMinor: number,
  cashMinor: number,
  negotiation: Negotiation | undefined,
  allowDirect: boolean,
) {
  const quote = (amountMinor: number) => ({
    amountMinor,
    remainingMinor: Math.max(0, cashMinor - amountMinor),
    shortfallMinor: Math.max(0, amountMinor - cashMinor),
  });
  const rights = negotiation?.offersRemaining ?? 2;
  const offer =
    rights && !negotiation?.closed
      ? quote(playerOfferMinor(askingMinor, rights === 2 ? 1 : 2))
      : null;
  const counter = negotiation?.counterMinor
    ? quote(negotiation.counterMinor)
    : null;
  const direct = allowDirect ? quote(askingMinor) : null;
  const options = [offer, counter, direct].filter((option) => option !== null);
  return {
    offer,
    counter,
    direct,
    shortfallMinor: options.length
      ? Math.min(...options.map((option) => option.shortfallMinor))
      : 0,
  };
}
