import { localDb } from "../db/localDb";

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const settings = localDb.getSettings();
  if (!settings.soundEnabled) return null;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  
  return audioCtx;
};

export const playBeep = (freq = 880, duration = 0.08, type: OscillatorType = "sine") => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playBootSequence = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  
  // High click chimes
  const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  freqs.forEach((freq, idx) => {
    setTimeout(() => {
      playBeep(freq, 0.15, "triangle");
    }, idx * 180);
  });
};

export const playWarningAlarm = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, now);
  // Frequency modulation for siren sweep
  osc.frequency.linearRampToValueAtTime(440, now + 0.4);
  osc.frequency.linearRampToValueAtTime(220, now + 0.8);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(now + 0.8);
};

export const playPortalOpen = (isOrange = false) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  const startFreq = isOrange ? 300 : 600;
  const endFreq = isOrange ? 900 : 1800;

  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.3);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(now + 0.3);
};

export const playSuccess = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const freqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 arpeggio
  freqs.forEach((f, i) => {
    setTimeout(() => {
      playBeep(f, 0.25, "sine");
    }, i * 150);
  });
};

export const playErrorSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.setValueAtTime(120, ctx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};
