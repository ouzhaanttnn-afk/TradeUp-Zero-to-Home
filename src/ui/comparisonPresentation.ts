import {
  comparisonRows,
  listingEstimateBand,
  type ComparisonRow,
} from "../domain/decision";
import type { Listing } from "../domain/models";
import { money } from "../game";
import { evidencePresentation } from "./evidencePresentation";
import { formatEstimate } from "./wealthPresentation";

import {
  t,
  getLanguage,
  type Language,
  localizeAttribute,
  localizeEvidence,
  localizeSeller,
} from "../i18n";

export const sellerLabel = {
  get urgent() { return t("sellerType.urgent"); },
  get expert() { return t("sellerType.expert"); },
  get uninformed() { return t("sellerType.uninformed"); },
  get emotional() { return t("sellerType.emotional"); },
  get merchant() { return t("sellerType.merchant"); },
  get risky() { return t("sellerType.risky"); },
};

export function comparisonPresentation(
  listings: Listing[],
  expertiseLevel = 0,
  lang: Language = getLanguage(),
): ComparisonRow[] {
  if (!listings.length) return [];
  const row = (label: string, values: string[]): ComparisonRow => ({
    label,
    values,
    different: new Set(values).size > 1,
  });
  const base = comparisonRows(listings).map((item) => {
    let label = item.label;
    if (label === "Fiyat") label = t("market.price", undefined, lang);
    else if (label === "Kondisyon") label = t("market.conditionLabel", undefined, lang);
    else if (label === "Bilgi güveni") label = t("market.infoConfidence", undefined, lang);
    else label = localizeAttribute(label, lang);

    return item.label === "Fiyat"
      ? { ...item, label, values: item.values.map((value) => money(Number(value), lang)) }
      : {
          ...item,
          label,
          values: item.values.map((v) => {
            if (v === "Var") return lang === "tr" ? "Var" : lang === "de" ? "Ja" : lang === "es" ? "Sí" : "Yes";
            if (v === "Yok") return lang === "tr" ? "Yok" : lang === "de" ? "Nein" : "No";
            if (v === "Temel") return lang === "tr" ? "Temel" : lang === "de" ? "Basis" : lang === "es" ? "Básico" : "Basic";
            if (lang !== "tr" && typeof v === "string" && v.startsWith("%")) return v.slice(1) + "%";
            return v;
          }),
        };
  });
  return [
    ...base.slice(0, 3),
    row(
      t("sheet.estPriceRange", undefined, lang),
      listings.map((item) =>
        formatEstimate(listingEstimateBand(item, expertiseLevel), false, lang),
      ),
    ),
    row(
      t("market.sellerType", undefined, lang),
      listings.map((item) => localizeSeller(item.seller, sellerLabel[item.seller], lang)),
    ),
    ...(expertiseLevel >= 1
      ? [
          row(
            t("portfolio.salesSpeed", undefined, lang),
            listings.map(
              (item) => {
                const pct = Math.round(item.instance.family.liquidity * 100);
                return lang === "tr" ? `%${pct}` : `${pct}%`;
              },
            ),
          ),
        ]
      : []),
    ...base.slice(3),
    ...listings[0].instance.family.evidence.map((definition) =>
      row(
        t("sheet.inspectDefect", { defect: localizeEvidence(definition.label, lang) }, lang),
        listings.map(
          (item) =>
            evidencePresentation(
              item.instance.evidence.find(
                (record) => record.definitionId === definition.id,
              )?.status ?? "UNKNOWN",
              lang,
            ).label,
        ),
      ),
    ),
  ];
}
