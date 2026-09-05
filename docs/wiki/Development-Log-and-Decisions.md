# Project Log & Architectural Decisions

*A historical changelog and architectural decision record (ADR) for **Nota** — a minimalist, open-source, AI-powered Web DAW designed for the **Microsoft Imagine Cup 2027**.*

---

## 📖 Overview

**Nota** is a radical reimagining of the Digital Audio Workstation. Designed with a tactile aesthetic inspired by **Teenage Engineering** and **Dieter Rams**, Nota eliminates the cockpit-like clutter of traditional DAWs (Ableton, FL Studio, Logic) to deliver:
- **Zero-Latency In-Browser Audio**: Native Web Audio API synthesis with a dedicated Web Worker lookahead timing engine.
- **In-Situ Music Theory**: Musical guardrails, scale-locked pitch lanes (D Minor), and Roman numeral chord analysis ($i - VI - III - VII - iv - v$) integrated directly into the sequencer.
- **Client-First Privacy & Portability**: 100% offline functionality, instant 16-bit PCM WAV rendering via `OfflineAudioContext`, and portable JSON project backups.
- **Roadmap to Imagine Cup 2027**: Edge pitch-to-MIDI transcription via ONNX Runtime Web paired with cloud generative sound design powered by Azure OpenAI and Phi-4 via Semantic Kernel.

---

## 🛠️ Main Changes & Development Milestones

### Phase 1: Repository Refactoring & Project Modernization
- **Repository Flattening**: Eliminated redundant nested mono-directory structure (`Nota/nota/*`), promoting configuration files (`next.config.ts`, `tsconfig.json`, `package.json`, `eslint.config.mjs`) directly to the workspace root.
- **Tech Stack Alignment**:
  - **Framework**: Next.js 16 (App Router) + React 19.
  - **Styling**: Tailwind CSS v4 with dark/light mode token integration.
  - **Icons**: Lucide React + custom studio SVG glyphs (`StudioIcons.tsx`).
  - **Hydration Safety**: Integrated React 19 `useSyncExternalStore` for client-only audio and window hooks, eliminating React hydration mismatches.

---

### Phase 2: Audio DSP & Core Synthesis Engine
- **`AudioContextManager` (Singleton)**:
  - Centralized Web Audio `AudioContext` lifecycle management.
  - Automatic audio context resumption on user interaction (resolves browser autoplay restrictions).
  - Configured high-resolution `AnalyserNode` for frequency/waveform inspection and a master dynamics limiter to prevent clipping and ear fatigue.
- **Web Worker Lookahead Sequencer (`AudioScheduler`)**:
  - Implemented sample-accurate lookahead timing via a dedicated Web Worker (`public/workers/scheduler.worker.js`).
  - Worker posts timer ticks every $25\text{ ms}$, scheduling audio events $50\text{--}100\text{ ms}$ ahead directly onto `AudioContext.currentTime`.
  - Immune to main-thread UI jank, heavy React renders, or background tab throttling.
  - Coupled visual playhead updates with high-resolution `requestAnimationFrame` queue synchronization.
- **Dual-Oscillator Subtractive Synthesizer (`SubtractiveSynth`)**:
  - Dual oscillators supporting Sawtooth, Square, Triangle, and Sine waveforms.
  - Independent detune (cents), octave transposition, and oscillator gain balancing.
  - 12dB/octave resonant low-pass biquad filter with configurable cutoff ($100\text{ Hz} - 8000\text{ Hz}$) and resonance ($Q: 0.5 - 10$).
  - Dual ADSR envelope generators (amplitude envelope + filter envelope modulation).
- **Physical Modeling Drum Synthesizer (`DrumSynth`)**:
  - **Kick (808)**: Exponential pitch-dropping sine oscillator with transient click.
  - **Snare (909)**: Dual-component synthesis combining a tuned tonal body with bandpass-filtered white noise.
  - **Hi-Hat**: High-pass filtered metallic noise with snappy decay envelope.
  - **Clap**: Multi-burst envelope triggering filtered noise pulses for realistic stereo hand claps.

---

### Phase 3: Tactile Studio UI & Sequencer Canvas
- **Multi-Track Channel Rack (`ChannelStrip.tsx`)**:
  - Left-hand modular channel rack with support for unlimited tracks.
  - Per-channel rotary volume knobs, mute/unmute toggles, active track selection, and deletion controls.
  - Visual category badges: Lead, Bass, Chords, Drums, Keys, and Plucks.
- **Instrument Preset Catalogue (`presets.ts` & `AddInstrumentModal.tsx`)**:
  - Curated instrument browser spanning:
    - *Drums*: Studio 808 Machine, Lo-Fi Vintage Kit.
    - *Leads*: Warm Analog Lead, Neo-Soul Pluck, 80s Cyber Lead.
    - *Basses*: Deep Sub Bass, Acid Bassline.
    - *Pads/Keys*: Dreamy Poly Pad, Rhodes Electric Piano.
  - Instant note auditioning on preset hover.
- **16-Step Drum Sequencer Grid**:
  - Tactile step buttons with active step highlights and 4-on-the-floor quarter-beat visual markers.
  - Real-time animated playhead cursor.
  - Single-click voice auditioning ("Hit" buttons).
- **Scale-Locked Pitch Lanes (Melody & Bass)**:
  - Quantized to the **D Minor** harmonic scale (D, E, F, G, A, Bb, C).
  - Explicit musical theory labeling for every pitch lane (Root, 2nd, Min 3rd, 4th, 5th Dom, Min 6th, Min 7th, Octave).
  - Beginners physically cannot place an "out-of-key" dissonant note.
- **Polyphonic Chord Pad Sequencer**:
  - Dedicated 4-bar chord progression lane with Roman numeral harmonic symbols ($i, VI, III, VII, iv, v$).
  - Theory-based functional descriptions (e.g., *$i$: Tonic minor — Dark, grounding stability*; *$VI$: Submediant — Epic, heroic lift*).
  - One-click chord auditioning and bar assignment.
- **Tactile Sound Shaping Drawer**:
  - Real-time Filter Cutoff ($100\text{--}8000\text{ Hz}$) and Resonance ($Q$) slider controls.
  - Dynamic visual frequency tips explaining how filter sweeps alter warmth and brightness.

---

### Phase 4: History Engine, Persistence & Modals
- **30-Step Undo / Redo Stack**:
  - Immutable state snapshots pushed on note placement, BPM adjustments, track additions, and clearing operations.
  - Full keyboard shortcut support: `Ctrl+Z` (Undo), `Ctrl+Shift+Z` / `Ctrl+Y` (Redo).
  - Real-time UI indicator showing undo/redo availability.
- **Automatic Browser Persistence**:
  - Instant local saving to browser `localStorage` under `nota_project_v1`.
  - Auto-save toggle option with visual "Auto-saved" confirmation badges.
  - Schema migration resilience with version check (`PROJECT_STORAGE_VERSION`).
- **Lossless Audio & Project Exporter (`ExportModal.tsx`)**:
  - **16-bit PCM Stereo WAV Bounce**: Uses in-browser `OfflineAudioContext` to render multi-loop audio exports into standard RIFF WAV files in $<1$ second without realtime waiting.
  - **Portable `.nota` Backup**: Export complete project state as portable JSON; load projects back via drag-and-drop or file picker.
- **Preferences Modal (`SettingsModal.tsx`)**:
  - System, Light, and Dark mode theme selector with instant DOM synchronization.
  - Auto-save engine toggle and manual backup triggers.
  - Reset project to pristine factory state with safety confirmation.
- **Brand Experience (`BrandIntro.tsx` & `chime.ts`)**:
  - Playful bouncing letter intro animation ("n - o - t - a").
  - 3-note harmonic bliss brand chime synthesizer playing a warm F# major chord on entry.
  - Session storage check to display intro once per session without interrupting workflow.

---

## 🏛️ Architectural Decision Records (ADRs)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             NOTA ARCHITECTURE STACK                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│ UI Layer       │ React 19 + Tailwind CSS v4 + Lucide Icons                       │
│ State / Sync   │ Immutable Snapshots (Undo/Redo) + localStorage Schema v1        │
│ Timing Engine  │ Dedicated Web Worker (25ms lookahead, 100ms hardware scheduling)│
│ Audio Engine   │ Web Audio API (Subtractive 2-Osc, 4-Voice Drum Synth, Master Bus│
│ Offline Render │ OfflineAudioContext -> RIFF 16-bit PCM Stereo WAV               │
│ Future AI      │ ONNX Runtime Web (Edge Hum-to-MIDI) + Azure OpenAI / Phi-4      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### ADR-001: Web Audio API + Lookahead Worker over Third-Party Audio Frameworks
- **Decision**: Build the DSP engine directly with Web Audio API nodes (`OscillatorNode`, `BiquadFilterNode`, `GainNode`) and a custom Web Worker lookahead scheduler rather than importing heavy third-party libraries (e.g., Tone.js, Howler.js).
- **Rationale**:
  - Native Web Audio primitives avoid framework overhead and compilation bloat.
  - Standard `setInterval` or `setTimeout` on the main JavaScript thread suffers from timing jitter, tab throttling, and UI blocking.
  - The lookahead scheduler pattern schedules events $50\text{--}100\text{ ms}$ into the future directly onto the hardware audio clock (`AudioContext.currentTime`), guaranteeing sample-accurate playback.

### ADR-002: In-Browser Offline Rendering for WAV Exports
- **Decision**: Use `OfflineAudioContext` for audio bounce instead of sending MIDI/JSON to a backend server.
- **Rationale**:
  - Zero server infrastructure costs and zero cloud latency.
  - Full offline functionality — students on school Chromebooks or air-gapped devices can export production-ready audio.
  - Custom 16-bit PCM RIFF encoder directly structures binary audio into downloadable `Blob` objects.

### ADR-003: Single-Surface Canvas over Cockpit-Style Windows
- **Decision**: Keep the entire application on a single unified canvas. Reject floating modal plugin windows, complex routing matrices, and nested dropdown menus.
- **Rationale**:
  - Traditional DAWs suffer from "cockpit syndrome", intimidating new learners.
  - Nota applies a **Teenage Engineering / Dieter Rams** design ethos: minimal, clean, tactile, and immediately comprehensible.
  - Time-to-first-sound target: $< 3$ seconds after opening the page.

### ADR-004: Client-First Architecture over Real-Time Multiplayer
- **Decision**: Scrapped real-time multi-user WebSocket collaboration in favor of bulletproof client-first local persistence and portable `.nota` file sharing.
- **Rationale**:
  - Keeps the core creation loop distraction-free and latency-free.
  - Eliminates server sync conflicts, operational hosting costs, and authentication friction.

### ADR-005: Built-In Scale Locking and Roman Numeral Guardrails
- **Decision**: Hard-quantize pitch lanes to D Minor scale degrees and pad progressions to Roman numeral chords ($i, VI, III, VII, iv, v$).
- **Rationale**:
  - Removes the fear of making musical mistakes for beginners.
  - Teaches music theory *in-situ* through active creation rather than passive reading.

### ADR-006: Hybrid Edge + Cloud AI Strategy for Microsoft Imagine Cup 2027
- **Decision**:
  - **Edge**: ONNX Runtime Web for real-time microphone pitch-to-MIDI transcription (zero cloud latency, total user privacy).
  - **Cloud**: Azure OpenAI / Phi-4 integrated via Microsoft Semantic Kernel for conversational sound design (e.g., *"Make this synth sound like an 80s dream-pop lead"*).
- **Rationale**:
  - Maximizes technical depth on the Microsoft stack for the Imagine Cup while preserving low-latency local performance on budget hardware.

---

## 🚀 Next Steps & Immediate Roadmap

1. **Edge ONNX Pitch-to-MIDI**: Connect browser microphone to in-browser ONNX model to allow humming a melody directly into the sequencer.
2. **Azure AI Copilot Drawer**: Implement natural language prompt bar to generate synth patches, modify drum grooves, and explain chord changes.
3. **60fps Canvas Oscilloscope**: Add real-time visual oscilloscope and FFT frequency spectrum visualizer using the existing `AudioContextManager` analyser node.
4. **Interactive Sound Physics Tooltips**: Expand hover cards explaining sound physics (e.g., resonance peaks, harmonic series, ADSR slope curves).
