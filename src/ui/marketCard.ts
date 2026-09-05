export function listingAgeLabel(createdAtGameMin: number, gameTimeMin: number) {
  const age = Math.max(0, gameTimeMin - createdAtGameMin);
  if (age < 1) return "Yeni";
  if (age < 60) return `${age} dk`;
  return `${Math.floor(age / 60)} sa`;
}
