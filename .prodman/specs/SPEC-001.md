---
id: "SPEC-001"
title: "Screen Recording Implementation"
epic: "EPIC-002"
status: draft
author: null
reviewers: []
created_at: "2026-01-17"
updated_at: "2026-01-17"
---

# Screen Recording Implementation

## Overview

Technical specification for implementing screen, audio, and webcam capture using browser MediaRecorder APIs within an Electron desktop application.

## Problem Statement

Users need a fast, reliable way to record their screen with optional audio and webcam overlay, saving recordings locally without any cloud dependency.

## Goals

- Capture screen at native resolution and 30 FPS
- Support entire screen, window, or tab selection
- Capture microphone audio
- Optional webcam picture-in-picture overlay
- Recording start latency < 500ms
- No dropped frames for 1080p

## Non-Goals

- System audio capture (excluded from MVP)
- Video trimming or editing
- Transcoding to other formats
- Cloud upload or sharing

## Detailed Design

### Architecture

```
UI Layer (React)
  ↓
Recording Controller
  ↓
Browser Media APIs
  ↓
MediaRecorder
  ↓
Blob chunks
  ↓
Local File System (via Electron IPC)
```

### Media APIs

#### Screen Capture
```typescript
const displayStream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    frameRate: 30,
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  },
  audio: false
});
```

#### Microphone Capture
```typescript
const audioStream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: false
});
```

#### Webcam Capture
```typescript
const webcamStream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 320 },
    height: { ideal: 240 }
  },
  audio: false
});
```

### Stream Combining

Combine screen and audio streams into single MediaRecorder:

```typescript
const combinedStream = new MediaStream([
  ...displayStream.getVideoTracks(),
  ...audioStream.getAudioTracks()
]);

const recorder = new MediaRecorder(combinedStream, {
  mimeType: 'video/webm;codecs=vp9'
});
```

### Webcam Overlay

Render webcam as canvas overlay composited with screen capture, or use CSS-based PiP overlay in the recording preview.

### File Output

- Format: `video/webm` with VP9 codec
- Filename: `recording-YYYY-MM-DD-HHMM.webm`
- Save via Electron's dialog and fs APIs

## Acceptance Criteria

- [ ] Screen capture works for entire screen
- [ ] Screen capture works for specific window
- [ ] Screen capture works for browser tab
- [ ] Microphone audio is captured
- [ ] Webcam overlay displays correctly
- [ ] Recording saves to webm file
- [ ] Recording start latency < 500ms
- [ ] No dropped frames at 1080p

## Open Questions

- [ ] Should we support multiple audio sources in future?
- [ ] Canvas compositing vs CSS overlay for webcam PiP?
