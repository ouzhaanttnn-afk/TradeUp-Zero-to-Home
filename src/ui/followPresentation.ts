import type { MarketExitReason } from "../domain/models";
import { t, type Language } from "../i18n";

export function missedOpportunityPresentation(
  reason: MarketExitReason,
  currentGameMin: number,
  occurredAtGameMin: number,
  lang?: Language,
) {
  const ageMin = Math.max(0, currentGameMin - occurredAtGameMin);
  const label =
    reason === "NPC_PURCHASE"
      ? t("follow.npcPurchased", undefined, lang)
      : t("follow.expired", undefined, lang);
  const tone = reason === "NPC_PURCHASE" ? "buyer" : "expired";
  return {
    label,
    tone,
    ageLabel: ageMin === 0 ? t("follow.justNow", undefined, lang) : t("follow.minutesAgo", { min: ageMin }, lang),
  };
}
