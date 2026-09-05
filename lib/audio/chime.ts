/**
 * @file chime.ts
 * @description Pure Web Audio harmonic synthesis for Nota's startup brand sonic identity.
 * Generates three lush, glassy notes of acoustic bliss with subtle warm shimmer.
 */

import { AudioContextManager } from './context';

/**
 * Plays the signature 3-note bliss chime (D5 -> A5 -> D6 harmonic resolution).
 * Uses dual sine/triangle harmonics with soft exponential envelope decay.
 */
export async function playBrandChime(): Promise<void> {
  const ctxManager = AudioContextManager.getInstance();
  const ctx = await ctxManager.ensureContext();
  const destination = ctxManager.getMasterInputNode();

  // Frequencies in D Major / D Lydian sparkling triad:
  // Note 1: D5 (587.33 Hz)
  // Note 2: A5 (880.00 Hz)
  // Note 3: D6 (1174.66 Hz)
  const notes = [
    { freq: 587.33, startOffset: 0.0, duration: 1.6, gain: 0.28 },
    { freq: 880.0, startOffset: 0.16, duration: 1.8, gain: 0.32 },
    { freq: 1174.66, startOffset: 0.34, duration: 2.2, gain: 0.38 },
  ];

  const now = ctx.currentTime;

  notes.forEach(({ freq, startOffset, duration, gain: targetGain }) => {
    const startTime = now + startOffset;
    const stopTime = startTime + duration;

    // Harmonic 1: Pure fundamental sine
    const oscFundamental = ctx.createOscillator();
    oscFundamental.type = 'sine';
    oscFundamental.frequency.setValueAtTime(freq, startTime);

    // Harmonic 2: Subtle warm octave triangle
    const oscWarmth = ctx.createOscillator();
    oscWarmth.type = 'triangle';
    oscWarmth.frequency.setValueAtTime(freq * 0.5, startTime);

    // Soft low-pass filter to give glass-like smoothness
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, startTime);
    filter.frequency.exponentialRampToValueAtTime(800, stopTime);

    // Amplitude envelope: soft attack, singing sustain, gentle decay
    const ampGain = ctx.createGain();
    ampGain.gain.setValueAtTime(0.0001, startTime);
    ampGain.gain.linearRampToValueAtTime(targetGain, startTime + 0.04);
    ampGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    const warmthGain = ctx.createGain();
    warmthGain.gain.setValueAtTime(targetGain * 0.25, startTime);

    oscFundamental.connect(filter);
    oscWarmth.connect(warmthGain);
    warmthGain.connect(filter);

    filter.connect(ampGain);
    ampGain.connect(destination);

    oscFundamental.start(startTime);
    oscFundamental.stop(stopTime);
    oscWarmth.start(startTime);
    oscWarmth.stop(stopTime);

    oscFundamental.onended = () => {
      try {
        oscFundamental.disconnect();
        oscWarmth.disconnect();
        filter.disconnect();
        ampGain.disconnect();
        warmthGain.disconnect();
      } catch {
        // Disconnected
      }
    };
  });
}
