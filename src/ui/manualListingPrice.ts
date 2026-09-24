import { t, type Language } from "../i18n";

export const manualListingPriceMinor = (value: string) => {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(normalized)) return null;
  const minor = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(minor) && minor >= 100 ? minor : null;
};

export const manualListingWaitCopy = (
  askingMinor: number,
  balancedAskingMinor: number,
  premiumAskingMinor: number,
  lang?: Language,
) => {
  if (askingMinor < balancedAskingMinor) return t("listing.shorterWait", undefined, lang);
  if (askingMinor <= premiumAskingMinor) return t("listing.normalWait", undefined, lang);
  return t("listing.longerWait", undefined, lang);
};
