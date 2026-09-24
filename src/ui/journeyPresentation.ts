import type { CareerEventGroup } from "../domain/models";
import { t, type Language } from "../i18n";

export type TimelineFilter = "ALL" | CareerEventGroup;
export type CareerEventTone = "first" | "record" | "progress" | "home";

export function timelineFilterLabel(filter: TimelineFilter, lang?: Language) {
  const map: Record<TimelineFilter, string> = {
    ALL: "journey.filterAll",
    FIRSTS: "journey.filterFirsts",
    RECORDS: "journey.filterRecords",
    MILESTONES: "journey.filterMilestones",
    HOME: "journey.filterHome",
  };
  return t(map[filter], undefined, lang);
}

export function timelinePageState(
  itemCount: number,
  requestedPage: number,
  pageSize = 4,
) {
  const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));
  const page = Math.max(0, Math.min(requestedPage, pageCount - 1));
  return {
    page,
    pageCount,
    start: page * pageSize,
    end: Math.min(itemCount, (page + 1) * pageSize),
  };
}

export function careerEventPresentation(
  group: CareerEventGroup,
  currentGameMin: number,
  occurredAtGameMin: number,
  lang?: Language,
) {
  const ageMin = Math.max(0, currentGameMin - occurredAtGameMin);
  const toneMap: Record<CareerEventGroup, { key: string; tone: CareerEventTone }> = {
    FIRSTS: { key: "journey.groupFirsts", tone: "first" },
    RECORDS: { key: "journey.groupRecords", tone: "record" },
    MILESTONES: { key: "journey.groupMilestones", tone: "progress" },
    HOME: { key: "journey.groupHome", tone: "home" },
  };
  const item = toneMap[group];
  return {
    label: t(item.key, undefined, lang),
    tone: item.tone,
    ageLabel: ageMin === 0 ? t("follow.justNow", undefined, lang) : t("follow.minutesAgo", { min: ageMin }, lang),
  };
}

export function completedSalesPresentation(realizedProfitMinor: number, lang?: Language) {
  if (realizedProfitMinor < 0) {
    return { label: t("journey.salesLoss", undefined, lang), tone: "loss" as const };
  }
  if (realizedProfitMinor > 0) {
    return { label: t("journey.salesProfit", undefined, lang), tone: "profit" as const };
  }
  return { label: t("journey.salesNeutral", undefined, lang), tone: "neutral" as const };
}
