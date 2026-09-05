const legacyTerms: ReadonlyArray<readonly [string, string]> = [
  ["Pazar okuryazarlığı", "Pazar deneyimi"],
];

export function simplifyLegacyPlayerCopy(value: string) {
  const simplified = legacyTerms.reduce(
    (copy, [technical, simple]) => copy.replaceAll(technical, simple),
    value,
  );
  return simplified.replace(/\bLv\s?(\d+)\b/g, "Seviye $1");
}
