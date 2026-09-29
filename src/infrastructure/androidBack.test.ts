import { describe, expect, it, vi } from "vitest";
import { bindAndroidBack } from "./androidBack";

function setup(overlay: boolean, otherTab: boolean) {
  let pressBack = () => {};
  const remove = vi.fn().mockResolvedValue(undefined);
  const port = {
    addListener: vi.fn((_name, callback) => {
      pressBack = callback;
      return Promise.resolve({ remove });
    }),
    minimizeApp: vi.fn().mockResolvedValue(undefined),
  };
  const dismiss = vi.fn(() => overlay);
  const market = vi.fn(() => otherTab);
  const dispose = bindAndroidBack(port as never, dismiss, market);
  return { port, remove, dismiss, market, dispose, pressBack: () => pressBack() };
}

describe("Android back navigation", () => {
  it("dismisses the active sheet without changing tabs or closing the app", () => {
    const test = setup(true, true);
    test.pressBack();
    expect(test.dismiss).toHaveBeenCalledOnce();
    expect(test.market).not.toHaveBeenCalled();
    expect(test.port.minimizeApp).not.toHaveBeenCalled();
  });
  it("returns other tabs to the market before backgrounding", () => {
    const test = setup(false, true);
    test.pressBack();
    expect(test.market).toHaveBeenCalledOnce();
    expect(test.port.minimizeApp).not.toHaveBeenCalled();
  });
  it("backgrounds from the root and ignores callbacks after unmount", async () => {
    const test = setup(false, false);
    test.pressBack();
    expect(test.port.minimizeApp).toHaveBeenCalledOnce();
    test.dispose();
    test.pressBack();
    await Promise.resolve();
    expect(test.remove).toHaveBeenCalledOnce();
    expect(test.port.minimizeApp).toHaveBeenCalledOnce();
  });
});
