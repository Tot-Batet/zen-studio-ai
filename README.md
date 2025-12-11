# ZEN Studio AI 🎧

> **Industrial Audio Production for Screen-Free Kids' Tech.**
> *Built with Google AI Studio ("Vibe Coding") & Gemini*

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 📖 The Vision
**Tot & Batet** is building a secure, screen-free audio device for children. To fuel this device, we needed a content factory.
**ZEN Studio AI** is that factory: a "Single Pane of Glass" dashboard that transforms raw physical books into secured, interactive audio segments in seconds.

## 🤖 AI-Powered Architecture
This project explores the **"Vibe Coding"** paradigm. The entire React frontend was generated via natural language prompts in Google AI Studio.

* **Ingestion (Gemini 1.5 Flash):** Extracts text and analyzes the emotional "Mood" from raw book photos.
* **Production (Gemini 2.5):** Generates Neural TTS (Text-to-Speech) audio assets tailored to the story's emotion.
* **Simulation (Web Crypto API):** Simulates a hardware "Trusted Execution Environment" (TEE) in the browser to decrypt and play the content.

## 🛠️ Tech Stack
* **Framework:** React 18 + Vite
* **Styling:** Tailwind CSS (Glassmorphism UI)
* **State:** Zustand (with LocalStorage persistence)
* **AI Integration:** Google Generative AI SDK (Web)
* **Audio:** Web Speech API + Gemini TTS

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* A Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation
```bash
# Clone the repo
git clone [https://github.com/YOUR_USERNAME/zen-studio-ai.git](https://github.com/YOUR_USERNAME/zen-studio-ai.git)

# Install dependencies
npm install

# Start the dev server
npm run dev
