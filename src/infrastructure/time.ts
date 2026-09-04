export interface TimeProvider {
  nowWallMs(): number;
}

export const systemTimeProvider: TimeProvider = {
  nowWallMs: () => Date.now(),
};
