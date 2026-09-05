/**
 * @file drums.ts
 * @description Pure Web Audio synthesis engine for 4-voice electronic drum machines.
 * Generates punchy kicks, crisp snares, metallic hi-hats, and rhythmic claps with zero sample latency.
 */

import { AudioContextManager } from './context';
import type { DrumVoiceType } from './types';

export class DrumSynth {
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Noise buffer created on first trigger
  }

  /**
   * Triggers a specific drum instrument voice at scheduled audio time.
   */
  public trigger(voice: DrumVoiceType, time: number, velocity: number = 0.8): void {
    switch (voice) {
      case 'kick':
        this.triggerKick(time, velocity);
        break;
      case 'snare':
        this.triggerSnare(time, velocity);
        break;
      case 'hihat':
        this.triggerHiHat(time, velocity);
        break;
      case 'clap':
        this.triggerClap(time, velocity);
        break;
    }
  }

  /**
   * Synthesizes an 808/909-style punchy Kick drum.
   * Recipe: High-frequency transient click + rapid exponential sine pitch-drop into sub-bass.
   */
  public triggerKick(time: number, velocity: number = 0.8): void {
    const ctxManager = AudioContextManager.getInstance();
    const destination = ctxManager.getMasterInputNode();
    const ctx = destination.context as AudioContext;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    // Pitch envelope: drops rapidly from 160Hz to 42Hz
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

    // Amplitude envelope: instant attack, punchy decay
    const peakVolume = 0.9 * velocity;
    gain.gain.setValueAtTime(peakVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.36);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Synthesizes a snappy electronic Snare drum.
   * Recipe: Low-mid body sine tone + white noise burst shaped with a bandpass filter.
   */
  public triggerSnare(time: number, velocity: number = 0.8): void {
    const ctxManager = AudioContextManager.getInstance();
    const destination = ctxManager.getMasterInputNode();
    const ctx = destination.context as AudioContext;

    // 1. Tonal body
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(185, time);
    bodyOsc.frequency.exponentialRampToValueAtTime(80, time + 0.1);

    bodyGain.gain.setValueAtTime(0.5 * velocity, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(destination);
    bodyOsc.start(time);
    bodyOsc.stop(time + 0.16);

    // 2. Snappy noise rattle
    const noise = this.createNoiseNode(ctx);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1200, time);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7 * velocity, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(destination);

    noise.start(time);
    noise.stop(time + 0.23);

    noise.onended = () => {
      bodyOsc.disconnect();
      bodyGain.disconnect();
      noise.disconnect();
      noiseFilter.disconnect();
      noiseGain.disconnect();
    };
  }

  /**
   * Synthesizes a crisp Hi-Hat.
   * Recipe: White noise through a resonant high-pass filter with tight exponential decay.
   */
  public triggerHiHat(time: number, velocity: number = 0.8, isOpen: boolean = false): void {
    const ctxManager = AudioContextManager.getInstance();
    const destination = ctxManager.getMasterInputNode();
    const ctx = destination.context as AudioContext;

    const noise = this.createNoiseNode(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);
    filter.Q.setValueAtTime(2.0, time);

    const decayDuration = isOpen ? 0.28 : 0.055;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decayDuration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(time);
    noise.stop(time + decayDuration + 0.01);

    noise.onended = () => {
      noise.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Synthesizes an electronic hand Clap.
   * Recipe: 3 fast micro-transient noise bursts spaced 12ms apart, followed by an exponential tail.
   */
  public triggerClap(time: number, velocity: number = 0.8): void {
    const ctxManager = AudioContextManager.getInstance();
    const destination = ctxManager.getMasterInputNode();
    const ctx = destination.context as AudioContext;

    const noise = this.createNoiseNode(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, time);
    filter.Q.setValueAtTime(1.8, time);

    const gain = ctx.createGain();
    const v = 0.6 * velocity;

    // Pulse 1
    gain.gain.setValueAtTime(v * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.01);
    // Pulse 2
    gain.gain.setValueAtTime(v * 0.85, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.022);
    // Pulse 3 + Long Tail
    gain.gain.setValueAtTime(v, time + 0.024);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(time);
    noise.stop(time + 0.28);

    noise.onended = () => {
      noise.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Generates a reusable 1-second stereo white noise buffer.
   */
  private createNoiseNode(ctx: AudioContext): AudioBufferSourceNode {
    if (!this.noiseBuffer) {
      const bufferSize = ctx.sampleRate * 2;
      this.noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    const node = ctx.createBufferSource();
    node.buffer = this.noiseBuffer;
    node.loop = true;
    return node;
  }
}
