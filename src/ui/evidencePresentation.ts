import type { EvidenceStatus } from "../domain/models";
import { t, type Language } from "../i18n";

export type EvidenceTone = "neutral" | "info" | "warning" | "success";

const toneMap: Record<EvidenceStatus, EvidenceTone> = {
  UNKNOWN: "neutral",
  CLAIMED: "info",
  VISIBLE: "info",
  SUSPICIOUS: "warning",
  CHECKED: "warning",
  VERIFIED: "success",
};

export function evidencePresentation(status: EvidenceStatus, lang?: Language) {
  const key = `evidence.${status.toLowerCase()}`;
  return {
    label: t(key, undefined, lang),
    tone: toneMap[status] ?? "neutral",
  };
}
