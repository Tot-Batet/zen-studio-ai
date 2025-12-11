# ZEN Studio AI 🎧

> **Industrial Audio Production for Screen-Free Kids' Tech.**
> *Built with Google AI Studio ("Vibe Coding") & Gemini*

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 📖 The Vision
**Tot & Batet** is building a secure, screen-free audio device for children. To fuel this device, we needed a content factory.
**ZEN Studio AI** is that factory: a "Single Pane of Glass" dashboard that transforms raw physical books into secured, interactive audio segments in seconds.

## 🌐 Discover Tot & Batet
To understand the full ecosystem and our mission to reconnect children with their imagination without screens, visit our official website:
👉 **[www.totetbatet.com](https://www.totetbatet.com)**

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
```

## 🏗️ Project Structure
- /src/components: UI Panels (Left: Ingestion, Center: Editor, Right: Simulator)
- /src/store: Logic Core (Zustand state machine)
- /src/types: ZEN Format v4.2 TypeScript definitions (Industrial Standard)

## 🔒 Security Simulation
The simulator (Right Panel) mimics a hardware device:
- Boot Sequence: Simulates TEE initialization.
- Zero Trust: No cleartext content on disk.
- Physical Controls: Volume buttons mapped to graph navigation.

---
Built for the Google AI Studio Hackathon 2025. © Tot & Batet Media, 2025
