Below is a **clear, execution-ready PRD** for a **local-first Loom-like MVP**, optimized for **TypeScript, open-source libraries, and offline use**.
This is written the way an early engineering + product team would actually use it.

---

# PRD: Local-First Screen Recording MVP (Loom Alternative)

## Document Version

* **Author:** Dushyant
* **Version:** v1.0
* **Status:** MVP Definition
* **Target Users:** Builders, founders, PMs, sales engineers, remote teams
* **Platform:** Desktop (macOS first, Windows next)

---

## 1. Problem Statement

Async video communication tools like Loom:

* Require cloud accounts
* Upload sensitive data to third-party servers
* Add latency and friction for quick recordings
* Are not composable into local workflows or AI systems

**Users want:**
A fast, private, local tool to record screen + voice + face and immediately save or share files — **without relying on the cloud**.

---

## 2. Product Vision

> A **local-first, privacy-respecting screen recorder** that feels as fast as taking a screenshot.

This MVP focuses on:

* Speed
* Reliability
* Zero backend dependency
* Clean UX

Future versions can layer:

* AI summarization
* Search
* Sharing
* Knowledge capture

---

## 3. Goals & Non-Goals

### 🎯 Goals (MVP)

* Record screen + mic locally
* Optional webcam bubble
* Save recording as a local video file
* Extremely fast start/stop
* Simple, intuitive UX

### 🚫 Non-Goals (Out of Scope for MVP)

* Cloud hosting
* Team collaboration
* Comments / reactions
* AI transcription or summarization
* Mobile apps

---

## 4. Target Users & Use Cases

### Primary Users

* Developers explaining code
* PMs sharing walkthroughs
* Founders recording demos
* Sales engineers creating async explanations

### Core Use Cases

1. “Explain this flow quickly”
2. “Record a bug reproduction”
3. “Send async feedback”
4. “Document a feature”

---

## 5. Functional Requirements

### 5.1 Recording Capabilities (Must Have)

#### Screen Capture

* Record:

  * Entire screen
  * Application window
  * Browser tab
* Resolution: Native
* Frame rate: 30 FPS (configurable later)

#### Audio Capture

* Microphone input
* Single audio source (mic only for MVP)

#### Webcam (Optional)

* Toggle webcam on/off
* Picture-in-Picture overlay
* Fixed positions (bottom-right default)

---

### 5.2 Recording Controls

* Start recording
* Pause / resume
* Stop recording
* Countdown before start (3 seconds)

---

### 5.3 File Output

* Format: `webm` (MVP)
* Save to:

  * User-selected folder
  * Default recordings folder
* Auto filename:

  ```
  recording-YYYY-MM-DD-HHMM.webm
  ```

---

### 5.4 Playback

* Basic local playback screen
* Play / pause
* Scrub timeline
* Delete recording

---

## 6. User Experience Flow

### First Launch

1. App opens
2. Minimal onboarding screen:

   * “Record screen”
   * “Record with camera”
3. OS permission prompts (screen, mic, camera)

---

### Recording Flow

```
Open App
→ Click "Record"
→ Choose screen/window/tab
→ (Optional) Enable camera
→ 3s countdown
→ Recording starts
→ Stop
→ Preview
→ Save file
```

---

## 7. Technical Architecture

### 7.1 Stack

#### Frontend

* TypeScript
* React / Svelte (either acceptable)
* Vite

#### Desktop Shell

* **Electron (preferred for MVP speed)**

#### Media APIs

* `navigator.mediaDevices.getDisplayMedia`
* `navigator.mediaDevices.getUserMedia`
* `MediaRecorder`

#### Video Processing

* **None in MVP**

  * No trimming
  * No transcoding

---

### 7.2 Architecture Diagram (Logical)

```
UI Layer
  ↓
Recording Controller
  ↓
Browser Media APIs
  ↓
MediaRecorder
  ↓
Blob chunks
  ↓
Local File System
```

---

## 8. Non-Functional Requirements

### Performance

* Recording start latency < 500ms
* No dropped frames for 1080p

### Privacy

* No network calls
* No telemetry
* No cloud sync

### Reliability

* Crash-safe recording stop
* Graceful permission handling

---

## 9. OS Support

### MVP

* macOS (Apple Silicon + Intel)

### Post-MVP

* Windows
* Linux (best-effort)

---

## 10. Risks & Mitigations

| Risk                    | Mitigation            |
| ----------------------- | --------------------- |
| System audio complexity | Exclude from MVP      |
| Safari API limitations  | Desktop app only      |
| Large file sizes        | Warn user             |
| Permissions confusion   | Clear onboarding copy |

---

## 11. Success Metrics (MVP)

* Time to first recording < 60 seconds
* Recording success rate > 95%
* App cold start < 2 seconds
* Zero backend dependency

---

## 12. MVP Timeline (Aggressive but Realistic)

### Week 1

* App shell (Electron)
* Screen + mic recording
* Save file locally

### Week 2

* Webcam overlay
* Playback screen
* UX polish

---

## 13. Future Extensions (Not in MVP)

* Trimming (FFmpeg WASM)
* MP4 export
* AI summaries
* Search
* Sharing links
* Org/team mode

---

## 14. MVP Definition of Done

✅ Record screen + mic
✅ Optional webcam
✅ Local save
✅ No backend
✅ Works offline
✅ Stable for daily use

---
