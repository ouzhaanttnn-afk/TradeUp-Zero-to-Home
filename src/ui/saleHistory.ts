import type { CareerEvent } from "../domain/models";
import { money, signedMoney } from "../game";
import { t, type Language } from "../i18n";

// Historical profit already includes every cost applied by settlement.
// Recover the total from that recorded result, never from today's asset value.
export function saleHistoryCopy(event: CareerEvent, lang?: Language): string | null {
  const {
    buyPriceMinor: purchase,
    sellPriceMinor: proceeds,
    realizedProfitMinor: profit,
  } = event;
  if (purchase === undefined || proceeds === undefined) return null;
  const trade = `${t("saleHistory.buy", undefined, lang)} ${money(purchase, lang)} · ${t("saleHistory.sell", undefined, lang)} ${money(proceeds, lang)}`;
  if (profit === undefined) return `${trade} · ${t("saleHistory.noRecord", undefined, lang)}`;
  const totalCost = proceeds - profit;
  const extraCosts = totalCost - purchase;
  const costs =
    extraCosts > 0
      ? ` · ${t("saleHistory.extraCosts", undefined, lang)} ${money(extraCosts, lang)} · ${t("saleHistory.totalCost", undefined, lang)} ${money(totalCost, lang)}`
      : "";
  const label =
    profit < 0
      ? t("saleHistory.netLoss", undefined, lang)
      : profit > 0
        ? t("saleHistory.netProfit", undefined, lang)
        : t("saleHistory.netResult", undefined, lang);
  return `${trade}${costs} · ${label} ${signedMoney(profit, lang)}`;
}
