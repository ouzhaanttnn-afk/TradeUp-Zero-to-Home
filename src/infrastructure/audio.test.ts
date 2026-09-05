import { describe, expect, it, vi } from "vitest";
import { playFeedbackSound, type TonePlayer } from "./audio";

describe("semantic audio feedback", () => {
  it("does not request a tone while sound is off", async () => {
    const player = vi.fn<TonePlayer>(() => Promise.resolve());

    await playFeedbackSound("PURCHASE", "OFF", player);

    expect(player).not.toHaveBeenCalled();
  });

  it("maps a profitable sale to a restrained two-tone success pattern", async () => {
    const player = vi.fn<TonePlayer>(() => Promise.resolve());

    await playFeedbackSound("SALE_PROFIT", "LOW", player);

    expect(player).toHaveBeenCalledTimes(2);
    expect(player.mock.calls.map(([tone]) => tone.frequencyHz)).toEqual([
      520, 660,
    ]);
    expect(player.mock.calls.every(([, gain]) => gain === 0.025)).toBe(true);
  });

  it("swallows unavailable audio output without rejecting gameplay", async () => {
    const player = vi.fn<TonePlayer>(() =>
      Promise.reject(new Error("audio unavailable")),
    );

    await expect(
      playFeedbackSound("WARNING", "NORMAL", player),
    ).resolves.toBeUndefined();
  });
});
