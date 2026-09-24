import { describe, expect, it } from "vitest";
import { getSpecialization } from "./specialization";

describe("specialization domain module", () => {
  it("provides definitions and multi-language perks for all 3 career paths", () => {
    const restorer = getSpecialization("RESTORER");
    const negotiator = getSpecialization("NEGOTIATOR");
    const scout = getSpecialization("SCOUT");

    expect(restorer?.title.tr).toBe("Atölye Ustası");
    expect(negotiator?.title.en).toBe("Shark Negotiator");
    expect(scout?.title.de).toBe("Marktkundschafter");
    expect(scout?.title.es).toBe("Cazador de Mercado");

    expect(restorer?.perks.tr).toHaveLength(3);
    expect(negotiator?.perks.en).toHaveLength(3);
  });

  it("handles null or undefined specialization gracefully", () => {
    expect(getSpecialization(undefined)).toBeNull();
    expect(getSpecialization(null)).toBeNull();
  });
});
