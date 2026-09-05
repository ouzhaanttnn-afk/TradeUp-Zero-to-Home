const legacyTerms: ReadonlyArray<readonly [string, string]> = [
  ["Pazar okuryazarlığı", "Pazar deneyimi"],
];

export function simplifyLegacyPlayerCopy(value: string) {
  return legacyTerms.reduce(
    (copy, [technical, simple]) => copy.replaceAll(technical, simple),
    value,
  );
}
