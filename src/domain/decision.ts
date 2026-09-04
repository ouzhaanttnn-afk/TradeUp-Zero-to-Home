import type {
  AttributeDefinition,
  GameState,
  InspectionKind,
  Listing,
} from "./models";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export function listingEstimateBand(listing: Listing) {
  const uncertainty =
    0.24 - clamp01(listing.instance.evidenceConfidence) * 0.14;
  return {
    lowMinor:
      Math.round(
        (listing.instance.fairValueMinor * (1 - uncertainty)) / 1_000,
      ) * 1_000,
    highMinor:
      Math.round(
        (listing.instance.fairValueMinor * (1 + uncertainty)) / 1_000,
      ) * 1_000,
  };
}
export function formatAttributeValue(
  definition: AttributeDefinition,
  value: string | number | boolean,
) {
  if (typeof value === "boolean") return value ? "Var" : "Yok";
  return `${value}${definition.unit ? ` ${definition.unit}` : ""}`;
}
export const comparableListings = (state: GameState, listingId: string) => {
  const selected = state.listings.find((item) => item.id === listingId);
  if (!selected) return [];
  const same = state.listings.filter(
    (item) =>
      item.familyId === selected.familyId &&
      ["ACTIVE", "WATCHED", "NEGOTIATING"].includes(item.state),
  );
  return [selected, ...same.filter((item) => item.id !== selected.id)].slice(
    0,
    5,
  );
};
export type ComparisonRow = {
  label: string;
  values: string[];
  different: boolean;
};
export function comparisonRows(listings: Listing[]): ComparisonRow[] {
  if (!listings.length) return [];
  const base = listings[0].instance.family;
  const rows: ComparisonRow[] = [
    {
      label: "Fiyat",
      values: listings.map((item) => String(item.priceMinor)),
      different: true,
    },
    {
      label: "Kondisyon",
      values: listings.map((item) => `%${item.instance.condition}`),
      different: true,
    },
    {
      label: "Güven",
      values: listings.map(
        (item) => `%${Math.round(item.instance.evidenceConfidence * 100)}`,
      ),
      different: true,
    },
    ...[...base.attributes]
      .sort((a, b) => a.comparePriority - b.comparePriority)
      .map((definition) => ({
        label: definition.label,
        values: listings.map((item) => {
          const attribute = item.instance.attributes.find(
            (candidate) => candidate.definitionId === definition.id,
          );
          return attribute
            ? formatAttributeValue(definition, attribute.value)
            : "—";
        }),
        different: false,
      })),
  ];
  return rows
    .map((row) => ({ ...row, different: new Set(row.values).size > 1 }))
    .filter(
      (row, index) =>
        index < 3 ||
        row.different ||
        base.attributes[index - 3]?.comparePriority <= 2,
    );
}

export const inspectionOptions: Record<
  InspectionKind,
  { label: string; durationMin: number; confidenceGain: number }
> = {
  PHOTO: { label: "Fotoğrafları incele", durationMin: 0, confidenceGain: 0.08 },
  ASK_SELLER: { label: "Satıcıya sor", durationMin: 1, confidenceGain: 0.12 },
  QUICK_TEST: { label: "Hızlı test", durationMin: 2, confidenceGain: 0.24 },
};
export function inspectListing(
  state: GameState,
  listingId: string,
  kind: InspectionKind,
) {
  const id = `inspection:${listingId}:${kind}`;
  if (state.transactionJournal.some((entry) => entry.id === id))
    return { ok: true as const, state, durationMin: 0, idempotent: true };
  const target = state.listings.find((item) => item.id === listingId);
  if (!target || !["ACTIVE", "WATCHED", "NEGOTIATING"].includes(target.state))
    return {
      ok: false as const,
      state,
      durationMin: 0,
      reason: "LISTING_NOT_ACTIVE",
    };
  const option = inspectionOptions[kind];
  const instance = { ...target.instance };
  const eligible = instance.family.evidence.filter((definition) =>
    definition.inspectionKinds.includes(kind),
  );
  instance.evidence = instance.evidence.map((record) => {
    if (!eligible.some((definition) => definition.id === record.definitionId))
      return record;
    const defectDefinition = instance.family.defects.find(
      (definition) => definition.evidenceId === record.definitionId,
    );
    const defect = instance.defects.find(
      (candidate) => candidate.definitionId === defectDefinition?.id,
    );
    const status =
      kind === "QUICK_TEST"
        ? defect?.present
          ? "CHECKED"
          : "VERIFIED"
        : defect?.present
          ? "SUSPICIOUS"
          : kind === "PHOTO"
            ? "VISIBLE"
            : "CLAIMED";
    return { ...record, status };
  });
  if (kind === "QUICK_TEST")
    instance.defects = instance.defects.map((defect) => ({
      ...defect,
      revealed: eligible.some(
        (definition) =>
          instance.family.defects.find(
            (candidate) => candidate.id === defect.definitionId,
          )?.evidenceId === definition.id,
      ),
    }));
  instance.evidenceConfidence = clamp01(
    instance.evidenceConfidence + option.confidenceGain,
  );
  return {
    ok: true as const,
    durationMin: option.durationMin,
    idempotent: false,
    state: {
      ...state,
      listings: state.listings.map((item) =>
        item.id === listingId ? { ...item, instance } : item,
      ),
      transactionJournal: [
        ...state.transactionJournal,
        {
          id,
          kind: "INSPECTION" as const,
          gameTime: state.gameTimeMin,
          cashDeltaMinor: 0,
          costBasisDeltaMinor: 0,
          realizedProfitDeltaMinor: 0,
          metadata: { listingId, inspectionKind: kind },
        },
      ],
    },
  };
}
