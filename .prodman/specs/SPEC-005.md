---
id: "SPEC-005"
title: "Source Picker Implementation"
epic: "EPIC-007"
status: draft
author: null
reviewers: []
created_at: "2026-01-18"
updated_at: "2026-01-18"
---

# Source Picker Implementation

## Overview

Technical specification for implementing a source picker UI that allows users to select specific windows or screens before recording, instead of auto-selecting the first screen.

## Problem Statement

Currently the app automatically selects the first screen when recording starts. Users cannot choose to record a specific application window, which is a common use case for tutorials, demos, and documentation.

## Goals

- Show available screens and windows with live thumbnails
- Allow user to select any screen or specific window
- Display app icons for window sources
- Integrate cleanly into the existing recording flow
- Selected source should be used for the entire recording

## Non-Goals

- Recording multiple windows simultaneously
- Switching sources mid-recording
- Audio source selection (separate feature)
- Custom recording region (cropping)

## Detailed Design

### Architecture

```
[User clicks Record]
        |
        v
[Source Picker Modal]
        |
        | IPC: get-desktop-sources
        v
[Main Process: desktopCapturer.getSources()]
        |
        | returns Source[]
        v
[User selects source]
        |
        | IPC: set-recording-source
        v
[Main Process stores selectedSourceId]
        |
        v
[Countdown starts]
        |
        v
[getDisplayMedia called]
        |
        v
[setDisplayMediaRequestHandler uses stored sourceId]
        |
        v
[Recording starts with selected source]
```

### Modified App State Flow

```
idle -> source-select -> countdown -> recording -> paused -> stopped
                |
                v (cancel)
              idle
```

### Source Interface

```typescript
interface Source {
  id: string           // "screen:0:0" or "window:12345"
  name: string         // "Entire Screen" or "Visual Studio Code"
  thumbnail: string    // base64 data URL from desktopCapturer
  appIcon?: string     // app icon (windows only)
  type: 'screen' | 'window'
}
```

### New IPC Handlers (Main Process)

```typescript
// src/main/index.ts

let selectedSourceId: string | null = null

ipcMain.handle('get-desktop-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: true
  })

  return sources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL(),
    appIcon: source.appIcon?.toDataURL() || null,
    type: source.id.startsWith('screen:') ? 'screen' : 'window'
  }))
})

ipcMain.handle('set-recording-source', async (_event, sourceId: string) => {
  selectedSourceId = sourceId
  return { success: true }
})

// Modify existing handler
session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
  const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] })

  let source: DesktopCapturerSource | undefined

  if (selectedSourceId) {
    source = sources.find(s => s.id === selectedSourceId)
    selectedSourceId = null  // Clear after use
  }

  if (!source) {
    source = sources.find(s => s.id.startsWith('screen:')) || sources[0]
  }

  if (source) {
    callback({ video: source, audio: 'loopback' })
  } else {
    callback({})
  }
})
```

### New Components

#### useSourcePicker Hook

```typescript
// src/renderer/hooks/useSourcePicker.ts

interface UseSourcePickerReturn {
  sources: Source[]
  screens: Source[]
  windows: Source[]
  isLoading: boolean
  error: string | null
  refreshSources: () => Promise<void>
}
```

#### SourcePicker Component

```typescript
// src/renderer/components/SourcePicker.tsx

interface SourcePickerProps {
  isOpen: boolean
  onSelect: (source: Source) => void
  onCancel: () => void
}

// Structure:
// - Full-screen modal overlay
// - Header: "Choose what to share"
// - Tab bar: [Screens] [Windows]
// - Grid of SourceCard components
// - Footer: [Cancel] [Share] buttons
```

#### SourceCard Component

```typescript
// src/renderer/components/SourceCard.tsx

interface SourceCardProps {
  source: Source
  isSelected: boolean
  onSelect: () => void
}

// Structure:
// - Thumbnail image (16:9 aspect ratio)
// - Source name with optional app icon
// - Selected state border highlight
```

### CSS Structure

```css
.source-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 46, 0.95);
  z-index: 200;
}

.source-picker {
  max-width: 800px;
  max-height: 80vh;
  background: #1a1a2e;
  border-radius: 12px;
}

.source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.source-card.selected {
  border-color: #e63946;
  box-shadow: 0 0 20px rgba(230, 57, 70, 0.3);
}
```

### App.tsx Integration

```tsx
// New state
type AppState = 'idle' | 'source-select' | 'countdown' | 'recording' | 'paused' | 'stopped'

// Modified flow
const handleRecordClick = () => {
  setAppState('source-select')
}

const handleSourceSelect = async (source: Source) => {
  await window.electronAPI.invoke('set-recording-source', source.id)
  setAppState('countdown')
}

const handleSourceCancel = () => {
  setAppState('idle')
}
```

## Acceptance Criteria

- [ ] Clicking Record opens source picker modal
- [ ] All screens are listed with thumbnails
- [ ] All windows are listed with thumbnails and app icons
- [ ] Tabs switch between Screens and Windows views
- [ ] Clicking a source card selects it (visual feedback)
- [ ] Share button starts countdown with selected source
- [ ] Cancel button returns to idle state
- [ ] Recording captures only the selected source
- [ ] Source picker handles case of no available sources gracefully

## Open Questions

- [ ] Should thumbnails refresh while picker is open?
- [ ] Double-click to select and immediately start?
- [ ] Remember last selected source type (screen vs window)?
- [ ] Keyboard navigation support (arrow keys, Enter, Escape)?
