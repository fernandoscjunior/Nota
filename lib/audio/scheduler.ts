/**
 * @file scheduler.ts
 * @description Sample-accurate lookahead sequencer engine using a Web Worker clock.
 * Solves JavaScript timing jitter by scheduling audio events 50-100ms in advance
 * directly onto AudioContext.currentTime.
 */

import { AudioContextManager } from './context';
import type { TransportState, HostMessage, WorkerMessage } from './types';

export type StepScheduleCallback = (step: number, audioTime: number) => void;
export type StepUpdateCallback = (step: number) => void;

export class AudioScheduler {
  private worker: Worker | null = null;
  private isPlaying = false;
  private bpm = 120;
  private totalSteps = 16;
  private swing = 0; // 0 to 100

  private currentStep = 0;
  private nextStepTime = 0;
  private readonly lookaheadMs = 25;
  private readonly scheduleAheadTime = 0.1; // 100ms in seconds

  private onScheduleStep: StepScheduleCallback | null = null;
  private onStepUpdate: StepUpdateCallback | null = null;

  // Queue to synchronize visual step updates with audio playback time
  private visualQueue: Array<{ step: number; time: number }> = [];
  private animationFrameId: number | null = null;

  constructor() {
    // Worker is initialized in browser environment on start
  }

  /**
   * Registers callbacks for scheduling audio events and updating visual step indicators.
   */
  public setCallbacks(
    onScheduleStep: StepScheduleCallback,
    onStepUpdate?: StepUpdateCallback
  ): void {
    this.onScheduleStep = onScheduleStep;
    if (onStepUpdate) {
      this.onStepUpdate = onStepUpdate;
    }
  }

  /**
   * Starts the sequencer transport and spawns/activates the timing worker.
   */
  public async start(): Promise<void> {
    if (this.isPlaying) return;

    const ctx = await AudioContextManager.getInstance().ensureContext();
    this.isPlaying = true;
    this.currentStep = 0;
    this.visualQueue = [];

    // Begin scheduling immediately from the current hardware audio time + short pre-roll
    this.nextStepTime = ctx.currentTime + 0.05;

    this.initWorker();
    this.startVisualLoop();
  }

  /**
   * Stops the transport, halts the worker, and resets the step cursor.
   */
  public stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    if (this.worker) {
      const stopMsg: HostMessage = { type: 'STOP' };
      this.worker.postMessage(stopMsg);
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.currentStep = 0;
    this.visualQueue = [];
    if (this.onStepUpdate) {
      this.onStepUpdate(0);
    }
  }

  /**
   * Toggles playback state.
   */
  public async toggle(): Promise<boolean> {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      await this.start();
      return true;
    }
  }

  public setBpm(bpm: number): void {
    this.bpm = Math.max(40, Math.min(260, bpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public setSwing(swing: number): void {
    this.swing = Math.max(0, Math.min(100, swing));
  }

  public setTotalSteps(steps: number): void {
    this.totalSteps = Math.max(4, Math.min(64, steps));
  }

  public getTransportState(): TransportState {
    return {
      isPlaying: this.isPlaying,
      bpm: this.bpm,
      currentStep: this.currentStep,
      totalSteps: this.totalSteps,
      swing: this.swing,
    };
  }

  /**
   * Initializes the Web Worker if not already created.
   */
  private initWorker(): void {
    if (!this.worker && typeof window !== 'undefined') {
      this.worker = new Worker('/workers/scheduler.worker.js');
      this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.type === 'TICK') {
          this.onWorkerTick();
        }
      };
    }

    if (this.worker) {
      const startMsg: HostMessage = {
        type: 'START',
        intervalMs: this.lookaheadMs,
      };
      this.worker.postMessage(startMsg);
    }
  }

  /**
   * Handles the tick event from the background Web Worker.
   * Schedules any notes falling within the upcoming scheduleAheadTime window.
   */
  private onWorkerTick(): void {
    if (!this.isPlaying) return;

    const ctx = AudioContextManager.getInstance();
    const currentTime = ctx.getCurrentTime();

    // While there are notes that need scheduling before currentTime + scheduleAheadTime
    while (this.nextStepTime < currentTime + this.scheduleAheadTime) {
      // Calculate duration of a 16th note at the current BPM
      // 1 Beat (Quarter Note) = 60 / BPM seconds. 16th note = Quarter Note / 4.
      const sixteenthDuration = 60 / this.bpm / 4;

      // Calculate swing offset for odd 16th notes (steps 1, 3, 5, 7, etc.)
      let scheduledTime = this.nextStepTime;
      const isOddStep = this.currentStep % 2 === 1;
      if (isOddStep && this.swing > 0) {
        // Swing scales up to ~33% of a 16th note for heavy swing/triplet feel
        const maxSwingShift = sixteenthDuration * 0.33;
        scheduledTime += (this.swing / 100) * maxSwingShift;
      }

      // Schedule the step audio callback
      if (this.onScheduleStep) {
        this.onScheduleStep(this.currentStep, scheduledTime);
      }

      // Enqueue visual update for when audio hardware reaches scheduledTime
      this.visualQueue.push({
        step: this.currentStep,
        time: scheduledTime,
      });

      // Advance step time and index
      this.nextStepTime += sixteenthDuration;
      this.currentStep = (this.currentStep + 1) % this.totalSteps;
    }
  }

  /**
   * Visual requestAnimationFrame loop for animating the playhead with precision.
   */
  private startVisualLoop(): void {
    const checkVisualStep = () => {
      if (!this.isPlaying) return;

      const currentTime = AudioContextManager.getInstance().getCurrentTime();

      while (this.visualQueue.length > 0 && this.visualQueue[0].time <= currentTime) {
        const item = this.visualQueue.shift();
        if (item && this.onStepUpdate) {
          this.onStepUpdate(item.step);
        }
      }

      this.animationFrameId = requestAnimationFrame(checkVisualStep);
    };

    this.animationFrameId = requestAnimationFrame(checkVisualStep);
  }

  /**
   * Cleans up resources when unmounting or tearing down the engine.
   */
  public dispose(): void {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
