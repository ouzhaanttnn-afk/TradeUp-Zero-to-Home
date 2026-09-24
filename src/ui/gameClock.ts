import { t, type Language } from "../i18n";

const MINUTES_PER_DAY = 1_440;

// (exclusive upper bound in minutes-of-day, translation key suffix)
const TIME_OF_DAY_BUCKETS: readonly (readonly [number, string])[] = [
  [360, "night"],
  [720, "morning"],
  [840, "noon"],
  [1_080, "afternoon"],
  [1_320, "evening"],
  [MINUTES_PER_DAY, "night"],
];

// Reads the same gameTimeMin the economy simulation runs on -- not a
// decorative wall clock -- and buckets it into a day count and a coarse
// time-of-day phrase.
export function gameClockLabel(gameTimeMin: number, lang?: Language): string {
  const safeMinute = Math.max(0, Math.floor(gameTimeMin));
  const day = Math.floor(safeMinute / MINUTES_PER_DAY) + 1;
  const minuteOfDay = safeMinute % MINUTES_PER_DAY;
  const [, bucketKey] =
    TIME_OF_DAY_BUCKETS.find(([end]) => minuteOfDay < end) ??
    TIME_OF_DAY_BUCKETS[TIME_OF_DAY_BUCKETS.length - 1];
  const timeLabel = t(`clock.${bucketKey}`, undefined, lang);
  return t("clock.dayFormat", { day, time: timeLabel }, lang);
}
