---
id: "SPEC-002"
title: "Recording UI/UX"
epic: "EPIC-004"
status: draft
author: null
reviewers: []
created_at: "2026-01-17"
updated_at: "2026-01-17"
---

# Recording UI/UX

## Overview

User interface and experience design for the screen recording flow, from app launch to saved recording.

## Problem Statement

Users need an intuitive, friction-free interface to start recording quickly. The UX should feel as fast as taking a screenshot.

## Goals

- Time to first recording < 60 seconds
- Minimal onboarding
- Clear recording state indicators
- Simple controls (start, pause, stop)
- 3-second countdown before recording

## Non-Goals

- Advanced editing features
- Complex settings panels
- Keyboard shortcut customization (for MVP)

## Detailed Design

### First Launch Flow

1. App opens
2. Minimal onboarding screen:
   - "Record screen" button
   - "Record with camera" button
3. OS permission prompts (screen, mic, camera)

### Recording Flow

```
Open App
  → Click "Record"
  → Choose screen/window/tab (OS picker)
  → (Optional) Enable camera toggle
  → 3s countdown
  → Recording starts
  → Recording indicator visible
  → Click Stop
  → Preview screen
  → Save file
```

### UI Components

#### Main Screen
- Large "Record" button (primary action)
- Camera toggle switch
- Settings icon (minimal for MVP)

#### Recording State
- Red recording indicator
- Timer showing duration
- Pause button
- Stop button

#### Countdown
- Full-screen overlay
- 3... 2... 1... animation
- Option to cancel

#### Preview Screen
- Video player with controls
- Play/pause button
- Timeline scrubber
- "Save" button (primary)
- "Delete" button (secondary)
- "Record Again" button

### Visual Design Principles

- Clean, minimal interface
- High contrast recording indicator
- Accessible controls (keyboard navigable)
- Responsive to different screen sizes

## Acceptance Criteria

- [ ] Main screen displays record button
- [ ] Camera toggle works
- [ ] 3-second countdown displays
- [ ] Recording indicator visible during recording
- [ ] Timer shows recording duration
- [ ] Pause/resume works correctly
- [ ] Stop ends recording and shows preview
- [ ] Preview plays the recording
- [ ] Save button saves to disk
- [ ] Delete button removes recording

## Open Questions

- [ ] Should countdown be skippable?
- [ ] Keyboard shortcuts for start/stop?
