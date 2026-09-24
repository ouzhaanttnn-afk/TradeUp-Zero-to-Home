import type { OwnershipState } from "../domain/models";
import { t, type Language } from "../i18n";

export type OwnershipTone =
  "available" | "working" | "listed" | "reserved" | "pending" | "complete";

const stateKeyMap: Record<OwnershipState, { key: string; tone: OwnershipTone }> = {
  IN_INVENTORY: { key: "ownership.inInventory", tone: "available" },
  PREPARING: { key: "ownership.preparing", tone: "working" },
  READY: { key: "ownership.ready", tone: "available" },
  LISTED: { key: "ownership.listed", tone: "listed" },
  RESERVED: { key: "ownership.reserved", tone: "reserved" },
  SOLD_PENDING: { key: "ownership.soldPending", tone: "pending" },
  SOLD_COMPLETE: { key: "ownership.soldComplete", tone: "complete" },
};

export function ownershipPresentation(state: OwnershipState, lang?: Language) {
  const item = stateKeyMap[state];
  return {
    label: t(item.key, undefined, lang),
    tone: item.tone,
  };
}
