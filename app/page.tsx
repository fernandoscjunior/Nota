'use client';

/**
 * @file page.tsx
 * @description The Nota Minimalist Studio Canvas.
 * Combines the Web Audio engine, Web Worker lookahead scheduler, 60fps canvas visualizer,
 * multi-track sequencing (Drums, Melody, Bass, Chords), and automatic localStorage persistence.
 */

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Check,
  Layers,
  Settings,
  Download,
  Undo2,
  Redo2,
  Plus,
} from 'lucide-react';
import { AudioEngine } from '@/lib/audio/engine';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { ExportModal } from '@/components/export/ExportModal';
import { AddInstrumentModal } from '@/components/instruments/AddInstrumentModal';
import { ChannelStrip } from '@/components/channels/ChannelStrip';
import { BrandIntro } from '@/components/intro/BrandIntro';
import { TurtleIcon, RabbitIcon } from '@/components/icons/StudioIcons';
import type { DrumVoiceType, Track } from '@/lib/audio/types';

interface ScaleDegree {
  readonly label: string;
  readonly midi: number;
  readonly role: string;
}

const MELODY_SCALE: readonly ScaleDegree[] = [
  { label: 'D5', midi: 74, role: 'Octave' },
  { label: 'C5', midi: 72, role: 'Min 7th' },
  { label: 'Bb4', midi: 70, role: 'Min 6th' },
  { label: 'A4', midi: 69, role: '5th (Dom)' },
  { label: 'G4', midi: 67, role: '4th' },
  { label: 'F4', midi: 65, role: 'Min 3rd' },
  { label: 'E4', midi: 64, role: '2nd' },
  { label: 'D4', midi: 62, role: 'Root' },
];

const BASS_SCALE: readonly ScaleDegree[] = [
  { label: 'D3', midi: 50, role: 'Octave' },
  { label: 'C3', midi: 48, role: 'Min 7th' },
  { label: 'Bb2', midi: 46, role: 'Min 6th' },
  { label: 'A2', midi: 45, role: '5th' },
  { label: 'G2', midi: 43, role: '4th' },
  { label: 'F2', midi: 41, role: 'Min 3rd' },
  { label: 'E2', midi: 40, role: '2nd' },
  { label: 'D2', midi: 38, role: 'Deep Root' },
];

interface ChordPreset {
  readonly name: string;
  readonly symbol: string;
  readonly midis: readonly number[];
  readonly description: string;
}

const CHORD_PRESETS: readonly ChordPreset[] = [
  { name: 'D Minor', symbol: 'i', midis: [50, 53, 57], description: 'Tonic minor: Dark, grounding stability' },
  { name: 'Bb Major', symbol: 'VI', midis: [46, 50, 53], description: 'Submediant: Epic, heroic lift' },
  { name: 'F Major', symbol: 'III', midis: [53, 57, 60], description: 'Relative major: Warm, nostalgic glow' },
  { name: 'C Major', symbol: 'VII', midis: [48, 52, 55], description: 'Subtonic: Uplifting forward movement' },
  { name: 'G Minor', symbol: 'iv', midis: [55, 58, 62], description: 'Subdominant: Melancholic bridge' },
  { name: 'A Minor', symbol: 'v', midis: [57, 60, 64], description: 'Minor dominant: Emotional tension' },
];

const DRUM_LABELS: Record<DrumVoiceType, string> = {
  kick: 'Kick 808',
  snare: 'Snare 909',
  hihat: 'Hi-Hat',
  clap: 'Hand Clap',
};

export default function StudioPage() {
  const engineRef = useRef<AudioEngine | null>(null);

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [introDismissed, setIntroDismissed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [filterCutoff, setFilterCutoff] = useState(1800);
  const [filterResonance, setFilterResonance] = useState(3.5);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [tracksState, setTracksState] = useState<readonly Track[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAddInstrumentOpen, setIsAddInstrumentOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('track-drums');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Computed intro visibility - zero setState in effect, 100% React 19 compliant
  const showIntro =
    isClient && !introDismissed && (typeof window !== 'undefined' && sessionStorage.getItem('nota_intro_played') !== 'true');

  const handleIntroComplete = useCallback(() => {
    setIntroDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nota_intro_played', 'true');
    }
  }, []);

  const getEngine = useCallback(() => {
    if (!engineRef.current && typeof window !== 'undefined') {
      engineRef.current = AudioEngine.getInstance();
    }
    return engineRef.current;
  }, []);

  const refreshProjectState = useCallback(() => {
    const engine = getEngine();
    if (!engine) return;
    setTracksState([...engine.getTracks()]);
    setBpm(engine.getBpm());
    const lead = engine.getLeadPatch();
    setFilterCutoff(lead.filter.cutoff);
    setFilterResonance(lead.filter.resonance);
    setCanUndo(engine.canUndo());
    setCanRedo(engine.canRedo());
    if (!engine.isAutoSaveEnabled()) {
      setSaveStatus('Auto-save off');
    }
  }, [getEngine]);

  const handleUndo = useCallback(() => {
    const engine = getEngine();
    if (!engine) return;
    const success = engine.undo();
    if (success) {
      refreshProjectState();
      setSaveStatus('Reverted');
      setTimeout(() => {
        setSaveStatus(engine.isAutoSaveEnabled() ? 'Saved' : 'Auto-save off');
      }, 1500);
    }
  }, [getEngine, refreshProjectState]);

  const handleRedo = useCallback(() => {
    const engine = getEngine();
    if (!engine) return;
    const success = engine.redo();
    if (success) {
      refreshProjectState();
      setSaveStatus('Restored');
      setTimeout(() => {
        setSaveStatus(engine.isAutoSaveEnabled() ? 'Saved' : 'Auto-save off');
      }, 1500);
    }
  }, [getEngine, refreshProjectState]);

  const togglePlayback = useCallback(async () => {
    const engine = getEngine();
    if (!engine) return;
    await engine.togglePlay();
  }, [getEngine]);

  const handleStop = useCallback(() => {
    const engine = getEngine();
    if (!engine) return;
    engine.stop();
  }, [getEngine]);

  const flashSaved = useCallback(() => {
    setSaveStatus('Auto-saved');
  }, []);

  const handleBpmDragStart = useCallback(() => {
    getEngine()?.pushUndoSnapshot();
  }, [getEngine]);

  const handleBpmChange = useCallback(
    (newBpm: number) => {
      const clamped = Math.max(50, Math.min(200, newBpm));
      setBpm(clamped);
      const engine = getEngine();
      if (engine) {
        // Update BPM without flooding intermediate undo snapshots
        engine.setBpm(clamped, false);
        flashSaved();
      }
    },
    [getEngine, flashSaved]
  );

  const handleDrumStepClick = useCallback(
    (voice: DrumVoiceType, stepIndex: number) => {
      const engine = getEngine();
      if (!engine) return;
      engine.toggleDrumStep(voice, stepIndex);
      refreshProjectState();
      flashSaved();
    },
    [getEngine, refreshProjectState, flashSaved]
  );

  const handleSynthGridClick = useCallback(
    (trackId: string, midi: number, step: number) => {
      const engine = getEngine();
      if (!engine) return;
      engine.toggleSynthNote(trackId, midi, step, 2);
      refreshProjectState();
      flashSaved();
    },
    [getEngine, refreshProjectState, flashSaved]
  );

  const handleApplyChordToStep = useCallback(
    (chord: ChordPreset, step: number) => {
      const engine = getEngine();
      if (!engine) return;

      const track = engine.getTrack(selectedTrackId) || engine.getTrack('track-chords');
      if (!track) return;

      // Check if chord notes already exist on this step
      const hasAny = track.notes.some((n) => n.step === step && chord.midis.includes(n.midi));

      if (hasAny) {
        // Toggle off all notes of this chord on this step
        chord.midis.forEach((m) => {
          engine.toggleSynthNote(track.id, m, step);
        });
      } else {
        // Add all notes of this chord with duration of 4 steps
        chord.midis.forEach((m) => {
          engine.toggleSynthNote(track.id, m, step, 4);
        });
      }
      refreshProjectState();
      flashSaved();
    },
    [getEngine, refreshProjectState, flashSaved, selectedTrackId]
  );

  const handleTrackVolumeChange = useCallback(
    (trackId: string, volume: number) => {
      const engine = getEngine();
      if (!engine) return;
      engine.setTrackVolume(trackId, volume);
      refreshProjectState();
    },
    [getEngine, refreshProjectState]
  );

  const handleRemoveTrack = useCallback(
    (trackId: string) => {
      const engine = getEngine();
      if (!engine) return;
      const success = engine.removeTrack(trackId);
      if (success) {
        refreshProjectState();
        if (selectedTrackId === trackId) {
          const remaining = engine.getTracks();
          if (remaining.length > 0) {
            setSelectedTrackId(remaining[0].id);
          }
        }
        flashSaved();
      }
    },
    [getEngine, refreshProjectState, selectedTrackId, flashSaved]
  );

  const handleAddPreset = useCallback(
    (presetId: string) => {
      const engine = getEngine();
      if (!engine) return;
      const newTrack = engine.addTrack(presetId);
      refreshProjectState();
      setSelectedTrackId(newTrack.id);
      flashSaved();
    },
    [getEngine, refreshProjectState, flashSaved]
  );

  const handleClearTrack = useCallback(
    (trackId: string) => {
      const engine = getEngine();
      if (!engine) return;
      engine.clearTrackNotes(trackId);
      refreshProjectState();
      flashSaved();
    },
    [getEngine, refreshProjectState, flashSaved]
  );

  const handleToggleMute = useCallback(
    (trackId: string) => {
      const engine = getEngine();
      if (!engine) return;
      engine.toggleTrackMute(trackId);
      refreshProjectState();
      flashSaved();
    },
    [getEngine, refreshProjectState, flashSaved]
  );


  const handleCutoffChange = useCallback(
    (value: number) => {
      setFilterCutoff(value);
      const engine = getEngine();
      if (engine) {
        const currentPatch = engine.getLeadPatch();
        engine.updateLeadPatch({
          filter: { ...currentPatch.filter, cutoff: value },
        });
        flashSaved();
      }
    },
    [getEngine, flashSaved]
  );

  const handleResonanceChange = useCallback(
    (value: number) => {
      setFilterResonance(value);
      const engine = getEngine();
      if (engine) {
        const currentPatch = engine.getLeadPatch();
        engine.updateLeadPatch({
          filter: { ...currentPatch.filter, resonance: value },
        });
        flashSaved();
      }
    },
    [getEngine, flashSaved]
  );

  const handleVolumeChange = useCallback(
    (val: number) => {
      setMasterVolume(val);
      const engine = getEngine();
      if (engine) {
        engine.getContextManager().setMasterVolume(val);
      }
    },
    [getEngine]
  );

  // Subscribe to engine step, state, and project updates on mount
  useEffect(() => {
    const engine = getEngine();
    if (!engine) return;

    refreshProjectState();

    const unsubStep = engine.subscribeStep((step) => {
      setCurrentStep(step);
    });

    const unsubState = engine.subscribeState((playing) => {
      setIsPlaying(playing);
    });

    const unsubProject = engine.subscribeProjectChange(() => {
      refreshProjectState();
    });

    return () => {
      unsubStep();
      unsubState();
      unsubProject();
    };
  }, [getEngine, refreshProjectState]);

  // Global Keyboard shortcuts: Space (Play/Pause), Ctrl+Z (Undo), Ctrl+Shift+Z/Ctrl+Y (Redo), 1-4 (Track Tabs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      if (isTyping) return;

      // Space: Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayback();
        return;
      }

      // Ctrl+Z or Cmd+Z (Undo / Redo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      // Ctrl+Y (Redo on Windows)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Number keys 1-9: Switch active channel
      const trackIndex = Number(e.key) - 1;
      if (trackIndex >= 0 && trackIndex < tracksState.length) {
        setSelectedTrackId(tracksState[trackIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, handleUndo, handleRedo, tracksState]);

  // Current selected track helpers
  const selectedTrack =
    tracksState.find((t) => t.id === selectedTrackId) || tracksState[0];
  const isSelectedDrumTrack = selectedTrack?.kind === 'drums';
  const isSelectedBassTrack = selectedTrack?.category === 'bass';
  const isSelectedChordTrack = selectedTrack?.category === 'chords';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-700 dark:selection:text-amber-200 transition-colors">
      {/* Pixar-Style Animated Brand Intro */}
      {showIntro && <BrandIntro onComplete={handleIntroComplete} />}

      {/* Top Navigation & Transport Bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-6">
          {/* Apple-style clean branding */}
          <div className="flex items-center gap-2">
            <span className="font-sans text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">nota</span>
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isPlaying ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            />
          </div>

          {/* Transport Controls */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1">
            <button
              onClick={togglePlayback}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-mono text-xs uppercase font-medium transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-sm dark:shadow-none'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isPlaying ? 'Pause' : 'Play'}
              <span className="opacity-60 text-[10px] hidden sm:inline ml-1">Space</span>
            </button>

            <button
              onClick={handleStop}
              className="px-3 py-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Stop Sequencer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          {/* Tempo BPM Control with Turtle & Rabbit Analogy */}
          <div
            className="hidden sm:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg"
            title="Tempo / BPM"
          >
            <TurtleIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
            <input
              type="range"
              min="60"
              max="180"
              value={bpm}
              onPointerDown={handleBpmDragStart}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="w-20 accent-amber-500 cursor-pointer h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg"
            />
            <RabbitIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
            <span className="font-mono text-xs text-zinc-700 dark:text-zinc-200 w-7 text-right">{bpm}</span>
          </div>
        </div>

        {/* Right Status & Toggles */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Master Volume with Audio Icon */}
          <div
            className="hidden md:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg"
            title="Master Output Volume"
          >
            {masterVolume > 0 ? (
              <Volume2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-16 accent-amber-500 cursor-pointer h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg"
            />
          </div>

          {/* Auto-Save Indicator */}
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40"
            title="Project safely saved in browser"
          >
            <Check className="w-3 h-3" />
            <span>{saveStatus}</span>
          </div>

          {/* History Controls: Undo & Redo */}
          <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-1 rounded-md transition-colors ${
                canUndo
                  ? 'hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer shadow-xs dark:shadow-none'
                  : 'opacity-30 cursor-not-allowed text-zinc-400 dark:text-zinc-600'
              }`}
              title={canUndo ? 'Undo last change (Ctrl+Z)' : 'Nothing to undo'}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-1 rounded-md transition-colors ${
                canRedo
                  ? 'hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer shadow-xs dark:shadow-none'
                  : 'opacity-30 cursor-not-allowed text-zinc-400 dark:text-zinc-600'
              }`}
              title={canRedo ? 'Redo change (Ctrl+Shift+Z / Ctrl+Y)' : 'Nothing to redo'}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download / Export Button (To the left of Settings) */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            title="Download Audio & Project (.wav, .nota)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Settings Button (Gear Icon) */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout: Split Channel Rack (Left) + Active Workspace (Right) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: CHANNEL RACK (4 cols on desktop) */}
          <aside className="lg:col-span-4 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-sm dark:shadow-none transition-colors">
            {/* Channel Rack Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-zinc-900 dark:text-zinc-100">
                  Channel Rack
                </h2>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                {tracksState.length} {tracksState.length === 1 ? 'Track' : 'Tracks'}
              </span>
            </div>

            {/* Channels List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-0.5">
              {tracksState.map((track) => (
                <ChannelStrip
                  key={track.id}
                  track={track}
                  isActive={selectedTrack?.id === track.id}
                  canDelete={tracksState.length > 1}
                  onSelect={(id) => setSelectedTrackId(id)}
                  onToggleMute={handleToggleMute}
                  onVolumeChange={handleTrackVolumeChange}
                  onRemove={handleRemoveTrack}
                />
              ))}
            </div>

            {/* Add Instrument Button */}
            <button
              onClick={() => setIsAddInstrumentOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700/80 hover:border-amber-500 hover:bg-amber-500/5 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-medium font-sans flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Instrument
            </button>
          </aside>

          {/* RIGHT: ACTIVE SEQUENCER & PIANO ROLL WORKSPACE (8 cols on desktop) */}
          <section className="lg:col-span-8 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none transition-colors">
            {/* Active Channel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 font-bold flex items-center justify-center text-xs shadow-xs">
                  {selectedTrack?.name ? selectedTrack.name.charAt(0).toUpperCase() : 'T'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold font-sans text-zinc-900 dark:text-zinc-100">
                      {selectedTrack?.name}
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                      {selectedTrack?.category || selectedTrack?.kind}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {isSelectedDrumTrack
                      ? '16-Step Drum Sequencer'
                      : isSelectedBassTrack
                      ? 'D Minor Bassline Grid'
                      : isSelectedChordTrack
                      ? 'D Minor Chords & Pad Progression'
                      : 'Scale-Locked Melodic Piano Roll'}
                  </p>
                </div>
              </div>

              {/* Header Actions & Playhead Counter */}
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <button
                  onClick={() => handleToggleMute(selectedTrack.id)}
                  className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    selectedTrack?.muted
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
                  }`}
                >
                  {selectedTrack?.muted ? 'Unmute' : 'Mute'}
                </button>

                {!isSelectedDrumTrack && (
                  <button
                    onClick={() => handleClearTrack(selectedTrack.id)}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    Clear Notes
                  </button>
                )}

                <div className="font-mono text-xs px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-amber-600 dark:text-amber-400 font-bold border border-zinc-200 dark:border-zinc-700/80">
                  Step {currentStep + 1} / 16
                </div>
              </div>
            </div>

            {/* Active Editor Grid */}
            {isSelectedDrumTrack ? (
              <div className="space-y-2.5 overflow-x-auto pb-2">
                {(Object.keys(DRUM_LABELS) as DrumVoiceType[]).map((voice) => {
                  const steps = selectedTrack?.drumSteps?.[voice] || [];

                  return (
                    <div key={voice} className="flex items-center gap-3 min-w-[650px]">
                      <div className="w-24 flex items-center justify-between pr-2">
                        <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{DRUM_LABELS[voice]}</span>
                        <button
                          onClick={() => getEngine()?.playAuditionDrum(voice)}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                          title="Audition Sound"
                        >
                          Hit
                        </button>
                      </div>

                      <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
                        {Array.from({ length: 16 }).map((_, stepIdx) => {
                          const isActive = !!steps[stepIdx];
                          const isPlayhead = isPlaying && currentStep === stepIdx;
                          const isBeatQuarter = stepIdx % 4 === 0;

                          return (
                            <button
                              key={stepIdx}
                              onClick={() => handleDrumStepClick(voice, stepIdx)}
                              className={`h-9 rounded-md transition-all relative flex items-center justify-center font-mono text-[10px] cursor-pointer ${
                                isActive
                                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                                  : isBeatQuarter
                                  ? 'bg-zinc-200 dark:bg-zinc-800/80 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-500'
                                  : 'bg-zinc-100 dark:bg-zinc-800/40 hover:bg-zinc-200 dark:hover:bg-zinc-700/60 text-zinc-400 dark:text-zinc-600'
                              } ${isPlayhead ? 'ring-2 ring-amber-500 dark:ring-white scale-105 z-10' : ''}`}
                            >
                              {stepIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : isSelectedChordTrack ? (
              <div className="space-y-3 overflow-x-auto pb-2">
                <div className="text-xs font-mono text-zinc-400 pb-1 flex items-center justify-between">
                  <span>D MINOR HARMONIC CHORDS • CLICK BAR BEAT TO ASSIGN CHORD</span>
                  <span className="text-zinc-500">Polyphonic Pad Synthesis</span>
                </div>

                {CHORD_PRESETS.map((chord) => {
                  const activeNotes = selectedTrack?.notes || [];

                  return (
                    <div key={chord.name} className="flex items-center gap-3 min-w-[650px]">
                      <div
                        onClick={() => {
                          chord.midis.forEach((m) => getEngine()?.playAuditionSynth('chord', m));
                        }}
                        className="w-36 flex items-center justify-between pr-2 cursor-pointer group bg-zinc-50 dark:bg-zinc-950/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 p-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 transition-colors"
                        title="Click to audition chord"
                      >
                        <div>
                          <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-amber-500">
                            {chord.symbol}: {chord.name}
                          </span>
                          <div className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate max-w-[90px]">{chord.description}</div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-amber-500">play</span>
                      </div>

                      {/* Step Bar Columns (Steps 0, 4, 8, 12) */}
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        {[0, 4, 8, 12].map((stepIdx, barNum) => {
                          const isChordOnStep = chord.midis.every((m) =>
                            activeNotes.some((n) => n.step === stepIdx && n.midi === m)
                          );
                          const isPlayheadInBar = isPlaying && Math.floor(currentStep / 4) === barNum;

                          return (
                            <button
                              key={stepIdx}
                              onClick={() => handleApplyChordToStep(chord, stepIdx)}
                              className={`h-10 rounded-lg border transition-all flex flex-col items-center justify-center font-mono cursor-pointer ${
                                isChordOnStep
                                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                                  : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                              } ${isPlayheadInBar ? 'ring-2 ring-amber-500 dark:ring-white/60' : ''}`}
                            >
                              <span className="text-xs">Bar {barNum + 1} (Step {stepIdx + 1})</span>
                              <span className="text-[10px] opacity-70">
                                {isChordOnStep ? `Active: ${chord.symbol}` : '+ Assign'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MELODY, BASS, KEYS, OR ACOUSTIC SCALE PIANO ROLL */
              <div className="space-y-1.5 overflow-x-auto pb-2">
                <div className="text-xs font-mono text-zinc-400 pb-1 flex items-center justify-between">
                  <span>
                    {isSelectedBassTrack ? 'SUB BASS LANES • D MINOR SCALE' : 'PITCH LANES • D MINOR SCALE (CLICK TO PLACE / REMOVE)'}
                  </span>
                  <span className="text-zinc-500">Auto-quantized in key</span>
                </div>

                {(isSelectedBassTrack ? BASS_SCALE : MELODY_SCALE).map((scaleDeg) => {
                  const activeNotes = selectedTrack?.notes || [];

                  return (
                    <div key={scaleDeg.midi} className="flex items-center gap-3 min-w-[650px]">
                      {/* Pitch Row Header */}
                      <div
                        onClick={() => getEngine()?.playAuditionSynth(isSelectedBassTrack ? 'bass' : 'lead', scaleDeg.midi)}
                        className="w-24 flex items-center justify-between pr-2 cursor-pointer group bg-zinc-50 dark:bg-zinc-950/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 p-1 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 transition-colors"
                        title="Click to audition pitch"
                      >
                        <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-amber-500">
                          {scaleDeg.label}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{scaleDeg.role}</span>
                      </div>

                      {/* 16 Step Buttons for this Pitch */}
                      <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
                        {Array.from({ length: 16 }).map((_, stepIdx) => {
                          const noteInstance = activeNotes.find(
                            (n) => n.step === stepIdx && n.midi === scaleDeg.midi
                          );
                          const isActive = !!noteInstance;
                          const isPlayhead = isPlaying && currentStep === stepIdx;
                          const isBeatQuarter = stepIdx % 4 === 0;

                          return (
                            <button
                              key={stepIdx}
                              onClick={() => handleSynthGridClick(selectedTrack.id, scaleDeg.midi, stepIdx)}
                              className={`h-7 rounded-md transition-all relative flex items-center justify-center font-mono text-[9px] cursor-pointer ${
                                isActive
                                  ? 'bg-amber-400 text-zinc-950 font-bold shadow-xs'
                                  : isBeatQuarter
                                  ? 'bg-zinc-200/90 dark:bg-zinc-800/70 hover:bg-zinc-300 dark:hover:bg-zinc-700/80 text-zinc-600 dark:text-zinc-400'
                                  : 'bg-zinc-100 dark:bg-zinc-900/80 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 text-zinc-400 dark:text-zinc-600'
                              } ${isPlayhead ? 'ring-1.5 ring-amber-500 dark:ring-white scale-105 z-10' : ''}`}
                            >
                              {stepIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sound Shaping Controls & Musical Knowledge Drawer */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Filter Cutoff */}
                <div className="space-y-1 bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-700 dark:text-zinc-300">Filter Cutoff</span>
                    <span className="text-amber-500 font-bold">{filterCutoff} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="8000"
                    step="50"
                    value={filterCutoff}
                    onChange={(e) => handleCutoffChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg"
                  />
                  <p className="text-[10px] text-zinc-400">Warm/dark to bright frequency shaping</p>
                </div>

                {/* Filter Resonance */}
                <div className="space-y-1 bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-700 dark:text-zinc-300">Resonance (Q)</span>
                    <span className="text-amber-500 font-bold">{filterResonance.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={filterResonance}
                    onChange={(e) => handleResonanceChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg"
                  />
                  <p className="text-[10px] text-zinc-400">Peak boost for analog character</p>
                </div>
              </div>

              {/* Theory Tip Box */}
              <div className="bg-zinc-50 dark:bg-zinc-950/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                <div className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                  Scale Lock: <span className="text-amber-600 dark:text-amber-400 font-bold">D Minor</span> (D - E - F - G - A - Bb - C). Every note is guaranteed in harmonic key.
                </div>
                <div className="text-[11px] text-zinc-400">4/4 • 16 Steps</div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Modals */}
      <AddInstrumentModal
        isOpen={isAddInstrumentOpen}
        onClose={() => setIsAddInstrumentOpen(false)}
        onSelectPreset={handleAddPreset}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onProjectImported={refreshProjectState}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onProjectImported={refreshProjectState}
      />
    </div>
  );
}
