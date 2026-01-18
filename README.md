# Walkthru

> **Local-first screen recording application built for privacy and speed.**

Walkthru is a lightweight, privacy-focused screen recorder built with Electron and React. It saves all recordings locally to your machine (`~/Movies/Walkthru`) and works completely offline.

## Screenshots

<div align="center">
  <img src="ss1.png" width="45%" alt="Walkthru Dashboard" />
  <img src="ss2.png" width="45%" alt="Recording Interface" />
</div>

## Features

- **🎥 Screen & Window Recording**: Choose to record your entire screen or specific application windows.
- **🔒 Privacy First**: All data stays on your local device. No cloud uploads.
- **📸 Webcam Support**: Toggle webcam overlay (PiP) during recording.
- **🎙️ Audio Capture**: Record system audio and microphone input.
- **📂 File Management**: Built-in gallery to view, export, and delete recordings.
- **⚡ Fast & Native**: Built with Electron for native performance.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Shell**: Electron
- **Styling**: Vanilla CSS (Dark Mode optimized)
- **Build Tool**: Electron Builder

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/walkthru.git
   cd walkthru
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

### Building for Production

To create a distributable application (DMG for macOS, NSIS for Windows):

```bash
npm run build
```

The output will be in the `release/` directory.

## License

MIT
