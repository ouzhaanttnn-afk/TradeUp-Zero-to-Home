import type { AccessibilityPreferences } from "../domain/models";

export type FeedbackSound =
  "OFFER" | "PURCHASE" | "LISTING" | "SALE_PROFIT" | "SALE_LOSS" | "WARNING";

type SoundLevel = AccessibilityPreferences["soundLevel"];
type Tone = {
  frequencyHz: number;
  durationMs: number;
  waveform?: OscillatorType;
  attackMs?: number;
};
export type TonePlayer = (tone: Tone, gain: number) => Promise<void>;

const patterns: Record<FeedbackSound, Tone[]> = {
  OFFER: [
    { frequencyHz: 392, durationMs: 42, waveform: "triangle" },
    { frequencyHz: 523, durationMs: 72, attackMs: 9 },
  ],
  PURCHASE: [
    { frequencyHz: 330, durationMs: 38, waveform: "triangle" },
    { frequencyHz: 587, durationMs: 78, attackMs: 8 },
  ],
  LISTING: [
    { frequencyHz: 360, durationMs: 38, waveform: "triangle" },
    { frequencyHz: 480, durationMs: 62, attackMs: 7 },
  ],
  SALE_PROFIT: [
    { frequencyHz: 440, durationMs: 48, waveform: "triangle" },
    { frequencyHz: 554, durationMs: 58, waveform: "triangle" },
    { frequencyHz: 659, durationMs: 92, attackMs: 8 },
  ],
  SALE_LOSS: [
    { frequencyHz: 280, durationMs: 62, waveform: "triangle" },
    { frequencyHz: 220, durationMs: 105, waveform: "triangle" },
  ],
  WARNING: [{ frequencyHz: 300, durationMs: 68, waveform: "triangle" }],
};

let sharedContext: AudioContext | undefined;

const webAudioTonePlayer: TonePlayer = async (tone, gain) => {
  if (typeof AudioContext === "undefined") return;
  sharedContext ??= new AudioContext();
  if (sharedContext.state === "suspended") await sharedContext.resume();

  const oscillator = sharedContext.createOscillator();
  const volume = sharedContext.createGain();
  oscillator.type = tone.waveform ?? "sine";
  oscillator.frequency.value = tone.frequencyHz;
  const attackSeconds = (tone.attackMs ?? 5) / 1_000;
  volume.gain.setValueAtTime(0.0001, sharedContext.currentTime);
  volume.gain.exponentialRampToValueAtTime(
    gain,
    sharedContext.currentTime + attackSeconds,
  );
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
