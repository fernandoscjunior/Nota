# 🎵 Nota

> An accessible, minimalistic, AI-powered Web DAW designed to teach digital music production, sound design, and music theory to beginners and neurodivergent creators.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Microsoft Azure](https://img.shields.io/badge/Microsoft_Azure-Cloud_&_AI-0078D4?style=flat&logo=microsoftazure)](https://azure.microsoft.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Overview

**Nota** is a radical departure from cluttered, cockpit-style digital audio workstations (DAWs). Built with a tactile, minimalist aesthetic inspired by **Teenage Engineering** and **Dieter Rams**, Nota lowers cognitive barriers and makes music production approachable, intuitive, and educational.

Whether you are a beginner crafting your first 16-step beat or a student deconstructing chord progressions, Nota provides an immediate, expressive, and playful creative canvas.

### Core Ecosystem
- 🎛️ **The Studio:** A zero-latency, in-browser DAW featuring a multi-track channel rack, subtractive synthesizer, synthesized 4-voice drum machine, scale-locked pitch lanes (D Minor), and a 4-bar polyphonic chord sequencer with real-time Roman numeral harmonic theory.
- 🧪 **The Lab:** Interactive micro-lessons exploring sound physics, frequency filtering, rhythm, and harmony through gamified visual modules.

---

## ⚡ Key Features

- **Zero-Latency In-Browser Audio Engine**:
  - Sample-accurate timing driven by a dedicated Web Worker lookahead scheduler ($25\text{ ms}$ tick, $50\text{--}100\text{ ms}$ hardware lookahead onto `AudioContext.currentTime`).
  - Dual-oscillator subtractive synthesizer with resonant low-pass filter, detune, octave transposition, and dual ADSR envelopes.
  - Physical modeling synthesized drum rack (Kick 808, Snare 909, Hi-Hat, Clap).
- **In-Situ Music Theory Guardrails**:
  - **Scale Lock (D Minor)**: Prevents discordant notes and visually explains scale degrees (Root, Minor 3rd, 5th Dominant, Octave).
  - **Roman Numeral Chord Sequencer**: Compose with harmonic progressions ($i, VI, III, VII, iv, v$) with contextual explanations of emotional tension and resolution.
- **Client-First Persistence & Lossless Export**:
  - Full 30-step immutable Undo/Redo history stack (`Ctrl+Z`, `Ctrl+Shift+Z` / `Ctrl+Y`).
  - Automatic browser persistence via `localStorage` with versioned schema migration.
  - In-browser 16-bit PCM stereo WAV export rendered offline in $<1$ second via `OfflineAudioContext`.
  - Portable `.nota` JSON project backup and drag-and-drop restore.

---

## ☁️ Microsoft Azure Architecture & AI Integration

Nota is built for the **Microsoft Imagine Cup 2027**, combining low-latency edge AI with cloud intelligence:

- **Azure OpenAI Service & Phi-4**: Powered by Microsoft Semantic Kernel for conversational sound design (e.g., *"Make this synth lead warm and nostalgic"*) and adaptive music theory tutoring.
- **Azure AI Content Safety**: Automated moderation for user-generated project titles, descriptions, and comments, fostering a safe, COPPA-compliant educational space.
- **ONNX Runtime Web (Edge AI)**: In-browser microphone pitch-to-MIDI transcription allowing students to hum or sing melodies directly into the sequencer with zero cloud latency and total privacy.
- **Azure Static Web Apps & Cosmos DB**: Global CDN hosting, continuous deployment via GitHub Actions, and cloud project syncing.

---

## 🛠️ Tech Stack

- **Frontend & UI**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Audio DSP**: Web Audio API (`AudioContext`, `BiquadFilterNode`, `AnalyserNode`), Web Worker Timing Thread, `OfflineAudioContext`
- **Language**: TypeScript 5 (strict typing)
- **Cloud & AI**: Azure OpenAI Service, Phi-4, Semantic Kernel, ONNX Runtime Web, Azure AI Content Safety
- **Architecture Documentation**: See [decisions.md](decisions.md) and [Development Log & Decisions Wiki](docs/wiki/Development-Log-and-Decisions.md)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- `npm`, `pnpm`, or `yarn`

### Installation & Local Run

1. Clone the repository:
   ```bash
   git clone https://github.com/fernandoscjunior/Nota.git
   cd Nota
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser. Press `Spacebar` to start playing the starter groove immediately!

### Production Build & Linting

```bash
# Build the production bundle
npm run build

# Run ESLint checks
npm run lint
```

---

## 📄 Documentation & Project History

- 📐 [Architectural Decisions & Strategic Blueprint](decisions.md): Detailed 6 pillars and Microsoft Imagine Cup 2027 roadmap.
- 📚 [Development Log & Wiki](docs/wiki/Development-Log-and-Decisions.md): Complete chronological record of milestones, audio engine implementation, and design choices.

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
