import type { AccessibilityPreferences } from "../domain/models";

export type FeedbackSound =
  "OFFER" | "PURCHASE" | "SALE_PROFIT" | "SALE_LOSS" | "WARNING";

type SoundLevel = AccessibilityPreferences["soundLevel"];
type Tone = { frequencyHz: number; durationMs: number };
export type TonePlayer = (tone: Tone, gain: number) => Promise<void>;

const patterns: Record<FeedbackSound, Tone[]> = {
  OFFER: [{ frequencyHz: 420, durationMs: 45 }],
  PURCHASE: [{ frequencyHz: 520, durationMs: 70 }],
  SALE_PROFIT: [
    { frequencyHz: 520, durationMs: 65 },
    { frequencyHz: 660, durationMs: 90 },
  ],
  SALE_LOSS: [{ frequencyHz: 240, durationMs: 110 }],
  WARNING: [{ frequencyHz: 300, durationMs: 65 }],
};

let sharedContext: AudioContext | undefined;

const webAudioTonePlayer: TonePlayer = async (tone, gain) => {
  if (typeof AudioContext === "undefined") return;
  sharedContext ??= new AudioContext();
  if (sharedContext.state === "suspended") await sharedContext.resume();

  const oscillator = sharedContext.createOscillator();
  const volume = sharedContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = tone.frequencyHz;
  volume.gain.setValueAtTime(gain, sharedContext.currentTime);
  volume.gain.exponentialRampToValueAtTime(
    0.0001,
    sharedContext.currentTime + tone.durationMs / 1_000,
  );
  oscillator.connect(volume);
  volume.connect(sharedContext.destination);
  oscillator.start();
  oscillator.stop(sharedContext.currentTime + tone.durationMs / 1_000);
  await new Promise<void>((resolve) => {
    oscillator.onended = () => {
      oscillator.disconnect();
      volume.disconnect();
      resolve();
    };
  });
};

export async function playFeedbackSound(
  sound: FeedbackSound,
  level: SoundLevel,
  tonePlayer: TonePlayer = webAudioTonePlayer,
): Promise<void> {
  if (level === "OFF") return;
  const gain = level === "LOW" ? 0.025 : 0.05;
  try {
    for (const tone of patterns[sound]) await tonePlayer(tone, gain);
  } catch {
    // Audio support and autoplay policy must never block a gameplay command.
  }
}
