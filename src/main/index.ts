import { app, BrowserWindow, ipcMain, dialog, desktopCapturer, session, shell, systemPreferences } from 'electron'

// ... existing code ...

// Check screen recording permission (macOS only)
ipcMain.handle('check-screen-permission', async () => {
  if (process.platform !== 'darwin') {
    return true
  }
  const status = systemPreferences.getMediaAccessStatus('screen')
  return status === 'granted'
})

// App lifecycle
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null
let selectedSourceId: string | null = null

function createWindow() {
  const iconPath = path.join(__dirname, '../../public/icon.png')

  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 600,
    minHeight: 400,
    icon: iconPath, // Window icon (Windows/Linux)
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    show: false
  })

  // Set up display media request handler for getDisplayMedia support
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] })

    // Use selected source if set, otherwise fall back to first screen
    let source = selectedSourceId
      ? sources.find(s => s.id === selectedSourceId)
      : undefined

    if (!source) {
      source = sources.find(s => s.id.startsWith('screen:')) || sources[0]
    }

    // Clear selected source after use
    selectedSourceId = null

    if (source) {
      callback({ video: source, audio: 'loopback' })
    } else {
      callback({})
    }
  })

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Set Dock icon on macOS (Dev mode)
  if (process.platform === 'darwin' && process.env.VITE_DEV_SERVER_URL) {
    app.dock.setIcon(iconPath)
  }
}

// Generate filename with timestamp
function generateFilename(): string {
  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const time = now.toTimeString().slice(0, 5).replace(':', '')
  return `recording-${date}-${time}.webm`
}

// Get default recordings directory
function getDefaultRecordingsDir(): string {
  const homeDir = app.getPath('home')
  const moviesDir = path.join(homeDir, 'Movies', 'Walkthru')

  if (!fs.existsSync(moviesDir)) {
    fs.mkdirSync(moviesDir, { recursive: true })
  }

  return moviesDir
}

// IPC Handlers
ipcMain.handle('save-recording', async (_event, data: Uint8Array) => {
  const defaultPath = path.join(getDefaultRecordingsDir(), generateFilename())

  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath,
    filters: [{ name: 'WebM Video', extensions: ['webm'] }]
  })

  if (canceled || !filePath) {
    return { success: false, reason: 'cancelled' }
  }

  try {
    const buffer = Buffer.from(data)
    fs.writeFileSync(filePath, buffer)
    return { success: true, filePath }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, reason: message }
  }
})

ipcMain.handle('get-save-path', async () => {
  return getDefaultRecordingsDir()
})

// Parse date from filename (recording-YYYY-MM-DD-HHMM.webm)
function parseDateFromFilename(filename: string): number {
  const match = filename.match(/recording-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})/)
  if (match) {
    const [, year, month, day, hour, minute] = match
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    ).getTime()
  }
  return 0
}

// List all recordings in the default directory
ipcMain.handle('list-recordings', async () => {
  const dir = getDefaultRecordingsDir()
  try {
    const files = fs.readdirSync(dir)
    return files
      .filter(f => f.endsWith('.webm') || f.endsWith('.mp4'))
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
  } catch {
    return []
  }
})

// Delete a recording (move to trash)
ipcMain.handle('delete-recording', async (_event, filepath: string) => {
  const dir = getDefaultRecordingsDir()
  // Validate path is within recordings directory
  if (!filepath.startsWith(dir)) {
    return { success: false, reason: 'Invalid path' }
  }
  try {
    await shell.trashItem(filepath)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, reason: message }
  }
})

// Export (copy) recording to user-selected location
ipcMain.handle('export-recording', async (_event, filepath: string) => {
  const filename = path.basename(filepath)
  const extension = path.extname(filename).toLowerCase()
  const filters =
    extension === '.mp4'
      ? [{ name: 'MP4 Video', extensions: ['mp4'] }]
      : extension === '.webm'
        ? [{ name: 'WebM Video', extensions: ['webm'] }]
        : [
            { name: 'Video Files', extensions: ['webm', 'mp4'] },
            { name: 'WebM Video', extensions: ['webm'] },
            { name: 'MP4 Video', extensions: ['mp4'] }
          ]

  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: filename,
    filters
  })

  if (canceled || !filePath) {
    return { success: false, reason: 'cancelled' }
  }

  try {
    fs.copyFileSync(filepath, filePath)
    return { success: true, filePath }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, reason: message }
  }
})

// Get available desktop sources (screens and windows)
ipcMain.handle('get-desktop-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 960, height: 540 },
    fetchWindowIcons: true
  })

  return sources.map(source => {
    // Check if thumbnail is empty (happens without screen recording permission)
    const thumbnailIsEmpty = source.thumbnail.isEmpty()

    return {
      id: source.id,
      name: source.name,
      thumbnail: thumbnailIsEmpty ? null : source.thumbnail.toDataURL(),
      appIcon: source.appIcon?.toDataURL() || null,
      type: source.id.startsWith('screen:') ? 'screen' : 'window'
    }
  })
})

// Set the recording source before starting
ipcMain.handle('set-recording-source', async (_event, sourceId: string) => {
  selectedSourceId = sourceId
  return { success: true }
})

// App lifecycle
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
