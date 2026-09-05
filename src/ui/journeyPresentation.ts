import type { CareerEventGroup } from "../domain/models";

export type TimelineFilter = "ALL" | CareerEventGroup;
export type CareerEventTone = "first" | "record" | "progress" | "home";

const filterLabels: Record<TimelineFilter, string> = {
  ALL: "Tümü",
  FIRSTS: "İlkler",
  RECORDS: "Rekorlar",
  MILESTONES: "Gelişim",
  HOME: "Ev yolculuğu",
};

const groupPresentation: Record<
  CareerEventGroup,
  { label: string; tone: CareerEventTone }
> = {
  FIRSTS: { label: "İlk adım", tone: "first" },
  RECORDS: { label: "Rekor", tone: "record" },
  MILESTONES: { label: "Gelişim", tone: "progress" },
  HOME: { label: "Ev hedefi", tone: "home" },
};

export function timelineFilterLabel(filter: TimelineFilter) {
  return filterLabels[filter];
}

export function careerEventPresentation(
  group: CareerEventGroup,
  currentGameMin: number,
  occurredAtGameMin: number,
) {
  const ageMin = Math.max(0, currentGameMin - occurredAtGameMin);
  return {
    ...groupPresentation[group],
    ageLabel: ageMin === 0 ? "Az önce" : `${ageMin} dk önce`,
  };
}

export function completedSalesPresentation(realizedProfitMinor: number) {
  if (realizedProfitMinor < 0) {
    return { label: "Tamamlanan satışlardan zarar", tone: "loss" as const };
  }
  if (realizedProfitMinor > 0) {
    return { label: "Tamamlanan satışlardan kâr", tone: "profit" as const };
  }
  return { label: "Tamamlanan satış sonucu", tone: "neutral" as const };
}
