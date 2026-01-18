---
id: "SPEC-004"
title: "Previous Recordings Panel Implementation"
epic: "EPIC-006"
status: draft
author: null
reviewers: []
created_at: "2026-01-18"
updated_at: "2026-01-18"
---

# Previous Recordings Panel Implementation

## Overview

Technical specification for implementing a left sidebar panel that displays previous recordings with management capabilities (play, export, delete).

## Problem Statement

Users cannot see or manage their previous recordings from within the app. They must manually navigate to `~/Movies/Walkthru/` in Finder to access files.

## Goals

- Display all recordings from the default directory in a sidebar
- Show thumbnails, filenames, dates, and file sizes
- Enable playback of recordings within the app
- Provide export functionality (copy to different location)
- Provide delete functionality (move to trash)
- Auto-refresh list after saving new recordings

## Non-Goals

- Cloud sync or backup
- Recording organization (folders, tags)
- Bulk operations (multi-select delete/export)
- Search or filter functionality

## Detailed Design

### Architecture

```
[Main Process]                      [Renderer Process]
     |                                     |
     | <-- list-recordings --------------- | useRecordings hook
     | --> Recording[] -----------------> |
     |                                     |
     | <-- delete-recording -------------- | RecordingItem
     | --> shell.trashItem()               |
     | --> { success } -----------------> |
     |                                     |
     | <-- export-recording -------------- | RecordingItem
     | --> showSaveDialog()                |
     | --> fs.copyFileSync()               |
     | --> { success, filePath } -------> |
```

### New IPC Handlers (Main Process)

```typescript
// src/main/index.ts

ipcMain.handle('list-recordings', async () => {
  const dir = getDefaultRecordingsDir()
  const files = fs.readdirSync(dir)
  return files
    .filter(f => f.endsWith('.webm'))
    .map(filename => {
      const filepath = path.join(dir, filename)
      const stats = fs.statSync(filepath)
      return {
        id: filename,
        filename,
        filepath,
        date: parseDateFromFilename(filename),
        size: stats.size
      }
    })
    .sort((a, b) => b.date - a.date)
})

ipcMain.handle('delete-recording', async (_event, filepath: string) => {
  // Validate path is within recordings directory
  const dir = getDefaultRecordingsDir()
  if (!filepath.startsWith(dir)) {
    return { success: false, reason: 'Invalid path' }
  }
  await shell.trashItem(filepath)
  return { success: true }
})

ipcMain.handle('export-recording', async (_event, filepath: string) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: path.basename(filepath),
    filters: [{ name: 'WebM Video', extensions: ['webm'] }]
  })
  if (canceled || !filePath) {
    return { success: false, reason: 'cancelled' }
  }
  fs.copyFileSync(filepath, filePath)
  return { success: true, filePath }
})
```

### Recording Interface

```typescript
interface Recording {
  id: string           // filename as unique ID
  filename: string     // "recording-2026-01-18-1430.webm"
  filepath: string     // "/Users/x/Movies/Walkthru/recording-..."
  date: number         // timestamp parsed from filename
  size: number         // file size in bytes
}
```

### New Components

#### useRecordings Hook

```typescript
// src/renderer/hooks/useRecordings.ts

interface UseRecordingsReturn {
  recordings: Recording[]
  isLoading: boolean
  error: string | null
  refreshRecordings: () => Promise<void>
  deleteRecording: (filepath: string) => Promise<boolean>
  exportRecording: (filepath: string) => Promise<boolean>
}
```

#### RecordingsPanel Component

```typescript
// src/renderer/components/RecordingsPanel.tsx

interface RecordingsPanelProps {
  recordings: Recording[]
  isLoading: boolean
  onPlay: (recording: Recording) => void
  onExport: (recording: Recording) => void
  onDelete: (recording: Recording) => void
}
```

#### RecordingItem Component

```typescript
// src/renderer/components/RecordingItem.tsx

interface RecordingItemProps {
  recording: Recording
  onPlay: () => void
  onExport: () => void
  onDelete: () => void
}
```

### Layout Changes

Refactor App.tsx from centered layout to sidebar + main content:

```tsx
<div className="app-layout">
  <aside className="sidebar">
    <RecordingsPanel ... />
  </aside>
  <main className="main-content">
    {/* existing content */}
  </main>
</div>
```

### CSS Structure

```css
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 280px;
  background: #15152a;
  border-right: 1px solid #2a2a4a;
}

.main-content {
  flex: 1;
  /* existing centered styles */
}
```

## Acceptance Criteria

- [ ] Sidebar displays on left side of landing page
- [ ] All .webm files from ~/Movies/Walkthru/ are listed
- [ ] Recordings show filename, formatted date, and file size
- [ ] Clicking a recording plays it in the main area
- [ ] Export button opens save dialog and copies file successfully
- [ ] Delete button removes file (to trash, not permanent)
- [ ] List auto-refreshes after saving a new recording
- [ ] Empty state message when no recordings exist
- [ ] Path validation prevents deleting files outside recordings directory

## Open Questions

- [ ] Should we generate video thumbnails? (adds complexity)
- [ ] Should sidebar be collapsible on smaller screens?
- [ ] Confirmation dialog before delete, or rely on trash recovery?
