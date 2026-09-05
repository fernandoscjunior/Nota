/**
 * @file types.ts
 * @description Core TypeScript contracts, interfaces, and domain types for the Nota audio engine.
 * Designed with strict type safety, discriminated unions, and comprehensive TSDoc.
 */

/**
 * Standard oscillator waveforms supported by the Web Audio API and custom synthesizers.
 */
export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

/**
 * Standard filter types for tone shaping and sound design.
 */
export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';

/**
 * Envelope definition following the classic Attack, Decay, Sustain, Release paradigm.
 * All time values are expressed in seconds. Sustain is a normalized amplitude level [0, 1].
 */
export interface ADSREnvelope {
  /** Attack time in seconds (time to reach peak amplitude). */
  readonly attack: number;
  /** Decay time in seconds (time to drop from peak to sustain level). */
  readonly decay: number;
  /** Sustain level normalized between 0.0 (silent) and 1.0 (full volume). */
  readonly sustain: number;
  /** Release time in seconds (time to fade out after key release). */
  readonly release: number;
}

/**
 * Configuration options for a single oscillator in a synthesizer voice.
 */
export interface OscillatorConfig {
  /** Waveform shape. */
  readonly type: WaveformType;
  /** Pitch detune in cents (-1200 to +1200, where 100 cents = 1 semitone). */
  readonly detune: number;
  /** Octave transposition offset (-2 to +2). */
  readonly octaveOffset: number;
  /** Gain/mix level of this oscillator relative to others [0, 1]. */
  readonly gain: number;
}

/**
 * Complete patch/preset configuration for the Subtractive Synthesizer.
 */
export interface SynthPatch {
  /** Primary oscillator settings. */
  readonly osc1: OscillatorConfig;
  /** Secondary oscillator settings for thickness, harmony, or detuned chorus. */
  readonly osc2: OscillatorConfig;
  /** Filter parameters for sculpting frequency spectrum. */
  readonly filter: {
    readonly type: FilterType;
    /** Cutoff frequency in Hertz (20Hz to 20,000Hz). */
    readonly cutoff: number;
    /** Filter resonance (Q factor). Values > 1 produce pronounced ringing at cutoff. */
    readonly resonance: number;
    /** Amount of envelope modulation applied to cutoff (-1 to 1). */
    readonly envelopeAmount: number;
  };
  /** Amplitude ADSR envelope. */
  readonly ampEnvelope: ADSREnvelope;
  /** Filter cutoff ADSR envelope. */
  readonly filterEnvelope: ADSREnvelope;
  /** Master volume gain for the patch [0, 1]. */
  readonly masterGain: number;
}

/**
 * Available voices in the Nota synthesized drum rack.
 */
export type DrumVoiceType = 'kick' | 'snare' | 'hihat' | 'clap';

/**
 * Parameters for individual synthesized drum instruments.
 */
export interface DrumPatchMap {
  readonly kick: {
    readonly startFreq: number;
    readonly endFreq: number;
    readonly decay: number;
    readonly punch: number;
  };
  readonly snare: {
    readonly toneFreq: number;
    readonly toneDecay: number;
    readonly noiseDecay: number;
    readonly snap: number;
  };
  readonly hihat: {
    readonly closedDecay: number;
    readonly openDecay: number;
    readonly cutoffFreq: number;
  };
  readonly clap: {
    readonly decay: number;
    readonly spread: number;
  };
}

/**
 * A scheduled musical note event for synthesizer tracks.
 */
export interface ScheduledNote {
  /** Unique identifier for the note instance. */
  readonly id: string;
  /** MIDI pitch number (e.g. 60 = Middle C, C4). Range [0, 127]. */
  readonly midi: number;
  /** Note velocity [0, 1], representing intensity/loudness. */
  readonly velocity: number;
  /** Step position on the sequencer timeline (0-indexed, e.g., 0 to 15 for a 16-step bar). */
  readonly step: number;
  /** Duration of the note in musical steps (e.g. 1 = 16th note, 4 = quarter note). */
  readonly durationSteps: number;
}

/**
 * Track instrument classification via discriminated union.
 */
export type TrackKind = 'synth' | 'drums';

/**
 * Categorization for the instrument picker and channel rack.
 */
export type InstrumentCategory = 'drums' | 'lead' | 'bass' | 'chords' | 'keys' | 'acoustic';

/**
 * A track represents a single musical lane inside the sequencer and channel rack.
 */
export interface Track {
  readonly id: string;
  readonly name: string;
  readonly kind: TrackKind;
  readonly category?: InstrumentCategory;
  /** Name of the icon to render in the channel strip. */
  readonly iconName?: string;
  readonly muted: boolean;
  readonly soloed: boolean;
  readonly volume: number;
  readonly pan: number;
  /** For synth tracks: list of scheduled pitch notes. */
  readonly notes: readonly ScheduledNote[];
  /** For drum tracks: boolean step triggers mapped per drum voice [stepIndex 0..15]. */
  readonly drumSteps?: Readonly<Record<DrumVoiceType, readonly boolean[]>>;
  /** Track-specific synthesizer patch. */
  readonly synthPatch?: SynthPatch;
}

/**
 * Sequencer transport status and timing parameters.
 */
export interface TransportState {
  readonly isPlaying: boolean;
  /** Beats Per Minute tempo (range: 40 to 240). */
  readonly bpm: number;
  /** Current active 16th-note step index (0 to totalSteps - 1). */
  readonly currentStep: number;
  /** Total number of steps in the active loop pattern (e.g. 16 = 1 bar of 4/4). */
  readonly totalSteps: number;
  /** Swing/shuffle percentage [0, 100], where 0 = straight 16ths, 50 = typical swing. */
  readonly swing: number;
}

/**
 * Messages sent from the Web Worker lookahead clock to the main thread audio scheduler.
 */
export type WorkerMessage =
  | { readonly type: 'TICK' }
  | { readonly type: 'PONG'; readonly timestamp: number };

/**
 * Messages sent from the main thread audio scheduler to the Web Worker.
 */
export type HostMessage =
  | { readonly type: 'START'; readonly intervalMs: number }
  | { readonly type: 'STOP' }
  | { readonly type: 'PING' };

/**
 * Complete serializable project state for local storage, cloud backup, and sharing.
 */
export interface ProjectData {
  readonly version: number;
  readonly bpm: number;
  readonly swing: number;
  readonly tracks: readonly Track[];
  readonly leadPatch: SynthPatch;
  readonly bassPatch: SynthPatch;
  readonly chordPatch: SynthPatch;
}

