/**
 * @file synth.ts
 * @description Dual-oscillator subtractive synthesizer engine with resonant filter and ADSR envelopes.
 * Clean, polyphonic voice allocation and sample-accurate parameter automation.
 */

import { AudioContextManager } from './context';
import type { SynthPatch, OscillatorConfig } from './types';

/**
 * Converts standard MIDI note numbers (0-127) to frequency in Hertz.
 * E.g., MIDI 69 = A4 = 440 Hz, MIDI 60 = C4 = 261.63 Hz.
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Default preset patches showcasing versatile sound design capabilities.
 */
export const DEFAULT_SYNTH_PATCHES: Record<string, SynthPatch> = {
  warmLead: {
    osc1: { type: 'sawtooth', detune: -5, octaveOffset: 0, gain: 0.5 },
    osc2: { type: 'square', detune: 7, octaveOffset: 0, gain: 0.35 },
    filter: { type: 'lowpass', cutoff: 1800, resonance: 3.5, envelopeAmount: 0.4 },
    ampEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.3 },
    filterEnvelope: { attack: 0.04, decay: 0.3, sustain: 0.3, release: 0.2 },
    masterGain: 0.6,
  },
  deepBass: {
    osc1: { type: 'sawtooth', detune: 0, octaveOffset: -1, gain: 0.6 },
    osc2: { type: 'sine', detune: 0, octaveOffset: -2, gain: 0.7 },
    filter: { type: 'lowpass', cutoff: 650, resonance: 2.0, envelopeAmount: 0.6 },
    ampEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.8, release: 0.15 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.1 },
    masterGain: 0.7,
  },
  dreamPad: {
    osc1: { type: 'sawtooth', detune: -8, octaveOffset: 0, gain: 0.4 },
    osc2: { type: 'triangle', detune: 8, octaveOffset: 1, gain: 0.4 },
    filter: { type: 'lowpass', cutoff: 1200, resonance: 1.5, envelopeAmount: 0.3 },
    ampEnvelope: { attack: 0.35, decay: 0.5, sustain: 0.8, release: 0.8 },
    filterEnvelope: { attack: 0.4, decay: 0.6, sustain: 0.5, release: 0.6 },
    masterGain: 0.5,
  },
};

export class SubtractiveSynth {
  private patch: SynthPatch;

  constructor(initialPatch: SynthPatch = DEFAULT_SYNTH_PATCHES.warmLead) {
    this.patch = initialPatch;
  }

  public setPatch(newPatch: SynthPatch): void {
    this.patch = newPatch;
  }

  public getPatch(): SynthPatch {
    return this.patch;
  }

  /**
   * Triggers a synthesized note at a scheduled audio hardware time.
   *
   * @param midi - MIDI note number [0-127]
   * @param startTime - Hardware AudioContext timestamp to start the note
   * @param duration - Note duration in seconds
   * @param velocity - Note velocity/intensity [0-1]
   */
  public triggerNote(
    midi: number,
    startTime: number,
    duration: number,
    velocity: number = 0.8
  ): void {
    const ctxManager = AudioContextManager.getInstance();
    const destination = ctxManager.getMasterInputNode();
    const ctx = (destination.context as AudioContext);

    const baseFrequency = midiToFrequency(midi);
    const now = startTime;
    const safeDuration = Math.max(0.05, duration);
    const stopTime = now + safeDuration + this.patch.ampEnvelope.release;

    // 1. Voice Master Gain
    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0, now);

    // 2. Resonant Filter
    const filter = ctx.createBiquadFilter();
    filter.type = this.patch.filter.type;
    filter.Q.setValueAtTime(this.patch.filter.resonance, now);

    // Base cutoff calculation
    const baseCutoff = Math.max(20, Math.min(20000, this.patch.filter.cutoff));
    filter.frequency.setValueAtTime(baseCutoff, now);

    // Apply filter envelope modulation
    const { filterEnvelope } = this.patch;
    const modAmount = this.patch.filter.envelopeAmount * 5000;
    const peakCutoff = Math.max(20, Math.min(20000, baseCutoff + modAmount));
    const sustainCutoff = Math.max(
      20,
      Math.min(20000, baseCutoff + modAmount * filterEnvelope.sustain)
    );

    filter.frequency.setValueAtTime(baseCutoff, now);
    filter.frequency.linearRampToValueAtTime(peakCutoff, now + filterEnvelope.attack);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, sustainCutoff),
      now + filterEnvelope.attack + filterEnvelope.decay
    );
    // Release filter back to base
    filter.frequency.setValueAtTime(sustainCutoff, now + safeDuration);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, baseCutoff),
      now + safeDuration + filterEnvelope.release
    );

    // 3. Amplitude Envelope (ADSR)
    const { ampEnvelope } = this.patch;
    const targetPeakVolume = this.patch.masterGain * velocity;
    const sustainVolume = targetPeakVolume * ampEnvelope.sustain;

    // Attack
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(targetPeakVolume, now + ampEnvelope.attack);
    // Decay to Sustain
    voiceGain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, sustainVolume),
      now + ampEnvelope.attack + ampEnvelope.decay
    );
    // Sustain hold & Release
    voiceGain.gain.setValueAtTime(sustainVolume, now + safeDuration);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    // 4. Oscillators
    const osc1 = this.createOscillator(ctx, this.patch.osc1, baseFrequency, now, stopTime);
    const osc2 = this.createOscillator(ctx, this.patch.osc2, baseFrequency, now, stopTime);

    // Connect audio signal routing:
    // [Osc 1 & 2 Output] -> Filter -> Voice Gain -> Master Bus
    osc1.output.connect(filter);
    osc2.output.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(destination);

    // Clean up nodes after voice terminates to prevent memory leaks
    osc1.osc.onended = () => {
      try {
        osc1.output.disconnect();
        osc2.output.disconnect();
        filter.disconnect();
        voiceGain.disconnect();
      } catch {
        // Ignored if already disconnected
      }
    };
  }

  /**
   * Helper to construct and tune an oscillator with octave offset and detuning.
   */
  private createOscillator(
    ctx: AudioContext,
    config: OscillatorConfig,
    baseFrequency: number,
    startTime: number,
    stopTime: number
  ): { osc: OscillatorNode; output: AudioNode } {
    const osc = ctx.createOscillator();
    osc.type = config.type;

    // Frequency adjusted by octave offset: freq * 2^(octave)
    const tunedFreq = baseFrequency * Math.pow(2, config.octaveOffset);
    osc.frequency.setValueAtTime(tunedFreq, startTime);
    osc.detune.setValueAtTime(config.detune, startTime);

    if (config.gain !== 1) {
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(config.gain, startTime);
      osc.connect(oscGain);
      osc.start(startTime);
      osc.stop(stopTime);
      return { osc, output: oscGain };
    }

    osc.start(startTime);
    osc.stop(stopTime);
    return { osc, output: osc };
  }
}
