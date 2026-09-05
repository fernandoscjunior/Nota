/**
 * @file presets.ts
 * @description Curated instrument preset catalogue for Nota Studio.
 * Spans drum kits, expressive analog leads, deep sub basses, lush chord pads, and acoustic pianos/plucks.
 */

import type { InstrumentCategory, SynthPatch, TrackKind } from './types';

export interface InstrumentPreset {
  readonly id: string;
  readonly name: string;
  readonly category: InstrumentCategory;
  readonly kind: TrackKind;
  readonly description: string;
  readonly iconName: string;
  readonly defaultMidiNote: number; // Preview note (e.g. 62 = D4, 38 = D2)
  readonly patch?: SynthPatch;
}

export const INSTRUMENT_PRESETS: readonly InstrumentPreset[] = [
  // 1. DRUMS & PERCUSSION
  {
    id: 'drums-808',
    name: 'Studio 808 Machine',
    category: 'drums',
    kind: 'drums',
    description: 'Punchy analog kicks, snappy electronic snares, and crisp hi-hats.',
    iconName: 'Drum',
    defaultMidiNote: 36, // C2 kick
  },
  {
    id: 'drums-lofi',
    name: 'Lo-Fi Vintage Kit',
    category: 'drums',
    kind: 'drums',
    description: 'Warm, saturated acoustic drums with subtle tape hiss and dusty crackle.',
    iconName: 'Disc',
    defaultMidiNote: 38, // D2 snare
  },

  // 2. MELODIC LEADS
  {
    id: 'lead-analog',
    name: 'Warm Analog Lead',
    category: 'lead',
    kind: 'synth',
    description: 'Expressive dual-sawtooth lead with resonant low-pass filter decay.',
    iconName: 'Activity',
    defaultMidiNote: 62, // D4
    patch: {
      osc1: { type: 'sawtooth', detune: -6, octaveOffset: 0, gain: 0.5 },
      osc2: { type: 'square', detune: 6, octaveOffset: 0, gain: 0.35 },
      filter: { type: 'lowpass', cutoff: 1800, resonance: 3.5, envelopeAmount: 0.4 },
      ampEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.3 },
      filterEnvelope: { attack: 0.04, decay: 0.3, sustain: 0.3, release: 0.2 },
      masterGain: 0.6,
    },
  },
  {
    id: 'lead-pluck',
    name: 'Neo-Soul Pluck',
    category: 'lead',
    kind: 'synth',
    description: 'Bright, snappy attack with short decay for bouncy syncopated riffs.',
    iconName: 'Sparkles',
    defaultMidiNote: 69, // A4
    patch: {
      osc1: { type: 'triangle', detune: 0, octaveOffset: 0, gain: 0.6 },
      osc2: { type: 'sawtooth', detune: 4, octaveOffset: 1, gain: 0.3 },
      filter: { type: 'lowpass', cutoff: 2400, resonance: 4.0, envelopeAmount: 0.7 },
      ampEnvelope: { attack: 0.005, decay: 0.18, sustain: 0.1, release: 0.12 },
      filterEnvelope: { attack: 0.005, decay: 0.15, sustain: 0.05, release: 0.1 },
      masterGain: 0.65,
    },
  },
  {
    id: 'lead-cyber',
    name: '80s Cyber Lead',
    category: 'lead',
    kind: 'synth',
    description: 'Aggressive detuned pulse synth reminiscent of vintage synthwave.',
    iconName: 'Zap',
    defaultMidiNote: 65, // F4
    patch: {
      osc1: { type: 'sawtooth', detune: -12, octaveOffset: 0, gain: 0.5 },
      osc2: { type: 'sawtooth', detune: 12, octaveOffset: 0, gain: 0.5 },
      filter: { type: 'lowpass', cutoff: 3200, resonance: 2.5, envelopeAmount: 0.3 },
      ampEnvelope: { attack: 0.03, decay: 0.25, sustain: 0.8, release: 0.35 },
      filterEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.2 },
      masterGain: 0.55,
    },
  },

  // 3. BASSES
  {
    id: 'bass-sub',
    name: 'Deep Sub Bass',
    category: 'bass',
    kind: 'synth',
    description: 'Heavy 40Hz sub-oscillator for grounding chords and rhythm.',
    iconName: 'Waves',
    defaultMidiNote: 38, // D2
    patch: {
      osc1: { type: 'sine', detune: 0, octaveOffset: -1, gain: 0.8 },
      osc2: { type: 'triangle', detune: 0, octaveOffset: -2, gain: 0.5 },
      filter: { type: 'lowpass', cutoff: 450, resonance: 1.2, envelopeAmount: 0.2 },
      ampEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.15 },
      filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.1 },
      masterGain: 0.75,
    },
  },
  {
    id: 'bass-acid',
    name: 'Acid 303 Resonant',
    category: 'bass',
    kind: 'synth',
    description: 'Squelchy, resonant sawtooth bass with dynamic envelope squelch.',
    iconName: 'Flame',
    defaultMidiNote: 41, // F2
    patch: {
      osc1: { type: 'sawtooth', detune: 0, octaveOffset: -1, gain: 0.7 },
      osc2: { type: 'square', detune: 0, octaveOffset: -1, gain: 0.4 },
      filter: { type: 'lowpass', cutoff: 900, resonance: 6.5, envelopeAmount: 0.8 },
      ampEnvelope: { attack: 0.01, decay: 0.22, sustain: 0.4, release: 0.12 },
      filterEnvelope: { attack: 0.01, decay: 0.18, sustain: 0.1, release: 0.1 },
      masterGain: 0.65,
    },
  },
  {
    id: 'bass-funk',
    name: 'Funk Finger Bass',
    category: 'bass',
    kind: 'synth',
    description: 'Thumping, percussive bass with fast attack for groovy rhythmic movement.',
    iconName: 'Radio',
    defaultMidiNote: 45, // A2
    patch: {
      osc1: { type: 'triangle', detune: -2, octaveOffset: -1, gain: 0.6 },
      osc2: { type: 'square', detune: 2, octaveOffset: -2, gain: 0.5 },
      filter: { type: 'lowpass', cutoff: 800, resonance: 2.8, envelopeAmount: 0.5 },
      ampEnvelope: { attack: 0.008, decay: 0.16, sustain: 0.6, release: 0.12 },
      filterEnvelope: { attack: 0.01, decay: 0.12, sustain: 0.2, release: 0.1 },
      masterGain: 0.7,
    },
  },

  // 4. CHORDS & PADS
  {
    id: 'chords-pad',
    name: 'Dream Ambient Pad',
    category: 'chords',
    kind: 'synth',
    description: 'Lush, wide polyphonic pad with gentle swell and dreamy cinematic sustain.',
    iconName: 'Layers',
    defaultMidiNote: 50, // D3
    patch: {
      osc1: { type: 'sawtooth', detune: -8, octaveOffset: 0, gain: 0.4 },
      osc2: { type: 'triangle', detune: 8, octaveOffset: 1, gain: 0.4 },
      filter: { type: 'lowpass', cutoff: 1400, resonance: 1.6, envelopeAmount: 0.35 },
      ampEnvelope: { attack: 0.35, decay: 0.5, sustain: 0.8, release: 0.8 },
      filterEnvelope: { attack: 0.4, decay: 0.6, sustain: 0.5, release: 0.6 },
      masterGain: 0.5,
    },
  },
  {
    id: 'chords-silk',
    name: 'Silk Poly Synth',
    category: 'chords',
    kind: 'synth',
    description: 'Silky retro-futuristic chords with sparkling harmonic overtone presence.',
    iconName: 'Wind',
    defaultMidiNote: 57, // A3
    patch: {
      osc1: { type: 'sawtooth', detune: -5, octaveOffset: 0, gain: 0.45 },
      osc2: { type: 'sine', detune: 5, octaveOffset: 1, gain: 0.45 },
      filter: { type: 'lowpass', cutoff: 2200, resonance: 2.0, envelopeAmount: 0.4 },
      ampEnvelope: { attack: 0.1, decay: 0.35, sustain: 0.7, release: 0.5 },
      filterEnvelope: { attack: 0.12, decay: 0.4, sustain: 0.4, release: 0.4 },
      masterGain: 0.55,
    },
  },

  // 5. KEYS & ACOUSTIC
  {
    id: 'keys-piano',
    name: 'Concert Grand Piano',
    category: 'keys',
    kind: 'synth',
    description: 'Resonant bell-like acoustic piano emulation with authentic wooden decay.',
    iconName: 'Piano',
    defaultMidiNote: 62, // D4
    patch: {
      osc1: { type: 'triangle', detune: 0, octaveOffset: 0, gain: 0.6 },
      osc2: { type: 'sine', detune: 3, octaveOffset: 1, gain: 0.3 },
      filter: { type: 'lowpass', cutoff: 2800, resonance: 1.8, envelopeAmount: 0.6 },
      ampEnvelope: { attack: 0.01, decay: 0.8, sustain: 0.3, release: 0.4 },
      filterEnvelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.3 },
      masterGain: 0.65,
    },
  },
  {
    id: 'keys-rhodes',
    name: 'Velvet Rhodes',
    category: 'keys',
    kind: 'synth',
    description: 'Warm vintage electric piano with soft tine impact and creamy warmth.',
    iconName: 'Music',
    defaultMidiNote: 65, // F4
    patch: {
      osc1: { type: 'sine', detune: -3, octaveOffset: 0, gain: 0.6 },
      osc2: { type: 'triangle', detune: 3, octaveOffset: 0, gain: 0.4 },
      filter: { type: 'lowpass', cutoff: 1600, resonance: 1.2, envelopeAmount: 0.3 },
      ampEnvelope: { attack: 0.02, decay: 0.6, sustain: 0.4, release: 0.3 },
      filterEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 0.2 },
      masterGain: 0.6,
    },
  },
  {
    id: 'acoustic-nylon',
    name: 'Nylon String Pluck',
    category: 'acoustic',
    kind: 'synth',
    description: 'Intimate acoustic guitar pluck with quick percussive transient.',
    iconName: 'Guitar',
    defaultMidiNote: 62, // D4
    patch: {
      osc1: { type: 'triangle', detune: -4, octaveOffset: 0, gain: 0.55 },
      osc2: { type: 'sawtooth', detune: 4, octaveOffset: 1, gain: 0.3 },
      filter: { type: 'lowpass', cutoff: 2200, resonance: 2.2, envelopeAmount: 0.7 },
      ampEnvelope: { attack: 0.005, decay: 0.35, sustain: 0.15, release: 0.2 },
      filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.15 },
      masterGain: 0.65,
    },
  },
];

export function getPresetById(id: string): InstrumentPreset | undefined {
  return INSTRUMENT_PRESETS.find((p) => p.id === id);
}
