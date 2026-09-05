import type { EvidenceStatus } from "../domain/models";

export type EvidenceTone = "neutral" | "info" | "warning" | "success";

const presentation: Record<
  EvidenceStatus,
  { label: string; tone: EvidenceTone }
> = {
  UNKNOWN: { label: "Bilinmiyor", tone: "neutral" },
  CLAIMED: { label: "Satıcı beyanı", tone: "info" },
  VISIBLE: { label: "Fotoğrafta görülüyor", tone: "info" },
  SUSPICIOUS: { label: "Şüpheli", tone: "warning" },
  CHECKED: { label: "Kusur doğrulandı", tone: "warning" },
  VERIFIED: { label: "Sorunsuz doğrulandı", tone: "success" },
};

export function evidencePresentation(status: EvidenceStatus) {
  return presentation[status];
}
