const MINUTES_PER_DAY = 1_440;

// (exclusive upper bound in minutes-of-day, Turkish label)
const TIME_OF_DAY_BUCKETS: readonly (readonly [number, string])[] = [
  [360, "Gece"],
  [720, "Sabah"],
  [840, "Öğle"],
  [1_080, "Öğleden sonra"],
  [1_320, "Akşam"],
  [MINUTES_PER_DAY, "Gece"],
];

// Reads the same gameTimeMin the economy simulation runs on -- not a
// decorative wall clock -- and buckets it into a day count and a coarse
// time-of-day phrase.
export function gameClockLabel(gameTimeMin: number): string {
  const safeMinute = Math.max(0, Math.floor(gameTimeMin));
  const day = Math.floor(safeMinute / MINUTES_PER_DAY) + 1;
  const minuteOfDay = safeMinute % MINUTES_PER_DAY;
  const [, label] =
    TIME_OF_DAY_BUCKETS.find(([end]) => minuteOfDay < end) ??
    TIME_OF_DAY_BUCKETS[TIME_OF_DAY_BUCKETS.length - 1];
  return `${day}. Gün · ${label}`;
}
