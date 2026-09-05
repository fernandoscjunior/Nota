/**
 * @file engine.ts
 * @description Master Audio Engine coordinator for Nota.
 * Orchestrates AudioContext lifecycle, lookahead sequencer, polyphonic synthesizers (Lead, Bass, Chords),
 * synthesized drum racks, and persistent project storage into a clean, reactive API.
 */

import { AudioContextManager } from './context';
import { AudioScheduler } from './scheduler';
import { SubtractiveSynth, DEFAULT_SYNTH_PATCHES } from './synth';
import { DrumSynth } from './drums';
import {
  saveProjectToStorage,
  loadProjectFromStorage,
  clearProjectStorage,
  PROJECT_STORAGE_VERSION,
} from '@/lib/storage/projectStorage';
import {
  Track,
  DrumVoiceType,
  SynthPatch,
  TransportState,
  ScheduledNote,
  ProjectData,
} from './types';
import { INSTRUMENT_PRESETS, getPresetById, type InstrumentPreset } from './presets';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private ctxManager: AudioContextManager;
  private scheduler: AudioScheduler;
  private leadSynth: SubtractiveSynth;
  private bassSynth: SubtractiveSynth;
  private chordSynth: SubtractiveSynth;
  private drumSynth: DrumSynth;
  private synthMap: Map<string, SubtractiveSynth> = new Map();

  private tracks: Track[] = [];
  private undoStack: ProjectData[] = [];
  private redoStack: ProjectData[] = [];
  private readonly maxUndoSteps: number = 30;
  private autoSaveEnabled: boolean = true;

  private onStepChangeCallbacks: Set<(step: number) => void> = new Set();
  private onStateChangeCallbacks: Set<(isPlaying: boolean) => void> = new Set();
  private onProjectChangeCallbacks: Set<() => void> = new Set();

  private constructor() {
    this.ctxManager = AudioContextManager.getInstance();
    this.scheduler = new AudioScheduler();
    this.leadSynth = new SubtractiveSynth(DEFAULT_SYNTH_PATCHES.warmLead);
    this.bassSynth = new SubtractiveSynth(DEFAULT_SYNTH_PATCHES.deepBass);
    this.chordSynth = new SubtractiveSynth(DEFAULT_SYNTH_PATCHES.dreamPad);
    this.drumSynth = new DrumSynth();

    // Check user preference for auto-saving
    if (typeof window !== 'undefined') {
      const savedAutoSave = localStorage.getItem('nota_autosave');
      if (savedAutoSave !== null) {
        this.autoSaveEnabled = savedAutoSave === 'true';
      }
    }

    // Try loading saved project from localStorage first, or fall back to defaults
    const saved = loadProjectFromStorage();
    if (saved) {
      this.loadProjectData(saved, false, false);
    } else {
      this.initDefaultProject();
    }

    this.setupSchedulerCallbacks();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes the default starter pattern so the user hears an inspiring,
   * minimalist groove on first play.
   */
  private initDefaultProject(): void {
    // 16-step default patterns
    const defaultKick =  [true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false];
    const defaultSnare = [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false];
    const defaultHiHat = [true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false];
    const defaultClap =  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true,  false];

    this.tracks = [
      {
        id: 'track-drums',
        name: 'Synthesized Drums',
        kind: 'drums',
        category: 'drums',
        iconName: 'Drum',
        muted: false,
        soloed: false,
        volume: 0.85,
        pan: 0,
        notes: [],
        drumSteps: {
          kick: defaultKick,
          snare: defaultSnare,
          hihat: defaultHiHat,
          clap: defaultClap,
        },
      },
      {
        id: 'track-lead',
        name: 'Lead Melody',
        kind: 'synth',
        category: 'lead',
        iconName: 'Activity',
        muted: false,
        soloed: false,
        volume: 0.75,
        pan: 0,
        // Melodic motif in D Minor: D4 (62), F4 (65), A4 (69), C5 (72)
        notes: [
          { id: 'n1', midi: 62, velocity: 0.8, step: 0, durationSteps: 2 },
          { id: 'n2', midi: 65, velocity: 0.8, step: 4, durationSteps: 2 },
          { id: 'n3', midi: 69, velocity: 0.9, step: 8, durationSteps: 3 },
          { id: 'n4', midi: 72, velocity: 0.8, step: 12, durationSteps: 2 },
        ],
        synthPatch: DEFAULT_SYNTH_PATCHES.warmLead,
      },
      {
        id: 'track-bass',
        name: 'Sub Bass',
        kind: 'synth',
        category: 'bass',
        iconName: 'Waves',
        muted: false,
        soloed: false,
        volume: 0.8,
        pan: 0,
        // Root bass notes in D Minor: D2 (38), D2 (38), F2 (41), Bb2 (46)
        notes: [
          { id: 'b1', midi: 38, velocity: 0.9, step: 0, durationSteps: 3 },
          { id: 'b2', midi: 38, velocity: 0.8, step: 6, durationSteps: 2 },
          { id: 'b3', midi: 41, velocity: 0.85, step: 8, durationSteps: 3 },
          { id: 'b4', midi: 46, velocity: 0.9, step: 12, durationSteps: 3 },
        ],
        synthPatch: DEFAULT_SYNTH_PATCHES.deepBass,
      },
      {
        id: 'track-chords',
        name: 'Lush Chords',
        kind: 'synth',
        category: 'chords',
        iconName: 'Layers',
        muted: false,
        soloed: false,
        volume: 0.65,
        pan: 0,
        // Chords in D Minor (Dm -> Bb -> F -> C)
        notes: [
          // Step 0: Dm (D3: 50, F3: 53, A3: 57)
          { id: 'c1', midi: 50, velocity: 0.7, step: 0, durationSteps: 4 },
          { id: 'c2', midi: 53, velocity: 0.7, step: 0, durationSteps: 4 },
          { id: 'c3', midi: 57, velocity: 0.7, step: 0, durationSteps: 4 },
          // Step 4: Bb Major (Bb2: 46, D3: 50, F3: 53)
          { id: 'c4', midi: 46, velocity: 0.7, step: 4, durationSteps: 4 },
          { id: 'c5', midi: 50, velocity: 0.7, step: 4, durationSteps: 4 },
          { id: 'c6', midi: 53, velocity: 0.7, step: 4, durationSteps: 4 },
          // Step 8: F Major (F3: 53, A3: 57, C4: 60)
          { id: 'c7', midi: 53, velocity: 0.7, step: 8, durationSteps: 4 },
          { id: 'c8', midi: 57, velocity: 0.7, step: 8, durationSteps: 4 },
          { id: 'c9', midi: 60, velocity: 0.7, step: 8, durationSteps: 4 },
          // Step 12: C Major (C3: 48, E3: 52, G3: 55)
          { id: 'c10', midi: 48, velocity: 0.7, step: 12, durationSteps: 4 },
          { id: 'c11', midi: 52, velocity: 0.7, step: 12, durationSteps: 4 },
          { id: 'c12', midi: 55, velocity: 0.7, step: 12, durationSteps: 4 },
        ],
        synthPatch: DEFAULT_SYNTH_PATCHES.dreamPad,
      },
    ];
  }

  private getSynthForTrack(track: Track): SubtractiveSynth {
    if (track.id === 'track-bass') return this.bassSynth;
    if (track.id === 'track-chords') return this.chordSynth;
    if (track.id === 'track-lead') return this.leadSynth;

    let synth = this.synthMap.get(track.id);
    if (!synth) {
      synth = new SubtractiveSynth(track.synthPatch || DEFAULT_SYNTH_PATCHES.warmLead);
      this.synthMap.set(track.id, synth);
    } else if (track.synthPatch && synth.getPatch() !== track.synthPatch) {
      synth.setPatch(track.synthPatch);
    }
    return synth;
  }

  /**
   * Binds the lookahead scheduler tick to the audio instruments.
   */
  private setupSchedulerCallbacks(): void {
    this.scheduler.setCallbacks(
      (step: number, audioTime: number) => {
        this.renderStep(step, audioTime);
      },
      (step: number) => {
        this.onStepChangeCallbacks.forEach((cb) => cb(step));
      }
    );
  }

  /**
   * Dispatches sound triggers for all active tracks on the given step.
   */
  private renderStep(step: number, audioTime: number): void {
    const stepDuration = 60 / this.scheduler.getBpm() / 4;

    for (const track of this.tracks) {
      if (track.muted) continue;

      if (track.kind === 'drums' && track.drumSteps) {
        (Object.keys(track.drumSteps) as DrumVoiceType[]).forEach((voice) => {
          if (track.drumSteps?.[voice]?.[step]) {
            this.drumSynth.trigger(voice, audioTime, track.volume);
          }
        });
      } else if (track.kind === 'synth') {
        const synthEngine = this.getSynthForTrack(track);

        const noteEvents = track.notes.filter((n) => n.step === step);
        for (const note of noteEvents) {
          const durationSec = note.durationSteps * stepDuration;
          synthEngine.triggerNote(note.midi, audioTime, durationSec, note.velocity * track.volume);
        }
      }
    }
  }

  // --- Public Control APIs ---

  public async start(): Promise<void> {
    await this.scheduler.start();
    this.onStateChangeCallbacks.forEach((cb) => cb(true));
  }

  public stop(): void {
    this.scheduler.stop();
    this.onStateChangeCallbacks.forEach((cb) => cb(false));
  }

  public async togglePlay(): Promise<boolean> {
    const isPlaying = await this.scheduler.toggle();
    this.onStateChangeCallbacks.forEach((cb) => cb(isPlaying));
    return isPlaying;
  }

  public getBpm(): number {
    return this.scheduler.getBpm();
  }

  public setSwing(swing: number): void {
    this.scheduler.setSwing(swing);
    this.autoSave();
  }

  public getTransportState(): TransportState {
    return this.scheduler.getTransportState();
  }

  public getTracks(): readonly Track[] {
    return this.tracks;
  }

  /**
   * Pushes the current project state onto the undo stack before a destructive change.
   */
  /**
   * Helper to deeply clone a ProjectData snapshot for history stacks.
   */
  private cloneProjectSnapshot(data: ProjectData): ProjectData {
    return {
      ...data,
      tracks: data.tracks.map((t) => ({
        ...t,
        drumSteps: t.drumSteps ? { ...t.drumSteps } : undefined,
        notes: [...t.notes],
      })),
    };
  }

  /**
   * Pushes the current project state onto the undo stack before a destructive change.
   * Clears redo history because a new branch of edits has been initiated.
   */
  public pushUndoSnapshot(): void {
    const snapshot = this.cloneProjectSnapshot(this.exportProjectData());
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    // Any new edit invalidates the forward redo timeline
    this.redoStack = [];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public undo(): boolean {
    const previous = this.undoStack.pop();
    if (!previous) return false;

    // Save current state onto redo stack before restoring previous
    const current = this.cloneProjectSnapshot(this.exportProjectData());
    this.redoStack.push(current);
    if (this.redoStack.length > this.maxUndoSteps) {
      this.redoStack.shift();
    }

    this.loadProjectData(previous, true, false);
    return true;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public redo(): boolean {
    const next = this.redoStack.pop();
    if (!next) return false;

    // Save current state onto undo stack before moving forward
    const current = this.cloneProjectSnapshot(this.exportProjectData());
    this.undoStack.push(current);
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }

    this.loadProjectData(next, true, false);
    return true;
  }

  public isAutoSaveEnabled(): boolean {
    return this.autoSaveEnabled;
  }

  public setAutoSaveEnabled(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nota_autosave', enabled ? 'true' : 'false');
    }
    if (enabled) {
      this.autoSave();
    }
    this.notifyProjectChange();
  }

  public manualSave(): void {
    saveProjectToStorage(this.exportProjectData());
    this.notifyProjectChange();
  }

  public setBpm(newBpm: number, snapshot: boolean = true): void {
    if (snapshot) {
      this.pushUndoSnapshot();
    }
    this.scheduler.setBpm(newBpm);
    this.autoSave();
    this.notifyProjectChange();
  }

  public getTrack(trackId: string): Track | undefined {
    return this.tracks.find((t) => t.id === trackId);
  }

  /**
   * Toggles a drum step trigger on or off.
   */
  public toggleDrumStep(voice: DrumVoiceType, step: number): boolean {
    this.pushUndoSnapshot();
    const drumTrack = this.tracks.find((t) => t.id === 'track-drums');
    if (!drumTrack || !drumTrack.drumSteps) return false;

    const currentSteps = [...drumTrack.drumSteps[voice]];
    const newState = !currentSteps[step];
    currentSteps[step] = newState;

    const updatedSteps = {
      ...drumTrack.drumSteps,
      [voice]: currentSteps,
    };

    const trackIndex = this.tracks.findIndex((t) => t.id === 'track-drums');
    this.tracks[trackIndex] = {
      ...drumTrack,
      drumSteps: updatedSteps,
    };

    this.autoSave();
    this.notifyProjectChange();
    return newState;
  }

  /**
   * Toggles a musical note on or off for a synthesizer track (melody, bass, or chords).
   *
   * @param trackId - 'track-lead' | 'track-bass' | 'track-chords'
   * @param midi - MIDI pitch number [0-127]
   * @param step - Step index [0-15]
   * @param durationSteps - Note duration in steps
   * @returns boolean true if note was added, false if removed
   */
  public toggleSynthNote(
    trackId: string,
    midi: number,
    step: number,
    durationSteps: number = 2
  ): boolean {
    this.pushUndoSnapshot();
    const trackIndex = this.tracks.findIndex((t) => t.id === trackId);
    if (trackIndex === -1) return false;

    const track = this.tracks[trackIndex];
    const existingIndex = track.notes.findIndex((n) => n.step === step && n.midi === midi);

    let updatedNotes: ScheduledNote[];
    let added = false;

    if (existingIndex >= 0) {
      // Remove existing note
      updatedNotes = track.notes.filter((_, idx) => idx !== existingIndex);
      added = false;
    } else {
      // Add new note
      const newNote: ScheduledNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        midi,
        step,
        durationSteps,
        velocity: 0.8,
      };
      updatedNotes = [...track.notes, newNote];
      added = true;
    }

    this.tracks[trackIndex] = {
      ...track,
      notes: updatedNotes,
    };

    this.autoSave();
    this.notifyProjectChange();
    return added;
  }

  /**
   * Clears all notes from a specific track.
   */
  public clearTrackNotes(trackId: string): void {
    this.pushUndoSnapshot();
    const trackIndex = this.tracks.findIndex((t) => t.id === trackId);
    if (trackIndex === -1) return;

    const track = this.tracks[trackIndex];
    this.tracks[trackIndex] = {
      ...track,
      notes: [],
    };

    this.autoSave();
    this.notifyProjectChange();
  }

  /**
   * Toggles mute state on a track.
   */
  public toggleTrackMute(trackId: string): boolean {
    const trackIndex = this.tracks.findIndex((t) => t.id === trackId);
    if (trackIndex === -1) return false;

    const track = this.tracks[trackIndex];
    const newMuted = !track.muted;
    this.tracks[trackIndex] = {
      ...track,
      muted: newMuted,
    };

    this.autoSave();
    this.notifyProjectChange();
    return newMuted;
  }

  /**
   * Sets the output volume gain for a specific track [0.0 to 1.0].
   */
  public setTrackVolume(trackId: string, volume: number): void {
    const trackIndex = this.tracks.findIndex((t) => t.id === trackId);
    if (trackIndex === -1) return;

    const clamped = Math.max(0, Math.min(1, volume));
    this.tracks[trackIndex] = {
      ...this.tracks[trackIndex],
      volume: clamped,
    };

    this.autoSave();
    this.notifyProjectChange();
  }

  /**
   * Adds a new instrument track from a catalogue preset.
   */
  public addTrack(presetId: string, customName?: string): Track {
    this.pushUndoSnapshot();

    const preset = getPresetById(presetId) || INSTRUMENT_PRESETS[0];
    const newTrackId = `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    let newTrack: Track;
    if (preset.kind === 'drums') {
      const emptySteps: readonly boolean[] = Array(16).fill(false);
      newTrack = {
        id: newTrackId,
        name: customName || preset.name,
        kind: 'drums',
        category: preset.category,
        iconName: preset.iconName,
        muted: false,
        soloed: false,
        volume: 0.8,
        pan: 0,
        notes: [],
        drumSteps: {
          kick: [...emptySteps],
          snare: [...emptySteps],
          hihat: [...emptySteps],
          clap: [...emptySteps],
        },
      };
    } else {
      newTrack = {
        id: newTrackId,
        name: customName || preset.name,
        kind: 'synth',
        category: preset.category,
        iconName: preset.iconName,
        muted: false,
        soloed: false,
        volume: 0.75,
        pan: 0,
        notes: [],
        synthPatch: preset.patch || DEFAULT_SYNTH_PATCHES.warmLead,
      };
      this.synthMap.set(newTrackId, new SubtractiveSynth(newTrack.synthPatch));
    }

    this.tracks = [...this.tracks, newTrack];
    this.autoSave();
    this.notifyProjectChange();
    return newTrack;
  }

  /**
   * Removes an instrument track from the project.
   * Safety guard: prevents deleting the last remaining track.
   */
  public removeTrack(trackId: string): boolean {
    if (this.tracks.length <= 1) {
      return false;
    }
    const exists = this.tracks.some((t) => t.id === trackId);
    if (!exists) return false;

    this.pushUndoSnapshot();
    this.tracks = this.tracks.filter((t) => t.id !== trackId);
    this.synthMap.delete(trackId);
    this.autoSave();
    this.notifyProjectChange();
    return true;
  }

  /**
   * Plays a single-shot audition note for a preset in the instrument browser.
   */
  public async previewPreset(preset: InstrumentPreset): Promise<void> {
    const ctx = await this.ctxManager.ensureContext();
    const now = ctx.currentTime;

    if (preset.kind === 'drums') {
      if (preset.id === 'drums-lofi') {
        this.drumSynth.trigger('snare', now, 0.85);
      } else {
        this.drumSynth.trigger('kick', now, 0.9);
      }
    } else {
      const previewSynth = new SubtractiveSynth(preset.patch || DEFAULT_SYNTH_PATCHES.warmLead);
      previewSynth.triggerNote(preset.defaultMidiNote, now, 0.45, 0.8);
    }
  }

  /**
   * Immediately plays an audition note on a synthesizer voice.
   */
  public async playAuditionSynth(
    synthType: 'lead' | 'bass' | 'chord',
    midi: number
  ): Promise<void> {
    const ctx = await this.ctxManager.ensureContext();
    const engine =
      synthType === 'bass'
        ? this.bassSynth
        : synthType === 'chord'
        ? this.chordSynth
        : this.leadSynth;

    const duration = synthType === 'bass' ? 0.35 : synthType === 'chord' ? 0.8 : 0.4;
    engine.triggerNote(midi, ctx.currentTime, duration, 0.8);
  }

  /**
   * Immediately auditions a drum hit.
   */
  public async playAuditionDrum(voice: DrumVoiceType): Promise<void> {
    const ctx = await this.ctxManager.ensureContext();
    this.drumSynth.trigger(voice, ctx.currentTime, 0.9);
  }

  // --- Patch Management ---

  public updateLeadPatch(patch: Partial<SynthPatch>): void {
    this.leadSynth.setPatch({ ...this.leadSynth.getPatch(), ...patch });
    this.autoSave();
  }

  public getLeadPatch(): SynthPatch {
    return this.leadSynth.getPatch();
  }

  public updateBassPatch(patch: Partial<SynthPatch>): void {
    this.bassSynth.setPatch({ ...this.bassSynth.getPatch(), ...patch });
    this.autoSave();
  }

  public getBassPatch(): SynthPatch {
    return this.bassSynth.getPatch();
  }

  public updateChordPatch(patch: Partial<SynthPatch>): void {
    this.chordSynth.setPatch({ ...this.chordSynth.getPatch(), ...patch });
    this.autoSave();
  }

  public getChordPatch(): SynthPatch {
    return this.chordSynth.getPatch();
  }

  // --- Project Persistence & Serialization ---

  public exportProjectData(): ProjectData {
    return {
      version: PROJECT_STORAGE_VERSION,
      bpm: this.scheduler.getBpm(),
      swing: this.scheduler.getTransportState().swing,
      tracks: this.tracks,
      leadPatch: this.leadSynth.getPatch(),
      bassPatch: this.bassSynth.getPatch(),
      chordPatch: this.chordSynth.getPatch(),
    };
  }

  public loadProjectData(
    data: ProjectData,
    persist: boolean = true,
    pushHistory: boolean = false
  ): void {
    if (pushHistory) {
      this.pushUndoSnapshot();
    }
    this.scheduler.setBpm(data.bpm);
    this.scheduler.setSwing(data.swing);
    this.tracks = data.tracks.map((t) => ({
      ...t,
      drumSteps: t.drumSteps ? { ...t.drumSteps } : undefined,
      notes: [...t.notes],
    }));
    this.leadSynth.setPatch(data.leadPatch);
    this.bassSynth.setPatch(data.bassPatch);
    this.chordSynth.setPatch(data.chordPatch);

    if (persist) {
      this.autoSave();
    }
    this.notifyProjectChange();
  }

  public resetToDefaults(): void {
    this.pushUndoSnapshot();
    clearProjectStorage();
    this.initDefaultProject();
    this.scheduler.setBpm(120);
    this.scheduler.setSwing(0);
    this.leadSynth.setPatch(DEFAULT_SYNTH_PATCHES.warmLead);
    this.bassSynth.setPatch(DEFAULT_SYNTH_PATCHES.deepBass);
    this.chordSynth.setPatch(DEFAULT_SYNTH_PATCHES.dreamPad);
    this.autoSave();
    this.notifyProjectChange();
  }

  private autoSave(): void {
    if (this.autoSaveEnabled) {
      saveProjectToStorage(this.exportProjectData());
    }
  }

  private notifyProjectChange(): void {
    this.onProjectChangeCallbacks.forEach((cb) => cb());
  }

  public subscribeProjectChange(callback: () => void): () => void {
    this.onProjectChangeCallbacks.add(callback);
    return () => this.onProjectChangeCallbacks.delete(callback);
  }

  public subscribeStep(callback: (step: number) => void): () => void {
    this.onStepChangeCallbacks.add(callback);
    return () => this.onStepChangeCallbacks.delete(callback);
  }

  public subscribeState(callback: (isPlaying: boolean) => void): () => void {
    this.onStateChangeCallbacks.add(callback);
    return () => this.onStateChangeCallbacks.delete(callback);
  }

  public getContextManager(): AudioContextManager {
    return this.ctxManager;
  }
}
