# Nota: Architectural Decisions & Strategic Blueprint

This document records the foundational architectural decisions, product philosophy, technical stack alignment, and competition strategy for **Nota**, established to guide development toward winning the **Microsoft Imagine Cup 2027**.

---

## 1. Core Architectural Decisions (The 6 Pillars)

| Decision Area | Selected Choice | Rationale & Trade-offs |
| :--- | :--- | :--- |
| **1. Audio DSP & Synthesis Engine** | **Hybrid: Web Audio API + AudioWorklet (TypeScript)** | Native Web Audio nodes provide hardware-accelerated routing and basic primitives without compilation overhead. Custom `AudioWorklet` processors run on a dedicated audio render thread to execute custom DSP algorithms (subtractive/FM synthesis, custom filters, tape saturation, and bitcrushing) with zero main-thread UI jank. |
| **2. Rhythm & Sequencer Timing** | **Web Worker Lookahead Scheduler** | Avoids `setInterval` or main-thread drift caused by React re-renders or background tab throttling. A dedicated Web Worker ticks every $25\text{ ms}$, scheduling audio events $50\text{--}100\text{ ms}$ ahead directly onto the hardware-clocked `AudioContext.currentTime`. |
| **3. AI Architecture & Intelligence** | **Hybrid Edge (ONNX Web) + Cloud (Azure AI / Phi-4)** | **Edge**: ONNX Runtime Web runs client-side pitch-tracking models (Hum-to-MIDI) with $<10\text{ ms}$ latency, zero cloud cost, and full offline privacy.<br>**Cloud**: Azure OpenAI / Phi-4 via Microsoft Semantic Kernel handles complex natural language sound design, harmonic analysis, and adaptive music theory tutoring. |
| **4. Collaboration & Sharing Scope** | **Client-First Local Save + Project JSON/WAV Export** | Real-time multiplayer collaboration was formally **scrapped** to keep the core experience focused, minimalist, and distraction-free. Projects persist locally via IndexedDB with zero cloud friction, and can be shared via portable JSON project files and offline WAV exports. |
| **5. UI & High-Frequency Rendering** | **Hybrid React 19 + Dedicated HTML5 Canvas 2D** | React 19 and Tailwind CSS v4 manage the application chrome, settings panels, and AI drawer. High-frequency visual elements (moving timeline playhead, piano roll note grid, real-time oscilloscope, and FFT frequency visualizer) render on a dedicated HTML5 Canvas at smooth $60\text{--}120\text{ fps}$ decoupled from React's virtual DOM. |
| **6. Education & Accessibility Paradigm** | **In-Situ Guided Learning + Harmonic Guardrails** | Music theory and sound physics are learned *by doing* inside the DAW. Features include scale locking (Dorian, Minor Blues, Pentatonic), Roman numeral chord analysis ($I\text{--}IV\text{--}V\text{--}vi$), interactive sound physics hover cards, full keyboard navigation (WASD/Arrows), and screen reader sonification. |

---

## 2. Product Philosophy: Radical Minimalism

Traditional DAWs (Ableton Live, FL Studio, Logic Pro) are cockpit-style labyrinths with thousands of cryptically labeled knobs, complex routing matrices, and steep learning curves. Nota follows a **Teenage Engineering / Dieter Rams** design ethos:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  NOTA  [▶ Play] [■ Stop] [● Rec]   BPM: 120   Key: D Minor   [Learn Mode: ON]    │
├──────────────┬─────────────────────────────────────────────────┬────────────────┤
│ TRACKS       │ TIMELINE / STEP SEQUENCER (Canvas 60fps)        │ AI COPILOT     │
│              │ 1 . . . 2 . . . 3 . . . 4 . . . 5 . . . 6 . . . │                │
│ [Synth Lead] │ █ █ █ █         █ █ █ █         █ █ █ █         │ "Make this     │
│ [Bassline]   │         █ █             █ █             █ █     │  synth sound   │
│ [Drum Rack]  │ ●   ●   ●   ●   ●   ●   ●   ●   ●   ●   ●   ●   │  warm and      │
├──────────────┴─────────────────────────────────────────────────┤  nostalgic"    │
│ SOUND DESIGN & THEORY INSPECTOR (Contextual)                   │                │
│  [Wave: Saw]  [Cutoff: 1.2kHz ──\__]  [Resonance: 30%]         │ [Apply Preset] │
│  Harmonic Role: i (Tonic Minor) ── Provides dark stability     │                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Design Tenets:
1. **Time to First Sound $< 3$ Seconds**: Open the browser $\rightarrow$ press spacebar $\rightarrow$ hear an inspiring musical groove immediately.
2. **Single-Surface Canvas**: Zero floating sub-windows, nested context menus, or detached plugin windows. Everything happens on a unified workspace.
3. **Contextual Macro Controls**: Only expose the 3–5 controls that matter most for each instrument.
4. **Visual Sound Physics**: Modifying parameters like filter cutoff or resonance renders real-time visual explanations of the audio spectrum being shaped.

---

## 3. Microsoft Imagine Cup 2027 Winning Strategy

The Microsoft Imagine Cup heavily weights **technical depth on Azure**, **social impact/accessibility**, and **live pitch execution**.

### Key Scoring Pillars:
1. **Authentic Azure & Microsoft AI Depth**:
   - **Azure OpenAI Service & Phi-4**: Powered by Microsoft Semantic Kernel for generative sound design and composition tutoring.
   - **ONNX Runtime Web**: Showcases edge AI running Microsoft-backed open-source machine learning directly in the browser.
   - **GitHub Ecosystem & Azure Static Web Apps**: Fully automated CI/CD pipeline and open-source contribution workflow.
2. **Accessibility & Educational Democratization**:
   - Web-first: Runs on low-cost hardware (e.g., school Chromebooks) with zero installation required.
   - Full keyboard accessibility and audio-cue sonification for visually impaired students.
   - Free and open-source, leveling the playing field against $500+ commercial DAWs.
3. **Pitch & Live Demo Script**:
   - **Hook**: Presenter hums a melody into their laptop microphone; Nota transcribes it to MIDI notes in real-time via in-browser ONNX.
   - **The AI Spark**: Presenter types *"Turn this into a warm 80s dream-pop synth lead"*; Azure AI recalculates synth envelopes and filter resonance instantly.
   - **Educational Value**: Presenter clicks a chord progression; Nota visually and audibly deconstructs *why* the resolution feels uplifting using Roman numeral theory.

---

## 4. Phased Execution Roadmap

### Phase 1: Engine Foundation & Repository Cleanup
- Flatten nested project directory structure (`Nota/nota/*` to workspace root).
- Implement singleton `AudioContextManager` and Web Worker lookahead scheduler.
- Create 2-oscillator Subtractive Synthesizer with ADSR envelopes and resonant filter.
- Build 4-voice Drum Machine (Kick, Snare, Hi-Hat, Percussion) with synthesized sound generators.

### Phase 2: Minimalist UI & Canvas Timeline
- Implement high-contrast dark/light design system with Tailwind CSS v4 and Lucide icons.
- Build dedicated 60fps HTML5 Canvas sequencer (step grid + mini piano roll).
- Add transport controls (Play, Stop, BPM, Metronome, Key/Scale selector).
- Add real-time oscilloscope and FFT frequency visualizer.

### Phase 3: In-Situ Music Theory & Sound Design Education
- Implement scale quantization engine (Major, Minor, Dorian, Pentatonic, Blues).
- Implement real-time Roman numeral harmonic chord detection.
- Build interactive micro-lessons ("Creating Your First Beat", "Bassline Fundamentals", "How Filters Shape Sound").

### Phase 4: Azure AI & Edge Intelligence
- Integrate Azure OpenAI / Phi-4 endpoint for natural language sound design and chord generation.
- Implement ONNX Runtime Web for real-time microphone pitch-to-MIDI transcription.
- Implement IndexedDB local persistence and offline WAV file export.
- Prepare demo project, competition submission video, and presentation deck.
