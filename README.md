# 🎵 Nota

> An accessible, block-based Web DAW designed to teach digital music production and music theory to beginners and neurodivergent children.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Microsoft Azure](https://img.shields.io/badge/Microsoft_Azure-Cloud_&_AI-0078D4?style=flat&logo=microsoftazure)](https://azure.microsoft.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Overview

**Nota** is an intuitive, web-based digital audio workstation (DAW) that reimagines musical creation for education and neurodiversity. Inspired by MIT's Scratch, Nota replaces complex audio interfaces with tactile, visual, and modular blocks, lowering cognitive barriers while providing a full-featured creative suite.

### Core Ecosystem
- 🧪 **The Lab:** Interactive lessons exploring music theory, rhythm, and sound synthesis through gamified visual modules.
- 🎛️ **The Studio:** A lightweight, high-performance DAW powered by Web Audio API and WebAssembly for latency-free composition.

---

## ☁️ Microsoft Azure Architecture & AI Integration

Nota heavily leverages Microsoft cloud and AI services for safety and personalized learning:

- **Azure OpenAI Service:** Powers the real-time AI Music Assistant, providing contextual musical hints, harmonic suggestions, and simplifying theory concepts for young learners.
- **Azure AI Content Safety:** Automated moderation for user-submitted track names, descriptions, comments, and assets, ensuring a COPPA-compliant and child-friendly environment.
- **Azure Static Web Apps & Cosmos DB:** Hosting, CI/CD pipeline, and scalable NoSQL database for project storage and user state[cite: 1].

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)[cite: 1]
- **Language & Styling:** TypeScript, Tailwind CSS
- **Audio Engine:** Web Audio API, WebAssembly (WASM)[cite: 1]
- **Cloud & AI:** Azure OpenAI Service, Azure AI Content Safety, Azure Static Web Apps[cite: 1]
- **State Management:** Zustand

---

## 🚀 Getting Started (in progress...)

Follow these steps to run the project locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- An active [Azure Account](https://azure.microsoft.com/) with configured Azure OpenAI and Content Safety endpoints[cite: 1]

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/your-username/nota.git](https://github.com/your-username/nota.git)
   cd nota
