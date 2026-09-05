/**
 * @file context.ts
 * @description Singleton manager for the Web Audio API AudioContext.
 * Handles user gesture activation, safe master bus routing with peak limiting,
 * and real-time visualization analysis.
 */

export class AudioContextManager {
  private static instance: AudioContextManager | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterSaturation: WaveShaperNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;

  /** Fast cached buffer arrays for visualizer data retrieval to avoid GC pressure */
  private frequencyDataBuffer: Uint8Array<ArrayBuffer> | null = null;
  private timeDomainDataBuffer: Uint8Array<ArrayBuffer> | null = null;

  private constructor() {
    // Lazy initialization on user gesture
  }

  /**
   * Retrieves the singleton instance of the AudioContextManager.
   */
  public static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  /**
   * Initializes the AudioContext if not already initialized, or resumes it if suspended.
   * Must be called during or after a user interaction (click, keypress).
   */
  public async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtxClass) {
        throw new Error('Web Audio API is not supported in this browser.');
      }

      this.ctx = new AudioCtxClass({
        latencyHint: 'interactive',
        sampleRate: 44100,
      });

      this.setupMasterSignalChain(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Constructs the master bus with saturation, peak limiter and visualizer analyser.
   * Signal Flow: Instrument Nodes -> Master Gain -> Warmth Saturation -> Peak Limiter -> Analyser -> Speakers
   */
  private setupMasterSignalChain(ctx: AudioContext): void {
    // 1. Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, ctx.currentTime);

    // 2. Analog Tape Warmth / Soft Saturation Shaper
    this.masterSaturation = ctx.createWaveShaper();
    const curve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i * 2) / 512 - 1;
      // Gentle soft-clipping saturation (tanh)
      curve[i] = Math.tanh(1.15 * x);
    }
    this.masterSaturation.curve = curve;
    this.masterSaturation.oversample = '2x';

    // 3. Master Peak Limiter (protects ears and hardware from digital clipping)
    this.masterLimiter = ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-0.5, ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(0, ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(20, ctx.currentTime); // Hard brickwall limiting
    this.masterLimiter.attack.setValueAtTime(0.001, ctx.currentTime); // 1ms attack
    this.masterLimiter.release.setValueAtTime(0.05, ctx.currentTime); // 50ms release

    // 4. Master Analyser (for 60fps oscilloscopes and FFT frequency visualizers)
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.8;

    // Allocate typed array buffers once to prevent memory allocations in animation loops
    this.frequencyDataBuffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainDataBuffer = new Uint8Array(this.analyser.fftSize);

    // 5. Wire the chain
    this.masterGain.connect(this.masterSaturation);
    this.masterSaturation.connect(this.masterLimiter);
    this.masterLimiter.connect(this.analyser);
    this.analyser.connect(ctx.destination);
  }

  /**
   * Returns the node that instruments should connect to.
   */
  public getMasterInputNode(): AudioNode {
    if (!this.masterGain) {
      throw new Error('AudioContext has not been initialized. Call ensureContext() first.');
    }
    return this.masterGain;
  }

  /**
   * Sets the global master output volume [0.0 to 1.0].
   */
  public setMasterVolume(volume: number): void {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.015);
    }
  }

  /**
   * Returns the current hardware audio timestamp in seconds.
   */
  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /**
   * Returns the current state of the AudioContext ('running' | 'suspended' | 'closed').
   */
  public getState(): AudioContextState | 'uninitialized' {
    return this.ctx ? this.ctx.state : 'uninitialized';
  }

  /**
   * Retrieves real-time FFT frequency data for visualizers.
   * Returns a reused Uint8Array to minimize garbage collection.
   */
  public getFrequencyData(): Uint8Array<ArrayBuffer> | null {
    if (!this.analyser || !this.frequencyDataBuffer) return null;
    this.analyser.getByteFrequencyData(this.frequencyDataBuffer);
    return this.frequencyDataBuffer;
  }

  /**
   * Retrieves real-time waveform time-domain data for oscilloscopes.
   * Returns a reused Uint8Array to minimize garbage collection.
   */
  public getTimeDomainData(): Uint8Array<ArrayBuffer> | null {
    if (!this.analyser || !this.timeDomainDataBuffer) return null;
    this.analyser.getByteTimeDomainData(this.timeDomainDataBuffer);
    return this.timeDomainDataBuffer;
  }

  /**
   * Safely suspends audio processing to save battery when idle.
   */
  public async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend();
    }
  }
}
