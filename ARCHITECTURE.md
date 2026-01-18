# Architecture Documentation

## Overview

Walkthru is a desktop application built using **Electron**, **React**, and **TypeScript**. It follows a standard multi-process architecture typical of Electron apps:

1.  **Main Process**: Handles OS-level interactions (file system, window management, screen permissions).
2.  **Renderer Process**: Renders the UI (React) and handles user logic.
3.  **Preload Scripts**: Bridges the two using a secure `contextBridge`.

```mermaid
graph TD
    Main[Main Process (Node.js)] <-->|IPC| Preload[Preload Script]
    Preload <-->|Context Bridge| Renderer[Renderer Process (React)]
    Renderer -->|MediaRecorder API| MediaStream[Media Stream]
    Main -->|fs module| LocalStorage[Local File System]
```

## Directory Structure

```
walkthru/
├── src/
│   ├── main/           # Electron Main Process entry point
│   ├── preload/        # Context Bridge & Preload scripts
│   └── renderer/       # React Frontend
│       ├── components/ # Reusable UI components
│       ├── hooks/      # Custom React hooks (logic layer)
│       └── App.tsx     # Main application component
├── .prodman/           # Project management artifacts (Epics, Issues)
└── dist-electron/      # Compiled Electron main/preload scripts
```

## Key Components

### 1. Main Process (`src/main/index.ts`)
The backend of the application. It is responsible for:
-   **Window Creation**: Spawning the `BrowserWindow`.
-   **IPC Handlers**: Responding to requests from the renderer.
-   **File System**: Direct access to `fs` to save recordings to `~/Movies/Walkthru`.
-   **Desktop Capturer**: Using `desktopCapturer.getSources` to generate thumbnails for screen/window selection.
-   **Permissions**: Checking macOS Screen Recording permissions.

### 2. Renderer Process (`src/renderer/`)
The frontend interface built with **React** and **Vite**.
-   **`App.tsx`**: State machine managing the application lifecycle (Idle -> Source Select -> countdown -> Recording -> Review -> Idle).
-   **`useRecorder`**: A custom hook wrapping the `MediaRecorder` API to capture the stream.
-   **`SourcePicker` Component**: Displays available screens/windows using thumbnails fetched from the main process.

### 3. IPC Communication
Communication happens via specific channels defined in `src/preload/index.ts`.

| Channel | Direction | Purpose |
| :--- | :--- | :--- |
| `get-desktop-sources` | Renderer -> Main | Fetches list of screens and windows + thumbnails. |
| `save-recording` | Renderer -> Main | Sends the recorded `Uint8Array` to be written to disk. |
| `list-recordings` | Renderer -> Main | Reads the `Movies/Walkthru` directory for history. |
| `check-screen-permission` | Renderer -> Main | Checks if the OS has granted screen recording access. |

## Data Flow

1.  **Selection**: User clicks "Record" -> Renderer requests `get-desktop-sources`.
2.  **Capture**: User selects a source -> Renderer uses `navigator.mediaDevices.getUserMedia` with the source ID.
3.  **Recording**: `MediaRecorder` collects chunks of video data into a `Blob`.
4.  **Saving**: On stop, the `Blob` is converted to `Uint8Array` and sent via `save-recording`.
5.  **Storage**: Main process writes the buffer to `~/Movies/Walkthru/recording-[timestamp].webm`.

## Future Considerations

-   **Video Trimming**: Could be implemented using ffmpeg-wasm in the renderer or a native ffmpeg binary in the main process.
-   **Cloud Upload**: Adding an optional upload step after saving locally.
