import type { CareerEvent } from "../domain/models";
import { money, signedMoney } from "../game";

// Historical profit already includes every cost applied by settlement.
// Recover the total from that recorded result, never from today's asset value.
export function saleHistoryCopy(event: CareerEvent): string | null {
  const {
    buyPriceMinor: purchase,
    sellPriceMinor: proceeds,
    realizedProfitMinor: profit,
  } = event;
  if (purchase === undefined || proceeds === undefined) return null;
  const trade = `Alış ${money(purchase)} · Satış ${money(proceeds)}`;
  if (profit === undefined) return `${trade} · Kâr/zarar kaydı yok`;
  const totalCost = proceeds - profit;
  const extraCosts = totalCost - purchase;
  const costs =
    extraCosts > 0
      ? ` · Ek giderler ${money(extraCosts)} · Toplam harcanan ${money(totalCost)}`
      : "";
  const label = profit < 0 ? "Net zarar" : profit > 0 ? "Net kâr" : "Kâr/zarar";
  return `${trade}${costs} · ${label} ${signedMoney(profit)}`;
}
