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
) => {
  if (askingMinor < balancedAskingMinor) return "Daha kısa bekleme";
  if (askingMinor <= premiumAskingMinor) return "Normal bekleme";
  return "Daha uzun bekleme";
};
