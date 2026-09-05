import type { MarketExitReason } from "../domain/models";

const missedReason: Record<
  MarketExitReason,
  { label: string; tone: "buyer" | "expired" }
> = {
  NPC_PURCHASE: { label: "Başka alıcı aldı", tone: "buyer" },
  EXPIRED: { label: "Süresi doldu", tone: "expired" },
};

export function missedOpportunityPresentation(
  reason: MarketExitReason,
  currentGameMin: number,
  occurredAtGameMin: number,
) {
  const ageMin = Math.max(0, currentGameMin - occurredAtGameMin);
  return {
    ...missedReason[reason],
    ageLabel: ageMin === 0 ? "Az önce" : `${ageMin} dk önce`,
  };
}
