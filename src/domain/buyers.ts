import type { BuyerType, GameState, OwnedAsset } from "./models";

export const BUYER_PERSONAS: Record<
  BuyerType,
  {
    label: string;
    tendency: string;
    amountMultiplier: number;
    counterAcceptBelow: number;
    counterFinalBelow: number;
    names: readonly string[];
  }
> = {
  QUICK: {
    label: "Hızlı alıcı",
    tendency: "Bugün teslim ister · daha düşük açar",
    amountMultiplier: 0.96,
    counterAcceptBelow: 55,
    counterFinalBelow: 86,
    names: ["Deniz", "Arda"],
  },
  QUALITY: {
    label: "Kalite arayan",
    tendency: "Kondisyon ve ürün bilgisine önem verir",
    amountMultiplier: 1.035,
    counterAcceptBelow: 50,
    counterFinalBelow: 82,
    names: ["Ece", "İpek"],
  },
  NEGOTIATOR: {
    label: "Pazarlıkçı",
    tendency: "Düşük açar · karşı teklife dirençlidir",
    amountMultiplier: 0.91,
    counterAcceptBelow: 32,
    counterFinalBelow: 78,
    names: ["Mert", "Bora"],
  },
  COLLECTOR: {
    label: "Koleksiyoncu",
    tendency: "Nadir ve doğrulanmış ürüne daha çok öder",
    amountMultiplier: 1.07,
    counterAcceptBelow: 58,
    counterFinalBelow: 88,
    names: ["Selin", "Nehir"],
  },
  RISK_AVERSE: {
    label: "Temkinli alıcı",
    tendency: "Belirsiz üründen uzak durur",
    amountMultiplier: 0.99,
    counterAcceptBelow: 42,
    counterFinalBelow: 76,
    names: ["Can", "Duru"],
  },
  BULK: {
    label: "Toplu alıcı",
    tendency: "Aynı türden ürün arar · indirim bekler",
    amountMultiplier: 0.93,
    counterAcceptBelow: 30,
    counterFinalBelow: 72,
    names: ["Ozan", "Aslı"],
  },
};

export function eligibleBuyerTypes(state: GameState, asset: OwnedAsset) {
  const types: BuyerType[] = ["QUICK", "NEGOTIATOR"];
  if (
    asset.instance.condition >= 65 &&
    asset.instance.evidenceConfidence >= 0.55
  )
    types.push("QUALITY");
  if (
    asset.instance.family.rarity >= 2 &&
    asset.instance.evidenceConfidence >= 0.55
  )
    types.push("COLLECTOR");
  if (asset.instance.evidenceConfidence >= 0.65) types.push("RISK_AVERSE");
  if (
    state.ownedAssets.filter(
      (candidate) =>
        candidate.familyId === asset.familyId &&
        candidate.state !== "SOLD_COMPLETE",
    ).length >= 2
  )
    types.push("BULK");
  return types;
}

export const buyerPersona = (type?: BuyerType) =>
  type ? BUYER_PERSONAS[type] : undefined;
