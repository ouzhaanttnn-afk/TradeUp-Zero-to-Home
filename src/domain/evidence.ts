import type { ItemInstance } from "./models";

export function confirmedEvidenceStatus(
  instance: ItemInstance,
  evidenceId: string,
) {
  const hasDefect = instance.family.defects.some(
    (definition) =>
      definition.evidenceId === evidenceId &&
      instance.defects.some(
        (defect) => defect.definitionId === definition.id && defect.present,
      ),
  );
  return hasDefect ? ("CHECKED" as const) : ("VERIFIED" as const);
}
