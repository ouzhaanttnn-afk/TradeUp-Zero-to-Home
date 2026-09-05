import {
  comparisonRows,
  listingEstimateBand,
  type ComparisonRow,
} from "../domain/decision";
import type { Listing } from "../domain/models";
import { money } from "../game";
import { evidencePresentation } from "./evidencePresentation";
import { formatEstimate } from "./wealthPresentation";

export const sellerLabel = {
  urgent: "Acilci",
  expert: "Piyasacı",
  uninformed: "Bilgisiz",
  emotional: "Duygusal",
  merchant: "Tüccar",
  risky: "Riskli",
};

export function comparisonPresentation(
  listings: Listing[],
  expertiseLevel = 0,
): ComparisonRow[] {
  if (!listings.length) return [];
  const row = (label: string, values: string[]): ComparisonRow => ({
    label,
    values,
    different: new Set(values).size > 1,
  });
  const base = comparisonRows(listings).map((item) =>
    item.label === "Fiyat"
      ? { ...item, values: item.values.map((value) => money(Number(value))) }
      : item,
  );
  return [
    ...base.slice(0, 3),
    row(
      "Tahmini değer aralığı",
      listings.map((item) =>
        formatEstimate(listingEstimateBand(item, expertiseLevel)),
      ),
    ),
    row(
      "Satıcı tipi",
      listings.map((item) => sellerLabel[item.seller]),
    ),
    ...(expertiseLevel >= 1
      ? [
          row(
            "Satış hızı",
            listings.map(
              (item) => `%${Math.round(item.instance.family.liquidity * 100)}`,
            ),
          ),
        ]
      : []),
    ...base.slice(3),
    ...listings[0].instance.family.evidence.map((definition) =>
      row(
        `İnceleme · ${definition.label}`,
        listings.map(
          (item) =>
            evidencePresentation(
              item.instance.evidence.find(
                (record) => record.definitionId === definition.id,
              )?.status ?? "UNKNOWN",
            ).label,
        ),
      ),
    ),
  ];
}
