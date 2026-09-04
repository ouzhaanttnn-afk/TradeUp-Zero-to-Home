import type { GameState, OwnedAsset, PreparationKind } from "./models";

export const preparationDefinition = (
  asset: OwnedAsset,
  kind: PreparationKind,
) => asset.instance.family.preparation.find((item) => item.kind === kind);
export function startPreparation(
  state: GameState,
  assetId: string,
  kind: PreparationKind,
) {
  const asset = state.ownedAssets.find((item) => item.id === assetId);
  const definition = asset ? preparationDefinition(asset, kind) : undefined;
  const id = `preparation:${assetId}:${kind}`;
  if (state.transactionJournal.some((entry) => entry.id === id))
    return { ok: true as const, state, idempotent: true, durationMin: 0 };
  if (!asset || !definition)
    return {
      ok: false as const,
      state,
      reason: "ASSET_NOT_FOUND",
      durationMin: 0,
    };
  if (!["IN_INVENTORY", "READY"].includes(asset.state))
    return {
      ok: false as const,
      state,
      reason: "ASSET_NOT_AVAILABLE",
      durationMin: 0,
    };
  if (
    asset.instance.preparationHistory.filter((item) => item.kind === kind)
      .length >= definition.maxUses
  )
    return {
      ok: false as const,
      state,
      reason: "ACTION_LIMIT",
      durationMin: 0,
    };
  if (state.cashMinor < definition.costMinor)
    return {
      ok: false as const,
      state,
      reason: "INSUFFICIENT_CASH",
      durationMin: 0,
    };
  const record = {
    id,
    kind,
    state: "IN_PROGRESS" as const,
    startedAtGameMin: state.gameTimeMin,
    completesAtGameMin: state.gameTimeMin + definition.durationMin,
    costMinor: definition.costMinor,
  };
  const updated: OwnedAsset = {
    ...asset,
    state: "PREPARING",
    preparationCostMinor:
      asset.preparationCostMinor + (kind === "TEST" ? 0 : definition.costMinor),
    inspectionCostMinor:
      asset.inspectionCostMinor + (kind === "TEST" ? definition.costMinor : 0),
    bookCostMinor: asset.bookCostMinor + definition.costMinor,
    instance: {
      ...asset.instance,
      preparationHistory: [...asset.instance.preparationHistory, record],
    },
  };
  return {
    ok: true as const,
    idempotent: false,
    durationMin: definition.durationMin,
    state: {
      ...state,
      cashMinor: state.cashMinor - definition.costMinor,
      ownedAssets: state.ownedAssets.map((item) =>
        item.id === assetId ? updated : item,
      ),
      transactionJournal: [
        ...state.transactionJournal,
        {
          id,
          kind:
            kind === "TEST"
              ? ("INSPECTION" as const)
              : ("PREPARATION" as const),
          gameTime: state.gameTimeMin,
          assetId,
          cashDeltaMinor: -definition.costMinor,
          costBasisDeltaMinor: definition.costMinor,
          realizedProfitDeltaMinor: 0,
          metadata: {
            preparationKind: kind,
            durationMin: definition.durationMin,
          },
        },
      ],
    },
  };
}
export function completeDuePreparations(
  state: GameState,
  gameTimeMin: number,
): GameState {
  return {
    ...state,
    ownedAssets: state.ownedAssets.map((asset) => {
      const pending = asset.instance.preparationHistory.find(
        (record) =>
          record.state === "IN_PROGRESS" &&
          record.completesAtGameMin <= gameTimeMin,
      );
      if (!pending) return asset;
      const definition = preparationDefinition(asset, pending.kind);
      if (!definition) return asset;
      const instance = {
        ...asset.instance,
        condition: Math.min(
          asset.instance.family.conditionCap,
          asset.instance.condition + definition.conditionGain,
        ),
        fairValueMinor: Math.round(
          (asset.instance.fairValueMinor * (10_000 + definition.valueGainBps)) /
            10_000,
        ),
        evidenceConfidence: Math.min(
          1,
          asset.instance.evidenceConfidence + definition.confidenceGain,
        ),
        liquidityBonusBps:
          asset.instance.liquidityBonusBps + definition.liquidityGainBps,
        accessoryComplete:
          pending.kind === "COMPLETE" ? true : asset.instance.accessoryComplete,
        preparationHistory: asset.instance.preparationHistory.map((record) =>
          record.id === pending.id
            ? { ...record, state: "COMPLETE" as const }
            : record,
        ),
      };
      if (pending.kind === "TEST") {
        instance.evidence = instance.evidence.map((record) => ({
          ...record,
          status: "VERIFIED" as const,
        }));
        instance.defects = instance.defects.map((defect) => ({
          ...defect,
          revealed: true,
        }));
      }
      return { ...asset, state: "READY", instance };
    }),
  };
}
