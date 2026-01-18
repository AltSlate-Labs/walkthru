---
id: "SPEC-003"
title: "File Output & Management"
epic: "EPIC-005"
status: draft
author: null
reviewers: []
created_at: "2026-01-17"
updated_at: "2026-01-17"
---

# File Output & Management

## Overview

Specification for video file output format, naming conventions, storage locations, and file management operations.

## Problem Statement

Users need recordings saved reliably to their local filesystem with sensible defaults and the ability to choose save locations.

## Goals

- WebM format output (no transcoding)
- Auto-generated filenames with timestamps
- User-selectable save location
- Default recordings folder
- Delete functionality
- Crash-safe recording stop

## Non-Goals

- MP4 export (future)
- Video trimming (future)
- Cloud backup
- Recording library/gallery view

## Detailed Design

### File Format

**Container:** WebM
**Video Codec:** VP9
**Audio Codec:** Opus
**MIME Type:** `video/webm;codecs=vp9,opus`

Rationale: WebM is natively supported by MediaRecorder, requires no transcoding, and provides good quality/size ratio.

### Filename Convention

```
recording-YYYY-MM-DD-HHMM.webm
```

Examples:
- `recording-2026-01-17-1430.webm`
- `recording-2026-01-17-0915.webm`

### Storage Locations

#### Default Location
- macOS: `~/Movies/Walkthru/`
- Windows: `Videos\Walkthru\`
- Linux: `~/Videos/Walkthru/`

#### Custom Location
User can select custom folder via native file dialog.

### File Operations

#### Save
```typescript
// Via Electron IPC
ipcRenderer.invoke('save-recording', {
  blob: recordingBlob,
  filename: generateFilename(),
  path: selectedPath || defaultPath
});
```

#### Delete
```typescript
ipcRenderer.invoke('delete-recording', {
  filepath: recordingPath
});
```

### Crash Safety

- Write blob chunks incrementally during recording
- On crash, attempt to salvage partial recording
- Show recovery option on next launch if partial file detected

### File Size Considerations

- Warn user if recording exceeds 1GB
- Show estimated file size during recording
- Consider implementing max duration limit

## Acceptance Criteria

- [ ] Recordings save as .webm files
- [ ] Filename follows naming convention
- [ ] Default save location works
- [ ] Custom save location via dialog
- [ ] Delete removes file from disk
- [ ] Partial recovery on crash
- [ ] File size warning for large recordings

## Open Questions

- [ ] Should we show a recording library?
- [ ] Max recording duration limit?
- [ ] Compression quality settings?
