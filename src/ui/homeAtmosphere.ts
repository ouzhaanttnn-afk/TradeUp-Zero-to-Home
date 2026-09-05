export const HOME_ATMOSPHERE_STOPS = [
  { wealthRatio: 0, goldPercent: 0 },
  { wealthRatio: 1 / 700, goldPercent: 5 },
  { wealthRatio: 0.25, goldPercent: 22 },
  { wealthRatio: 0.5, goldPercent: 42 },
  { wealthRatio: 0.75, goldPercent: 65 },
  { wealthRatio: 0.9, goldPercent: 82 },
  { wealthRatio: 1, goldPercent: 92 },
] as const;

export function homeGoldPercent(
  wealthMinor: number,
  homeGoalMinor: number,
  purchased: boolean,
) {
  if (purchased) return 100;
  if (homeGoalMinor <= 0 || wealthMinor <= 0) return 0;
  const ratio = Math.max(0, wealthMinor / homeGoalMinor);
  const upperIndex = HOME_ATMOSPHERE_STOPS.findIndex(
    (stop) => ratio <= stop.wealthRatio,
  );
  if (upperIndex <= 0) return HOME_ATMOSPHERE_STOPS[0].goldPercent;
  if (upperIndex === -1) return HOME_ATMOSPHERE_STOPS.at(-1)?.goldPercent ?? 92;
  const lower = HOME_ATMOSPHERE_STOPS[upperIndex - 1];
  const upper = HOME_ATMOSPHERE_STOPS[upperIndex];
  const progress =
    (ratio - lower.wealthRatio) / (upper.wealthRatio - lower.wealthRatio);
  return (
    Math.round(
      (lower.goldPercent + (upper.goldPercent - lower.goldPercent) * progress) *
        10,
    ) / 10
  );
}

export function homeAtmosphereStage(goldPercent: number) {
  if (goldPercent >= 100) return 7;
  if (goldPercent >= 82) return 6;
  if (goldPercent >= 65) return 5;
  if (goldPercent >= 42) return 4;
  if (goldPercent >= 22) return 3;
  if (goldPercent >= 5) return 2;
  return goldPercent > 0 ? 1 : 0;
}
