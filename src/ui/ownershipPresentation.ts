import type { OwnershipState } from "../domain/models";

export type OwnershipTone =
  "available" | "working" | "listed" | "reserved" | "pending" | "complete";

const presentation: Record<
  OwnershipState,
  { label: string; tone: OwnershipTone }
> = {
  IN_INVENTORY: { label: "Envanterde", tone: "available" },
  PREPARING: { label: "Hazırlanıyor", tone: "working" },
  READY: { label: "İlana hazır", tone: "available" },
  LISTED: { label: "İlanda", tone: "listed" },
  RESERVED: { label: "Rezerve", tone: "reserved" },
  SOLD_PENDING: { label: "Ödeme bekleniyor", tone: "pending" },
  SOLD_COMPLETE: { label: "Satış tamamlandı", tone: "complete" },
};

export function ownershipPresentation(state: OwnershipState) {
  return presentation[state];
}
